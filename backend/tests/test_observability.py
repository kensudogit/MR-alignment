"""ログとセキュリティヘッダ。

障害調査ができる形でログが出ること、
ブラウザ側の防御が有効になるヘッダが付くことを固定する。
"""
from __future__ import annotations

import json
import logging

import pytest
from httpx import AsyncClient

from app.config import Settings
from app.logging_config import JsonFormatter, request_id_var
from app.middleware import REQUEST_ID_HEADER


def _record(**extra: object) -> logging.LogRecord:
    record = logging.LogRecord(
        name="app.access",
        level=logging.INFO,
        pathname=__file__,
        lineno=1,
        msg="GET /api/contact %s",
        args=(201,),
        exc_info=None,
    )
    for key, value in extra.items():
        setattr(record, key, value)
    return record


# --------------------------------------------------------------- ログの書式


def test_1行1JSONで出る() -> None:
    """CloudWatch Logs Insights が解釈できる形。素のテキストだと絞り込めない。"""
    output = JsonFormatter().format(_record(status=201, duration_ms=12.3))
    parsed = json.loads(output)

    assert parsed["level"] == "INFO"
    assert parsed["logger"] == "app.access"
    assert parsed["message"] == "GET /api/contact 201"
    assert parsed["status"] == 201
    assert parsed["duration_ms"] == 12.3
    assert "\n" not in output


def test_日本語をエスケープしない() -> None:
    """\\uXXXX に潰れると、CloudWatch のコンソールで読めなくなる。"""
    record = _record()
    record.msg = "面談予約を受け付けました"
    record.args = ()

    assert "面談予約を受け付けました" in JsonFormatter().format(record)


def test_リクエストIDが載る() -> None:
    token = request_id_var.set("abc123")
    try:
        parsed = json.loads(JsonFormatter().format(_record()))
    finally:
        request_id_var.reset(token)

    assert parsed["request_id"] == "abc123"


def test_例外はスタックトレースごと残る() -> None:
    try:
        raise ValueError("boom")
    except ValueError:
        import sys

        record = _record()
        record.exc_info = sys.exc_info()

    parsed = json.loads(JsonFormatter().format(record))
    assert "ValueError: boom" in parsed["exception"]


def test_本番以外はテキストで出す() -> None:
    """開発中に JSON が流れると読みにくい。既定は環境で切り替える。"""
    base = {"database_url": "postgresql+asyncpg://u:p@h/db"}
    # 本番設定は他の項目も検証されるため、通る値を与える
    prod = {**base, "app_debug": False, "frontend_url": "https://example.com"}

    assert Settings(app_env="local", **base).log_json_effective is False
    assert Settings(app_env="production", **prod).log_json_effective is True
    # 明示指定があればそちらが優先される
    assert Settings(app_env="local", log_json=True, **base).log_json_effective is True


# --------------------------------------------------------------- ミドルウェア


async def test_リクエストIDが応答に付く(client: AsyncClient) -> None:
    """問い合わせを受けたとき、この ID でログを串刺しにできる。"""
    response = await client.get("/api/test")

    assert response.headers[REQUEST_ID_HEADER]
    assert len(response.headers[REQUEST_ID_HEADER]) >= 8


async def test_呼び出し側のリクエストIDを引き継ぐ(client: AsyncClient) -> None:
    response = await client.get("/api/test", headers={REQUEST_ID_HEADER: "trace-me-123"})

    assert response.headers[REQUEST_ID_HEADER] == "trace-me-123"


async def test_ALBのトレースIDも引き継ぐ(client: AsyncClient) -> None:
    trace = "Root=1-63441c4a-abcdef012345678912345678"
    response = await client.get("/api/test", headers={"X-Amzn-Trace-Id": trace})

    assert response.headers[REQUEST_ID_HEADER] == trace


@pytest.mark.parametrize(
    "header,value",
    [
        ("X-Content-Type-Options", "nosniff"),
        ("X-Frame-Options", "DENY"),
        ("Referrer-Policy", "no-referrer"),
    ],
)
async def test_セキュリティヘッダが付く(client: AsyncClient, header: str, value: str) -> None:
    response = await client.get("/api/test")
    assert response.headers[header] == value


async def test_開発環境ではCSPを付けない(client: AsyncClient) -> None:
    """/docs（Swagger UI）が CDN からスクリプトを読むため。本番では /docs 自体が無効。"""
    response = await client.get("/api/test")
    assert "Content-Security-Policy" not in response.headers


async def test_エラー応答にもリクエストIDが付く(client: AsyncClient) -> None:
    """500 の調査こそ ID が要る。"""
    response = await client.get("/api/appointments/NO-SUCH-REFERENCE")

    assert response.status_code == 401  # 認証が先に効く
    assert response.headers[REQUEST_ID_HEADER]
