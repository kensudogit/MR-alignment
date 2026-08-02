"""ヘルスチェックと疎通確認。"""
from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, status
from sqlalchemy import text

from app.config import settings
from app.dependencies import DbSession

router = APIRouter(tags=["health"])


@router.get("/health")
async def health() -> dict[str, object]:
    """コンテナ生存確認用。DB には触らないため常に高速に返る。

    Railway / Docker の healthcheck はこちらを使う。
    """
    return {
        "status": "healthy",
        "app": settings.app_name,
        "env": settings.app_env,
        "timestamp": datetime.now(tz=timezone.utc).isoformat(),
    }


@router.get("/health/ready")
async def readiness(db: DbSession) -> dict[str, object]:
    """依存サービスを含めた疎通確認。

    DB へ実際にクエリを投げるため、ロードバランサの readiness probe に使う。
    """
    checks: dict[str, str] = {}
    healthy = True

    try:
        await db.execute(text("SELECT 1"))
        checks["database"] = "ok"
    except Exception as exc:  # noqa: BLE001 - 何が起きても ready=false にしたい
        checks["database"] = f"error: {type(exc).__name__}"
        healthy = False

    checks["openai"] = "configured" if settings.openai_api_key else "not_configured"
    checks["mail"] = "configured" if settings.mail_host else "not_configured"

    return {
        "status": "ready" if healthy else "not_ready",
        "checks": checks,
        "timestamp": datetime.now(tz=timezone.utc).isoformat(),
    }


@router.get("/test", status_code=status.HTTP_200_OK)
async def api_test() -> dict[str, str]:
    """フロントエンドからの接続確認用（旧 /api/test 互換）。"""
    return {
        "status": "success",
        "message": "API接続成功！",
        "backend": "Python 3.11 + FastAPI",
        "database": "PostgreSQL 15",
        "timestamp": datetime.now(tz=timezone.utc).isoformat(),
    }
