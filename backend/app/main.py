"""FastAPI アプリケーション本体。"""
from __future__ import annotations

import logging
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.config import settings
from app.database import engine
from app.routers import ai, auth, contact, documents, health

logging.basicConfig(
    level=settings.log_level.upper(),
    format="%(asctime)s %(levelname)-8s %(name)s %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncIterator[None]:
    logger.info(
        "起動: env=%s debug=%s openai=%s mail=%s",
        settings.app_env,
        settings.app_debug,
        "設定済み" if settings.openai_api_key else "未設定",
        "設定済み" if settings.mail_host else "未設定",
    )
    if not settings.openai_api_key:
        logger.warning("OPENAI_API_KEY が未設定です。AI資料生成は 503 を返します。")

    yield

    # コネクションプールを明示的に閉じる
    await engine.dispose()
    logger.info("停止: データベース接続を解放しました")


app = FastAPI(
    title=settings.app_name,
    version="2.0.0",
    description="MR-alignment バックエンド API",
    lifespan=lifespan,
    # 本番では OpenAPI ドキュメントを公開しない
    docs_url="/docs" if not settings.is_production else None,
    redoc_url="/redoc" if not settings.is_production else None,
    openapi_url="/openapi.json" if not settings.is_production else None,
)

# --------------------------------------------------------------------- CORS
# 旧 Laravel 実装は allowed_origins=['*'] と supports_credentials=true を
# 併用していたが、これはブラウザ仕様上そもそも成立しない組み合わせだった。
# 本 API は Cookie を使わず Bearer トークンで認証するため
# allow_credentials は False とし、オリジンは明示する。
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_origin_regex=settings.cors_allow_origin_regex,
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Accept", "Authorization", "Content-Type", "X-Requested-With"],
    max_age=3600,
)


# ---------------------------------------------------------------- 例外ハンドラ
# フロントエンドが受け取る形式を統一する。
# フロント側は { message, errors } を期待している（services/api.ts の toApiResult）。


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(
    _request: Request, exc: RequestValidationError
) -> JSONResponse:
    """バリデーションエラーをフィールド別のメッセージへ整形する。"""
    errors: dict[str, list[str]] = {}
    for error in exc.errors():
        # loc は ('body', 'email') のような形。先頭の body/query は除く
        location = [str(part) for part in error["loc"] if part not in ("body", "query", "path")]
        field = ".".join(location) or "__root__"
        errors.setdefault(field, []).append(error["msg"])

    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "status": "error",
            "message": "バリデーションエラー",
            "errors": errors,
        },
    )


@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(_request: Request, exc: StarletteHTTPException) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content={"status": "error", "message": exc.detail},
        headers=getattr(exc, "headers", None),
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """想定外の例外。

    スタックトレースはサーバーログにのみ出し、クライアントへは返さない。
    旧実装は $e->getMessage() をそのまま返しており、
    内部構造やファイルパスが漏れる状態だった。
    """
    logger.exception("未処理の例外 path=%s", request.url.path)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "status": "error",
            "message": "サーバーエラーが発生しました。しばらく時間をおいて再度お試しください。",
        },
    )


# --------------------------------------------------------------------- ルート

app.include_router(health.router, prefix=settings.api_prefix)
app.include_router(auth.router, prefix=settings.api_prefix)
app.include_router(contact.router, prefix=settings.api_prefix)
app.include_router(ai.router, prefix=settings.api_prefix)
app.include_router(documents.router, prefix=settings.api_prefix)


# コンテナ / Railway のヘルスチェックは prefix なしのパスを叩くため、
# ここだけ別途定義する。ルーターを二重に include すると
# OpenAPI の operationId が衝突するため避けている。
@app.get("/health", tags=["health"], include_in_schema=False)
async def root_health() -> dict[str, object]:
    return await health.health()


@app.get("/", tags=["health"])
async def root() -> dict[str, object]:
    return {
        "status": "success",
        "message": f"{settings.app_name} is running",
        "version": "2.0.0",
        "docs": "/docs" if not settings.is_production else None,
        "endpoints": {
            f"{settings.api_prefix}/test": "API接続テスト",
            f"{settings.api_prefix}/auth/login": "ログイン",
            f"{settings.api_prefix}/auth/register": "新規登録",
            f"{settings.api_prefix}/contact": "お問い合わせ",
            f"{settings.api_prefix}/openai/generate": "AI資料生成（要認証）",
            f"{settings.api_prefix}/documents": "AI資料の生成とメール送付",
        },
    }
