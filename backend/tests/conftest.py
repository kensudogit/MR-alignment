"""テスト共通のフィクスチャ。

外部サービス（PostgreSQL / OpenAI / SMTP）には接続せず、
SQLite(aiosqlite) のインメモリDBで全経路を通す。
"""
from __future__ import annotations

import os
from collections.abc import AsyncGenerator

# 設定は import 時に読み込まれるため、他モジュールより先に環境変数を設定する
os.environ.setdefault("APP_ENV", "test")
os.environ.setdefault("DATABASE_URL", "sqlite+aiosqlite:///:memory:")
os.environ.setdefault("JWT_SECRET_KEY", "test-secret-key-for-pytest-only")
os.environ.setdefault("FRONTEND_URL", "http://localhost:3000")
os.environ.setdefault("RATE_LIMIT_AUTH", "1000/minute")
os.environ.setdefault("RATE_LIMIT_CONTACT", "1000/minute")
os.environ.setdefault("RATE_LIMIT_OPENAI", "1000/minute")
os.environ.pop("OPENAI_API_KEY", None)

import pytest  # noqa: E402
import pytest_asyncio  # noqa: E402
from httpx import ASGITransport, AsyncClient  # noqa: E402
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine  # noqa: E402
from sqlalchemy.pool import StaticPool  # noqa: E402

from app.database import get_db  # noqa: E402
from app.main import app  # noqa: E402
from app.models import Base  # noqa: E402
from app.rate_limit import limiter  # noqa: E402


@pytest_asyncio.fixture
async def db_engine():
    """テストごとに独立したインメモリDBを作る。

    StaticPool を使わないと、接続ごとに別のインメモリDBが割り当てられ
    テーブルが見えなくなる。
    """
    engine = create_async_engine(
        "sqlite+aiosqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    yield engine

    await engine.dispose()


@pytest_asyncio.fixture
async def db_session(db_engine) -> AsyncGenerator[AsyncSession, None]:
    session_factory = async_sessionmaker(bind=db_engine, expire_on_commit=False)
    async with session_factory() as session:
        yield session


@pytest_asyncio.fixture
async def client(db_engine) -> AsyncGenerator[AsyncClient, None]:
    """アプリのDB依存をテスト用DBへ差し替えたHTTPクライアント。"""
    session_factory = async_sessionmaker(bind=db_engine, expire_on_commit=False)

    async def override_get_db() -> AsyncGenerator[AsyncSession, None]:
        async with session_factory() as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db
    limiter.reset()

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

    app.dependency_overrides.clear()
    limiter.reset()


# ------------------------------------------------------------------ ヘルパー

VALID_PASSWORD = "password123"


async def register_user(
    client: AsyncClient,
    email: str = "user@example.com",
    password: str = VALID_PASSWORD,
    **extra: str,
) -> dict:
    payload = {
        "name": extra.pop("name", "テスト太郎"),
        "email": email,
        "password": password,
        "password_confirmation": password,
        **extra,
    }
    response = await client.post("/api/auth/register", json=payload)
    assert response.status_code == 201, response.text
    return response.json()


async def auth_headers(
    client: AsyncClient,
    email: str = "user@example.com",
    password: str = VALID_PASSWORD,
) -> dict[str, str]:
    data = await register_user(client, email=email, password=password)
    return {"Authorization": f"Bearer {data['token']}"}


@pytest.fixture
def valid_password() -> str:
    return VALID_PASSWORD
