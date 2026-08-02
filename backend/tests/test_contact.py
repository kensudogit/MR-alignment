"""お問い合わせ。PostgreSQL への永続化が主眼。"""
from __future__ import annotations

from unittest.mock import AsyncMock, patch

import pytest
from httpx import AsyncClient
from sqlalchemy import func, select

from app.models import Contact, ContactMethod, ContactStatus, Urgency
from tests.conftest import auth_headers

VALID_PAYLOAD = {
    "name": "山田太郎",
    "email": "yamada@example.com",
    "organization": "株式会社テスト",
    "role": "情報システム部長",
    "subject": "システム刷新について",
    "message": "既存システムの刷新を検討しています。ご相談させてください。",
    "contactMethod": "email",
    "urgency": "high",
}


@pytest.fixture(autouse=True)
def _no_mail():
    """テスト中は実際にメールを送らない。"""
    with patch("app.routers.contact.send_contact_notification", new=AsyncMock(return_value=True)):
        yield


# --------------------------------------------------------------- 永続化


async def test_お問い合わせがDBに保存される(client: AsyncClient, db_session) -> None:
    """旧実装はログ出力のみで内容が失われていた。"""
    response = await client.post("/api/contact", json=VALID_PAYLOAD)

    assert response.status_code == 201
    body = response.json()
    assert body["contact_id"].startswith("CT-")

    contact = await db_session.scalar(
        select(Contact).where(Contact.reference == body["contact_id"])
    )
    assert contact is not None
    assert contact.name == "山田太郎"
    assert contact.email == "yamada@example.com"
    assert contact.organization == "株式会社テスト"
    assert contact.subject == "システム刷新について"
    assert contact.urgency is Urgency.HIGH
    assert contact.contact_method is ContactMethod.EMAIL
    assert contact.status is ContactStatus.NEW


async def test_受付番号は毎回異なる(client: AsyncClient) -> None:
    """旧実装は 'CT-' + time() で同一秒内に衝突した。"""
    references = set()
    for _ in range(5):
        response = await client.post("/api/contact", json=VALID_PAYLOAD)
        references.add(response.json()["contact_id"])

    assert len(references) == 5


async def test_未ログインでも送信できる(client: AsyncClient, db_session) -> None:
    response = await client.post("/api/contact", json=VALID_PAYLOAD)
    assert response.status_code == 201

    contact = await db_session.scalar(select(Contact))
    assert contact is not None
    assert contact.user_id is None


async def test_ログイン中はユーザーが紐づく(client: AsyncClient, db_session) -> None:
    headers = await auth_headers(client, email="member@example.com")

    response = await client.post("/api/contact", json=VALID_PAYLOAD, headers=headers)
    assert response.status_code == 201

    contact = await db_session.scalar(
        select(Contact).where(Contact.reference == response.json()["contact_id"])
    )
    assert contact is not None
    assert contact.user_id is not None


async def test_IPとUserAgentが記録される(client: AsyncClient, db_session) -> None:
    await client.post(
        "/api/contact",
        json=VALID_PAYLOAD,
        headers={"User-Agent": "TestAgent/1.0", "X-Forwarded-For": "203.0.113.10, 10.0.0.1"},
    )

    contact = await db_session.scalar(select(Contact))
    assert contact is not None
    assert contact.ip_address == "203.0.113.10"  # 先頭の値が元のクライアント
    assert contact.user_agent == "TestAgent/1.0"


async def test_通知メールが呼ばれる(client: AsyncClient) -> None:
    with patch(
        "app.routers.contact.send_contact_notification", new=AsyncMock(return_value=True)
    ) as mock_send:
        await client.post("/api/contact", json=VALID_PAYLOAD)

    mock_send.assert_awaited_once()


async def test_通知が例外を投げても500にならない(client: AsyncClient) -> None:
    """バックグラウンドタスクの例外が伝播すると受付がエラー扱いになる。"""
    with patch(
        "app.routers.contact.send_contact_notification",
        new=AsyncMock(side_effect=RuntimeError("unexpected")),
    ):
        response = await client.post("/api/contact", json=VALID_PAYLOAD)

    assert response.status_code == 201


async def test_メール送信に失敗しても受付は成立する(client: AsyncClient, db_session) -> None:
    """DB に保存済みのため、メールが飛ばなくても内容は失われない。"""
    with patch(
        "app.routers.contact.send_contact_notification",
        new=AsyncMock(side_effect=RuntimeError("SMTP down")),
    ):
        response = await client.post("/api/contact", json=VALID_PAYLOAD)

    assert response.status_code == 201
    assert await db_session.scalar(select(func.count(Contact.id))) == 1


# --------------------------------------------------------------- バリデーション


@pytest.mark.parametrize(
    "field,value",
    [
        ("email", "not-an-email"),
        ("name", ""),
        ("subject", ""),
        ("message", ""),
        ("urgency", "extreme"),
        ("contactMethod", "telepathy"),
    ],
)
async def test_不正な入力は拒否される(client: AsyncClient, field: str, value: str) -> None:
    payload = {**VALID_PAYLOAD, field: value}
    response = await client.post("/api/contact", json=payload)
    assert response.status_code == 422


async def test_本文の長さ制限が効く(client: AsyncClient) -> None:
    payload = {**VALID_PAYLOAD, "message": "あ" * 2001}
    response = await client.post("/api/contact", json=payload)
    assert response.status_code == 422


async def test_任意項目は省略できる(client: AsyncClient) -> None:
    payload = {
        "name": "最小構成",
        "email": "min@example.com",
        "subject": "件名",
        "message": "本文",
    }
    response = await client.post("/api/contact", json=payload)
    assert response.status_code == 201


# --------------------------------------------------------------- 参照


async def test_自分の問い合わせ一覧を取得できる(client: AsyncClient) -> None:
    headers = await auth_headers(client, email="list@example.com")

    for i in range(3):
        await client.post(
            "/api/contact", json={**VALID_PAYLOAD, "subject": f"件名{i}"}, headers=headers
        )

    response = await client.get("/api/contact", headers=headers)
    assert response.status_code == 200
    assert response.json()["total"] == 3


async def test_他人の問い合わせは見えない(client: AsyncClient) -> None:
    owner = await auth_headers(client, email="owner@example.com")
    other = await auth_headers(client, email="other@example.com")

    created = await client.post("/api/contact", json=VALID_PAYLOAD, headers=owner)
    reference = created.json()["contact_id"]

    # 受付番号の存在を教えないよう 404 を返す
    response = await client.get(f"/api/contact/{reference}", headers=other)
    assert response.status_code == 404


async def test_認証なしでは一覧を取得できない(client: AsyncClient) -> None:
    assert (await client.get("/api/contact")).status_code == 401
