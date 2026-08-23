"""面談予約。

以前は「お問い合わせの本文に予約内容を書き込む」実装だったため、
希望日で検索することも、枠の重複を検知することもできなかった。
ここでは構造化された予約として保存されること、
申込者へ控えが届くこと、管理者だけが一覧を見られることを確認する。
"""
from __future__ import annotations

from datetime import date, timedelta
from unittest.mock import AsyncMock, patch

import pytest
from httpx import AsyncClient
from sqlalchemy import select

from app.models import Appointment, AppointmentStatus
from app.services.appointment import MAX_LEAD_DAYS, is_business_day, today_jst
from tests.conftest import admin_headers, auth_headers


def business_day(offset: int = 1) -> date:
    """今日から offset 日以降で、最初の平日。"""
    target = today_jst() + timedelta(days=offset)
    while not is_business_day(target):
        target += timedelta(days=1)
    return target


def weekend_day() -> date:
    target = today_jst() + timedelta(days=1)
    while is_business_day(target):
        target += timedelta(days=1)
    return target


def payload(**overrides) -> dict:
    base = {
        "name": "山田太郎",
        "email": "yamada@example.com",
        "phone": "090-1234-5678",
        "company": "株式会社テスト",
        "department": "情報システム部",
        "position": "部長",
        "consultationType": "it-strategy",
        "preferredDate": business_day().isoformat(),
        "preferredTime": "10:00-11:00",
        "message": "基幹システムの刷新について相談したい",
    }
    base.update(overrides)
    return base


@pytest.fixture(autouse=True)
def _no_mail():
    """テスト中は実際にメールを送らない。"""
    with (
        patch(
            "app.routers.appointments.send_appointment_ack", new=AsyncMock(return_value=True)
        ),
        patch(
            "app.routers.appointments.send_appointment_notification",
            new=AsyncMock(return_value=True),
        ),
    ):
        yield


# --------------------------------------------------------------- 永続化


async def test_予約が構造化されて保存される(client: AsyncClient, db_session) -> None:
    """旧実装では希望日時が問い合わせ本文のテキストでしかなかった。"""
    response = await client.post("/api/appointments", json=payload())

    assert response.status_code == 201, response.text
    body = response.json()
    assert body["reference"].startswith("AP-")
    assert body["appointment_status"] == "pending"

    appointment = await db_session.scalar(
        select(Appointment).where(Appointment.reference == body["reference"])
    )
    assert appointment is not None
    assert appointment.name == "山田太郎"
    assert appointment.phone == "090-1234-5678"
    assert appointment.company == "株式会社テスト"
    assert appointment.department == "情報システム部"
    assert appointment.consultation_type == "it-strategy"
    # 日付が独立した列として入っている＝日付で検索できる
    assert appointment.preferred_date == business_day()
    assert appointment.preferred_slot == "10:00-11:00"
    assert appointment.status is AppointmentStatus.PENDING


async def test_受付番号は毎回異なる(client: AsyncClient) -> None:
    references = set()
    slots = ["09:00-10:00", "10:00-11:00", "11:00-12:00", "13:00-14:00"]
    for slot in slots:
        response = await client.post("/api/appointments", json=payload(preferredTime=slot))
        references.add(response.json()["reference"])

    assert len(references) == len(slots)


async def test_未ログインでも申し込める(client: AsyncClient, db_session) -> None:
    response = await client.post("/api/appointments", json=payload())
    assert response.status_code == 201

    appointment = await db_session.scalar(select(Appointment))
    assert appointment is not None
    assert appointment.user_id is None


async def test_ログイン中はユーザーが紐づく(client: AsyncClient, db_session) -> None:
    headers = await auth_headers(client, email="member@example.com")

    response = await client.post("/api/appointments", json=payload(), headers=headers)
    assert response.status_code == 201

    appointment = await db_session.scalar(select(Appointment))
    assert appointment is not None
    assert appointment.user_id is not None


async def test_空欄の任意項目はNoneになる(client: AsyncClient, db_session) -> None:
    """フォームは未入力欄を空文字で送ってくる。"""
    response = await client.post(
        "/api/appointments", json=payload(department="", position="", message="")
    )
    assert response.status_code == 201

    appointment = await db_session.scalar(select(Appointment))
    assert appointment.department is None
    assert appointment.position is None
    assert appointment.message is None


# --------------------------------------------------------------- メール


async def test_申込者への控えと担当者通知の両方が送られる(client: AsyncClient) -> None:
    with (
        patch(
            "app.routers.appointments.send_appointment_ack", new=AsyncMock(return_value=True)
        ) as ack,
        patch(
            "app.routers.appointments.send_appointment_notification",
            new=AsyncMock(return_value=True),
        ) as notify,
    ):
        await client.post("/api/appointments", json=payload())

    ack.assert_awaited_once()
    notify.assert_awaited_once()


async def test_メールの送信結果が記録される(client: AsyncClient, db_engine) -> None:
    """「控えが届かない」と言われたときに、送ったかどうかを確認できるようにする。"""
    with (
        patch(
            "app.routers.appointments.send_appointment_ack", new=AsyncMock(return_value=True)
        ),
        patch(
            "app.routers.appointments.send_appointment_notification",
            new=AsyncMock(return_value=False),
        ),
    ):
        response = await client.post("/api/appointments", json=payload())

    reference = response.json()["reference"]

    from sqlalchemy.ext.asyncio import async_sessionmaker

    async with async_sessionmaker(bind=db_engine, expire_on_commit=False)() as session:
        appointment = await session.scalar(
            select(Appointment).where(Appointment.reference == reference)
        )
        assert appointment.ack_sent is True
        assert appointment.staff_notified is False


async def test_メール送信が失敗しても予約は成立する(client: AsyncClient, db_session) -> None:
    with patch(
        "app.routers.appointments.send_appointment_ack",
        new=AsyncMock(side_effect=RuntimeError("SMTP down")),
    ):
        response = await client.post("/api/appointments", json=payload())

    assert response.status_code == 201
    assert await db_session.scalar(select(Appointment)) is not None


# --------------------------------------------------------------- 枠の重複


async def test_同じ枠は二重に予約できない(client: AsyncClient) -> None:
    first = await client.post("/api/appointments", json=payload())
    assert first.status_code == 201

    second = await client.post("/api/appointments", json=payload(email="other@example.com"))
    assert second.status_code == 409
    assert "埋まっています" in second.json()["message"]


async def test_キャンセルされた枠は再び予約できる(client: AsyncClient) -> None:
    headers = await admin_headers(client)
    created = await client.post("/api/appointments", json=payload())
    reference = created.json()["reference"]

    cancelled = await client.patch(
        f"/api/appointments/{reference}", json={"status": "cancelled"}, headers=headers
    )
    assert cancelled.status_code == 200

    retry = await client.post("/api/appointments", json=payload(email="other@example.com"))
    assert retry.status_code == 201


async def test_別の日の同じ時間帯は予約できる(client: AsyncClient) -> None:
    await client.post("/api/appointments", json=payload())

    other_day = business_day(offset=8).isoformat()
    response = await client.post("/api/appointments", json=payload(preferredDate=other_day))
    assert response.status_code == 201


# --------------------------------------------------------------- バリデーション


@pytest.mark.parametrize(
    "field,value",
    [
        ("email", "not-an-email"),
        ("name", ""),
        ("phone", ""),
        ("company", ""),
        ("consultationType", "unknown-topic"),
        ("preferredTime", "23:00-24:00"),
    ],
)
async def test_不正な入力は拒否される(client: AsyncClient, field: str, value: str) -> None:
    response = await client.post("/api/appointments", json=payload(**{field: value}))
    assert response.status_code == 422


async def test_過去の日付は拒否される(client: AsyncClient) -> None:
    past = (today_jst() - timedelta(days=1)).isoformat()
    response = await client.post("/api/appointments", json=payload(preferredDate=past))
    assert response.status_code == 422


async def test_土日は拒否される(client: AsyncClient) -> None:
    response = await client.post(
        "/api/appointments", json=payload(preferredDate=weekend_day().isoformat())
    )
    assert response.status_code == 422


async def test_先すぎる日付は拒否される(client: AsyncClient) -> None:
    far = (today_jst() + timedelta(days=MAX_LEAD_DAYS + 10)).isoformat()
    response = await client.post("/api/appointments", json=payload(preferredDate=far))
    assert response.status_code == 422


# --------------------------------------------------------------- 空き枠


async def test_空き枠の取得(client: AsyncClient) -> None:
    target = business_day()
    await client.post("/api/appointments", json=payload(preferredTime="10:00-11:00"))

    response = await client.get("/api/appointments/availability", params={"date": target})
    assert response.status_code == 200

    body = response.json()
    assert body["bookable"] is True
    taken = {s["slot"] for s in body["slots"] if not s["available"]}
    assert taken == {"10:00-11:00"}


async def test_土日の空き枠は理由つきで全て埋まって見える(client: AsyncClient) -> None:
    response = await client.get(
        "/api/appointments/availability", params={"date": weekend_day().isoformat()}
    )
    body = response.json()

    assert body["bookable"] is False
    assert body["reason"] == "土日は受け付けておりません"
    assert all(not s["available"] for s in body["slots"])


async def test_空き枠の取得に認証は要らない(client: AsyncClient) -> None:
    """フォームは未ログインの見込み客が使う。"""
    response = await client.get(
        "/api/appointments/availability", params={"date": business_day().isoformat()}
    )
    assert response.status_code == 200


# --------------------------------------------------------------- 管理用


async def test_一覧は認証なしでは取得できない(client: AsyncClient) -> None:
    assert (await client.get("/api/appointments")).status_code == 401


async def test_一般ユーザーは一覧を取得できない(client: AsyncClient) -> None:
    """予約には氏名・電話番号が含まれる。ログイン済みというだけでは通さない。"""
    headers = await auth_headers(client, email="member@example.com")
    assert (await client.get("/api/appointments", headers=headers)).status_code == 403


async def test_管理者は一覧を取得できる(client: AsyncClient) -> None:
    await client.post("/api/appointments", json=payload(preferredTime="09:00-10:00"))
    await client.post("/api/appointments", json=payload(preferredTime="11:00-12:00"))

    headers = await admin_headers(client)
    response = await client.get("/api/appointments", headers=headers)

    assert response.status_code == 200
    body = response.json()
    assert body["total"] == 2
    assert body["items"][0]["consultation_label"] == "IT戦略"


async def test_状態で絞り込める(client: AsyncClient) -> None:
    headers = await admin_headers(client)
    created = await client.post("/api/appointments", json=payload())
    await client.patch(
        f"/api/appointments/{created.json()['reference']}",
        json={"status": "confirmed"},
        headers=headers,
    )
    await client.post("/api/appointments", json=payload(preferredTime="14:00-15:00"))

    confirmed = await client.get(
        "/api/appointments", params={"status": "confirmed"}, headers=headers
    )
    assert confirmed.json()["total"] == 1

    pending = await client.get(
        "/api/appointments", params={"status": "pending"}, headers=headers
    )
    assert pending.json()["total"] == 1


async def test_管理者は詳細を取得できる(client: AsyncClient) -> None:
    created = await client.post("/api/appointments", json=payload())
    reference = created.json()["reference"]

    headers = await admin_headers(client)
    response = await client.get(f"/api/appointments/{reference}", headers=headers)

    assert response.status_code == 200
    body = response.json()
    assert body["phone"] == "090-1234-5678"
    assert body["message"] == "基幹システムの刷新について相談したい"


async def test_確定すると確定日時が入る(client: AsyncClient) -> None:
    created = await client.post("/api/appointments", json=payload())
    reference = created.json()["reference"]

    headers = await admin_headers(client)
    response = await client.patch(
        f"/api/appointments/{reference}",
        json={"status": "confirmed", "staff_note": "訪問で対応"},
        headers=headers,
    )

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "confirmed"
    assert body["confirmed_at"] is not None
    assert body["staff_note"] == "訪問で対応"


async def test_キャンセルを取り消せるのは枠が空いている場合だけ(client: AsyncClient) -> None:
    headers = await admin_headers(client)

    first = await client.post("/api/appointments", json=payload())
    reference = first.json()["reference"]
    await client.patch(
        f"/api/appointments/{reference}", json={"status": "cancelled"}, headers=headers
    )

    # 空いた枠に別の予約が入る
    await client.post("/api/appointments", json=payload(email="other@example.com"))

    # 元の予約を戻そうとしても、枠が埋まっているので通らない
    response = await client.patch(
        f"/api/appointments/{reference}", json={"status": "pending"}, headers=headers
    )
    assert response.status_code == 409


async def test_存在しない受付番号は404(client: AsyncClient) -> None:
    headers = await admin_headers(client)
    response = await client.get("/api/appointments/AP-20260101-DEADBEEF", headers=headers)
    assert response.status_code == 404


async def test_実施済みにしても確定日時は残る(client: AsyncClient) -> None:
    """実施したのなら確定していたはず。記録を消さない。"""
    headers = await admin_headers(client)
    reference = (await client.post("/api/appointments", json=payload())).json()["reference"]

    await client.patch(
        f"/api/appointments/{reference}", json={"status": "confirmed"}, headers=headers
    )
    completed = await client.patch(
        f"/api/appointments/{reference}", json={"status": "completed"}, headers=headers
    )

    assert completed.json()["confirmed_at"] is not None


async def test_控えの送信が失敗しても担当者通知は送る(client: AsyncClient) -> None:
    """控えの失敗で通知まで止めると、予約が入ったこと自体に誰も気づけない。"""
    with (
        patch(
            "app.routers.appointments.send_appointment_ack",
            new=AsyncMock(side_effect=RuntimeError("SMTP down")),
        ),
        patch(
            "app.routers.appointments.send_appointment_notification",
            new=AsyncMock(return_value=True),
        ) as notify,
    ):
        response = await client.post("/api/appointments", json=payload())

    assert response.status_code == 201
    notify.assert_awaited_once()


# --------------------------------------------------------------- 確定・取消の連絡


@pytest.fixture
def notice_mock():
    """状態通知の送信をモックする。"""
    with patch(
        "app.routers.appointments.send_appointment_status_notice",
        new=AsyncMock(return_value=True),
    ) as mock:
        yield mock


async def test_確定にすると申込者へ自動で連絡が飛ぶ(client: AsyncClient, notice_mock) -> None:
    headers = await admin_headers(client)
    reference = (await client.post("/api/appointments", json=payload())).json()["reference"]

    response = await client.patch(
        f"/api/appointments/{reference}", json={"status": "confirmed"}, headers=headers
    )

    assert response.status_code == 200
    notice_mock.assert_awaited_once()
    # 送れたことが記録され、管理画面で「未送信」を見つけられる
    assert response.json()["status_notice_sent_at"] is not None


async def test_キャンセルでも申込者へ連絡が飛ぶ(client: AsyncClient, notice_mock) -> None:
    headers = await admin_headers(client)
    reference = (await client.post("/api/appointments", json=payload())).json()["reference"]

    await client.patch(
        f"/api/appointments/{reference}", json={"status": "cancelled"}, headers=headers
    )

    notice_mock.assert_awaited_once()


async def test_notifyをfalseにすると連絡しない(client: AsyncClient, notice_mock) -> None:
    """電話などで既に伝えてある場合に、二重の連絡を避ける。"""
    headers = await admin_headers(client)
    reference = (await client.post("/api/appointments", json=payload())).json()["reference"]

    response = await client.patch(
        f"/api/appointments/{reference}",
        json={"status": "confirmed", "notify": False},
        headers=headers,
    )

    notice_mock.assert_not_awaited()
    assert response.json()["status"] == "confirmed"
    assert response.json()["status_notice_sent_at"] is None


async def test_同じ状態に変えても連絡しない(client: AsyncClient, notice_mock) -> None:
    """二度押しで同じメールが二通届かないようにする。"""
    headers = await admin_headers(client)
    reference = (await client.post("/api/appointments", json=payload())).json()["reference"]

    await client.patch(
        f"/api/appointments/{reference}", json={"status": "confirmed"}, headers=headers
    )
    await client.patch(
        f"/api/appointments/{reference}", json={"status": "confirmed"}, headers=headers
    )

    assert notice_mock.await_count == 1


async def test_メモだけの更新では連絡しない(client: AsyncClient, notice_mock) -> None:
    headers = await admin_headers(client)
    reference = (await client.post("/api/appointments", json=payload())).json()["reference"]

    await client.patch(
        f"/api/appointments/{reference}", json={"staff_note": "折り返し電話済み"}, headers=headers
    )

    notice_mock.assert_not_awaited()


async def test_状態を戻すと連絡済みの記録も消える(client: AsyncClient, notice_mock) -> None:
    """未確定に戻した時点で、申込者が知っている内容は古くなる。"""
    headers = await admin_headers(client)
    reference = (await client.post("/api/appointments", json=payload())).json()["reference"]

    await client.patch(
        f"/api/appointments/{reference}", json={"status": "confirmed"}, headers=headers
    )
    back = await client.patch(
        f"/api/appointments/{reference}", json={"status": "pending"}, headers=headers
    )

    assert back.json()["status_notice_sent_at"] is None
    # 未確定に戻すこと自体は申込者へ知らせる出来事ではない
    assert notice_mock.await_count == 1


async def test_連絡に失敗しても状態は変わる(client: AsyncClient) -> None:
    """メールが送れなくても確定操作は成立させる。画面側で未送信と分かる。"""
    headers = await admin_headers(client)
    reference = (await client.post("/api/appointments", json=payload())).json()["reference"]

    with patch(
        "app.routers.appointments.send_appointment_status_notice",
        new=AsyncMock(side_effect=RuntimeError("SMTP down")),
    ):
        response = await client.patch(
            f"/api/appointments/{reference}", json={"status": "confirmed"}, headers=headers
        )

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "confirmed"
    assert body["status_notice_sent_at"] is None
