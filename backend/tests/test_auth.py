"""認証まわりの振る舞い。旧実装の欠陥が再発しないことを検証する。"""
from __future__ import annotations

import pytest
from httpx import AsyncClient
from sqlalchemy import select

from app.models import User
from app.security import verify_password
from tests.conftest import VALID_PASSWORD, auth_headers, register_user


# --------------------------------------------------------------- 登録


async def test_登録でorganizationとroleが保存される(client: AsyncClient) -> None:
    """旧 Laravel 実装ではカラムが存在せず保存できていなかった。"""
    data = await register_user(
        client,
        email="org@example.com",
        organization="株式会社テスト",
        role="情報システム部長",
    )

    assert data["user"]["organization"] == "株式会社テスト"
    assert data["user"]["role"] == "情報システム部長"
    assert data["token"]
    assert data["expires_in"] > 0


async def test_パスワードはハッシュ化して保存される(client: AsyncClient, db_session) -> None:
    await register_user(client, email="hash@example.com")

    user = await db_session.scalar(select(User).where(User.email == "hash@example.com"))
    assert user is not None
    assert user.hashed_password != VALID_PASSWORD
    assert user.hashed_password.startswith("$2")  # bcrypt
    assert verify_password(VALID_PASSWORD, user.hashed_password)


async def test_レスポンスにパスワードが含まれない(client: AsyncClient) -> None:
    response = await client.post(
        "/api/auth/register",
        json={
            "name": "テスト",
            "email": "leak@example.com",
            "password": VALID_PASSWORD,
            "password_confirmation": VALID_PASSWORD,
        },
    )
    assert VALID_PASSWORD not in response.text
    assert "hashed_password" not in response.text
    assert "token_version" not in response.text


@pytest.mark.parametrize(
    "password",
    ["short1", "onlyletters", "12345678", "abc"],
)
async def test_弱いパスワードは拒否される(client: AsyncClient, password: str) -> None:
    response = await client.post(
        "/api/auth/register",
        json={
            "name": "テスト",
            "email": "weak@example.com",
            "password": password,
            "password_confirmation": password,
        },
    )
    assert response.status_code == 422
    assert "password" in response.json()["errors"]


async def test_パスワード確認が一致しないと拒否される(client: AsyncClient) -> None:
    response = await client.post(
        "/api/auth/register",
        json={
            "name": "テスト",
            "email": "mismatch@example.com",
            "password": VALID_PASSWORD,
            "password_confirmation": "different123",
        },
    )
    assert response.status_code == 422


async def test_メールアドレスの重複は拒否される(client: AsyncClient) -> None:
    await register_user(client, email="dup@example.com")

    response = await client.post(
        "/api/auth/register",
        json={
            "name": "別人",
            "email": "dup@example.com",
            "password": VALID_PASSWORD,
            "password_confirmation": VALID_PASSWORD,
        },
    )
    assert response.status_code == 422


async def test_不正なメールアドレスは拒否される(client: AsyncClient) -> None:
    response = await client.post(
        "/api/auth/register",
        json={
            "name": "テスト",
            "email": "not-an-email",
            "password": VALID_PASSWORD,
            "password_confirmation": VALID_PASSWORD,
        },
    )
    assert response.status_code == 422


# --------------------------------------------------------------- ログイン


async def test_正しい資格情報でログインできる(client: AsyncClient) -> None:
    await register_user(client, email="login@example.com")

    response = await client.post(
        "/api/auth/login",
        json={"email": "login@example.com", "password": VALID_PASSWORD},
    )
    assert response.status_code == 200
    assert response.json()["token"]


async def test_未登録メールと誤パスワードで同じ応答を返す(client: AsyncClient) -> None:
    """応答が異なると、登録済みアドレスを総当たりで特定できてしまう。"""
    await register_user(client, email="exists@example.com")

    wrong_password = await client.post(
        "/api/auth/login",
        json={"email": "exists@example.com", "password": "wrongpassword123"},
    )
    unknown_email = await client.post(
        "/api/auth/login",
        json={"email": "unknown@example.com", "password": VALID_PASSWORD},
    )

    assert wrong_password.status_code == 401
    assert unknown_email.status_code == 401
    assert wrong_password.json()["message"] == unknown_email.json()["message"]


async def test_ログイン時刻が記録される(client: AsyncClient, db_session) -> None:
    await register_user(client, email="lastlogin@example.com")
    await client.post(
        "/api/auth/login",
        json={"email": "lastlogin@example.com", "password": VALID_PASSWORD},
    )

    user = await db_session.scalar(select(User).where(User.email == "lastlogin@example.com"))
    assert user is not None
    assert user.last_login_at is not None


# --------------------------------------------------------------- 認証ガード


async def test_認証なしでmeを呼ぶと401(client: AsyncClient) -> None:
    assert (await client.get("/api/auth/me")).status_code == 401


async def test_不正なトークンは拒否される(client: AsyncClient) -> None:
    response = await client.get(
        "/api/auth/me", headers={"Authorization": "Bearer not-a-real-token"}
    )
    assert response.status_code == 401


async def test_認証済みならmeが取得できる(client: AsyncClient) -> None:
    headers = await auth_headers(client, email="me@example.com")

    response = await client.get("/api/auth/me", headers=headers)
    assert response.status_code == 200
    assert response.json()["user"]["email"] == "me@example.com"


# --------------------------------------------------------------- ログアウト


async def test_ログアウトでトークンが失効する(client: AsyncClient) -> None:
    headers = await auth_headers(client, email="logout@example.com")

    assert (await client.post("/api/auth/logout", headers=headers)).status_code == 200
    # 失効したトークンでは以降アクセスできない
    assert (await client.get("/api/auth/me", headers=headers)).status_code == 401


async def test_二重ログアウトでもエラーにならない(client: AsyncClient) -> None:
    headers = await auth_headers(client, email="logout2@example.com")

    await client.post("/api/auth/logout", headers=headers)
    second = await client.post("/api/auth/logout", headers=headers)
    # 既に失効しているため 401（トークンが無効）になる
    assert second.status_code == 401


async def test_他ユーザーのトークンは影響を受けない(client: AsyncClient) -> None:
    a = await auth_headers(client, email="a@example.com")
    b = await auth_headers(client, email="b@example.com")

    await client.post("/api/auth/logout", headers=a)

    assert (await client.get("/api/auth/me", headers=a)).status_code == 401
    assert (await client.get("/api/auth/me", headers=b)).status_code == 200


# --------------------------------------------------------------- プロフィール


async def test_プロフィールを更新できる(client: AsyncClient) -> None:
    headers = await auth_headers(client, email="profile@example.com")

    response = await client.put(
        "/api/auth/profile",
        headers=headers,
        json={"name": "更新後", "organization": "新会社"},
    )
    assert response.status_code == 200
    assert response.json()["user"]["name"] == "更新後"
    assert response.json()["user"]["organization"] == "新会社"


async def test_プロフィール更新でemailは変更されない(client: AsyncClient) -> None:
    headers = await auth_headers(client, email="fixed@example.com")

    response = await client.put(
        "/api/auth/profile",
        headers=headers,
        json={"name": "更新後", "email": "hacked@example.com"},
    )
    assert response.status_code == 200
    assert response.json()["user"]["email"] == "fixed@example.com"


# --------------------------------------------------------------- パスワード変更


async def test_パスワードを変更できる(client: AsyncClient) -> None:
    headers = await auth_headers(client, email="chpw@example.com")

    response = await client.post(
        "/api/auth/change-password",
        headers=headers,
        json={
            "current_password": VALID_PASSWORD,
            "password": "newpassword456",
            "password_confirmation": "newpassword456",
        },
    )
    assert response.status_code == 200

    # 新パスワードでログインできる
    login = await client.post(
        "/api/auth/login",
        json={"email": "chpw@example.com", "password": "newpassword456"},
    )
    assert login.status_code == 200


async def test_パスワード変更で全トークンが失効する(client: AsyncClient) -> None:
    """他端末に残ったセッションを確実に切るため。"""
    data = await register_user(client, email="revoke@example.com")
    token_a = {"Authorization": f"Bearer {data['token']}"}

    login = await client.post(
        "/api/auth/login",
        json={"email": "revoke@example.com", "password": VALID_PASSWORD},
    )
    token_b = {"Authorization": f"Bearer {login.json()['token']}"}

    await client.post(
        "/api/auth/change-password",
        headers=token_b,
        json={
            "current_password": VALID_PASSWORD,
            "password": "newpassword456",
            "password_confirmation": "newpassword456",
        },
    )

    # 両方のトークンが無効になる
    assert (await client.get("/api/auth/me", headers=token_a)).status_code == 401
    assert (await client.get("/api/auth/me", headers=token_b)).status_code == 401


async def test_現在のパスワードが誤っていれば変更できない(client: AsyncClient) -> None:
    headers = await auth_headers(client, email="chpw2@example.com")

    response = await client.post(
        "/api/auth/change-password",
        headers=headers,
        json={
            "current_password": "wrongpassword123",
            "password": "newpassword456",
            "password_confirmation": "newpassword456",
        },
    )
    assert response.status_code == 422

    # 元のパスワードのままログインできる
    login = await client.post(
        "/api/auth/login",
        json={"email": "chpw2@example.com", "password": VALID_PASSWORD},
    )
    assert login.status_code == 200


async def test_同じパスワードへの変更は拒否される(client: AsyncClient) -> None:
    headers = await auth_headers(client, email="same@example.com")

    response = await client.post(
        "/api/auth/change-password",
        headers=headers,
        json={
            "current_password": VALID_PASSWORD,
            "password": VALID_PASSWORD,
            "password_confirmation": VALID_PASSWORD,
        },
    )
    assert response.status_code == 422
