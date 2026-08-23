"""HTTP ミドルウェア。

  - リクエストIDの付与（ログの相関）
  - アクセスログ（1行1JSON）
  - セキュリティヘッダ

いずれもアプリ側に置く。ALB / CloudFront 側にも同種の設定はあるが、
基盤を差し替えたときに黙って外れるため、アプリ自身が保証する。
"""
from __future__ import annotations

import logging
import time
import uuid
from collections.abc import Awaitable, Callable

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

from app.config import settings
from app.dependencies import client_ip
from app.logging_config import request_id_var

logger = logging.getLogger("app.access")

REQUEST_ID_HEADER = "X-Request-Id"

# ヘルスチェックは ALB から数秒おきに来る。全部記録するとログ料金だけが増え、
# 本来見たいリクエストが埋もれる。
_QUIET_PATHS = frozenset({"/health", "/api/health", "/api/health/ready"})


class RequestContextMiddleware(BaseHTTPMiddleware):
    """リクエストIDを発行し、ログとレスポンスヘッダに載せる。

    ALB は X-Amzn-Trace-Id を付けるので、それがあれば引き継ぐ。
    問い合わせを受けたとき「この Trace-Id のリクエスト」で追えるようにする。
    """

    async def dispatch(
        self, request: Request, call_next: Callable[[Request], Awaitable[Response]]
    ) -> Response:
        request_id = (
            request.headers.get(REQUEST_ID_HEADER)
            or request.headers.get("X-Amzn-Trace-Id")
            or uuid.uuid4().hex
        )[:200]

        token = request_id_var.set(request_id)
        started = time.perf_counter()
        try:
            response = await call_next(request)
        except Exception:
            # 例外の記録は main.py の例外ハンドラが行う。
            # ここではアクセスログだけ残して、そのまま投げ直す。
            logger.exception(
                "リクエスト処理で例外",
                extra={
                    "method": request.method,
                    "path": request.url.path,
                    "duration_ms": round((time.perf_counter() - started) * 1000, 1),
                    "client_ip": client_ip(request),
                },
            )
            raise
        finally:
            request_id_var.reset(token)

        response.headers[REQUEST_ID_HEADER] = request_id

        if request.url.path not in _QUIET_PATHS:
            duration_ms = round((time.perf_counter() - started) * 1000, 1)
            # ログ自体は ContextVar を戻したあとに出るため、明示的に載せる
            logger.info(
                "%s %s %s",
                request.method,
                request.url.path,
                response.status_code,
                extra={
                    "request_id": request_id,
                    "method": request.method,
                    "path": request.url.path,
                    "status": response.status_code,
                    "duration_ms": duration_ms,
                    "client_ip": client_ip(request),
                },
            )

        return response


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """ブラウザ側の防御を有効にするヘッダを付ける。

    この API は JSON しか返さないため、CSP は「何も読み込ませない」で足りる。
    ただし /docs（Swagger UI）は CDN からスクリプトを読むので、
    本番以外では CSP を付けない（本番では /docs 自体を無効にしている）。
    """

    async def dispatch(
        self, request: Request, call_next: Callable[[Request], Awaitable[Response]]
    ) -> Response:
        response = await call_next(request)

        response.headers.setdefault("X-Content-Type-Options", "nosniff")
        response.headers.setdefault("X-Frame-Options", "DENY")
        response.headers.setdefault("Referrer-Policy", "no-referrer")
        response.headers.setdefault(
            "Permissions-Policy", "geolocation=(), microphone=(), camera=()"
        )

        if settings.is_production:
            response.headers.setdefault(
                "Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'"
            )
            # HSTS は HTTPS で配信されているときだけ意味がある。
            # HTTP のまま付けると、開発環境のブラウザが以後 HTTPS を強制して繋がらなくなる。
            if request.url.scheme == "https":
                response.headers.setdefault(
                    "Strict-Transport-Security", "max-age=31536000; includeSubDomains"
                )

        return response
