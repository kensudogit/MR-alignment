"""設定検証・CORS・ヘルスチェック。"""
from __future__ import annotations

import pytest
from httpx import AsyncClient

from app.config import Settings
from app.rate_limit import Rate, SlidingWindowLimiter


# --------------------------------------------------------------- 設定


def test_postgres_urlが非同期ドライバへ変換される() -> None:
    s = Settings(database_url="postgresql://u:p@h:5432/db")
    assert s.database_url.startswith("postgresql+asyncpg://")


def test_railway形式のURLも変換される() -> None:
    s = Settings(database_url="postgres://u:p@h:5432/db")
    assert s.database_url.startswith("postgresql+asyncpg://")


def test_未対応ドライバは拒否される() -> None:
    with pytest.raises(ValueError, match="asyncpg"):
        Settings(database_url="mysql://u:p@h/db")


def test_本番でAPP_DEBUGがtrueなら起動できない(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("JWT_SECRET_KEY", "x" * 40)
    with pytest.raises(ValueError, match="APP_DEBUG"):
        Settings(
            app_env="production",
            app_debug=True,
            frontend_url="https://example.com",
        )


def test_本番でJWT鍵未設定なら起動できない(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.delenv("JWT_SECRET_KEY", raising=False)
    with pytest.raises(ValueError, match="JWT_SECRET_KEY"):
        Settings(
            app_env="production",
            app_debug=False,
            frontend_url="https://example.com",
        )


def test_本番でCORSがlocalhostのままなら起動できない(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("JWT_SECRET_KEY", "x" * 40)
    with pytest.raises(ValueError, match="FRONTEND_URL"):
        Settings(app_env="production", app_debug=False, frontend_url="http://localhost:3000")


def test_CORSオリジンはカンマ区切りで複数指定できる() -> None:
    s = Settings(frontend_url="https://a.example.com, https://b.example.com")
    assert s.cors_origins == ["https://a.example.com", "https://b.example.com"]


# --------------------------------------------------------------- レート制限


def test_レート指定を解釈できる() -> None:
    assert Rate.parse("5/minute") == Rate(limit=5, window_seconds=60)
    assert Rate.parse("10/hour") == Rate(limit=10, window_seconds=3600)
    assert Rate.parse(" 3 / second ") == Rate(limit=3, window_seconds=1)


def test_不正なレート指定は拒否される() -> None:
    with pytest.raises(ValueError, match="レート制限"):
        Rate.parse("たくさん")


async def test_上限を超えると429になる() -> None:
    from fastapi import HTTPException

    limiter = SlidingWindowLimiter()
    rate = Rate(limit=2, window_seconds=60)

    await limiter.check("k", rate)
    await limiter.check("k", rate)

    with pytest.raises(HTTPException) as exc:
        await limiter.check("k", rate)
    assert exc.value.status_code == 429
    assert "Retry-After" in exc.value.headers


async def test_キーが異なれば独立して数える() -> None:
    limiter = SlidingWindowLimiter()
    rate = Rate(limit=1, window_seconds=60)

    await limiter.check("a", rate)
    await limiter.check("b", rate)  # 例外にならない


# --------------------------------------------------------------- ヘルスチェック


async def test_healthは常に200(client: AsyncClient) -> None:
    response = await client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


async def test_readyはDB疎通を確認する(client: AsyncClient) -> None:
    response = await client.get("/api/health/ready")
    assert response.status_code == 200
    assert response.json()["checks"]["database"] == "ok"


async def test_接続テストが応答する(client: AsyncClient) -> None:
    response = await client.get("/api/test")
    assert response.status_code == 200
    assert response.json()["status"] == "success"


async def test_ルートがエンドポイント一覧を返す(client: AsyncClient) -> None:
    response = await client.get("/")
    assert response.status_code == 200
    assert "endpoints" in response.json()


# --------------------------------------------------------------- CORS


async def test_許可オリジンにはCORSヘッダが付く(client: AsyncClient) -> None:
    response = await client.get("/health", headers={"Origin": "http://localhost:3000"})
    assert response.headers.get("access-control-allow-origin") == "http://localhost:3000"


async def test_許可外オリジンにはCORSヘッダが付かない(client: AsyncClient) -> None:
    """旧実装は allowed_origins=['*'] で全オリジンを許していた。"""
    response = await client.get("/health", headers={"Origin": "https://evil.example.com"})
    assert response.headers.get("access-control-allow-origin") != "https://evil.example.com"


async def test_資格情報付きCORSは無効(client: AsyncClient) -> None:
    """'*' と credentials は併用できないため、Bearer 認証に統一している。"""
    response = await client.get("/health", headers={"Origin": "http://localhost:3000"})
    assert response.headers.get("access-control-allow-credentials") != "true"
