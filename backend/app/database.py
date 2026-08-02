"""データベース接続（SQLAlchemy 2.0 / async）。

PostgreSQL への永続化を前提とする。テストのみ SQLite(aiosqlite) を許容する。
"""
from __future__ import annotations

from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.config import settings


def _create_engine() -> AsyncEngine:
    url = settings.database_url

    # SQLite にはコネクションプールの設定が適用できない
    if url.startswith("sqlite"):
        return create_async_engine(url, echo=settings.db_echo, future=True)

    return create_async_engine(
        url,
        echo=settings.db_echo,
        future=True,
        pool_size=settings.db_pool_size,
        max_overflow=settings.db_max_overflow,
        # 接続が長時間アイドルになるとPostgreSQL側で切断されるため、
        # プール内の接続を定期的に作り直す
        pool_recycle=settings.db_pool_recycle,
        pool_pre_ping=True,
    )


engine: AsyncEngine = _create_engine()

SessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """リクエストごとのセッション。

    例外時は明示的にロールバックし、必ずクローズする。
    """
    async with SessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
