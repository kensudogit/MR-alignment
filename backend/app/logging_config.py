"""ログの設定。

本番（CloudWatch Logs）では1行1JSONで出す。
人が読む形のまま出すと、Logs Insights で `status >= 500` のような
絞り込みができず、障害時に grep で探すことになる。

リクエストIDは ContextVar で持ち回す。引数で引き回すと、
サービス層やメール送信のログにIDを載せられない。
"""
from __future__ import annotations

import contextvars
import datetime as dt
import json
import logging
import sys
from typing import Any

from app.config import settings

# リクエストごとの識別子。ミドルウェアが設定する
request_id_var: contextvars.ContextVar[str | None] = contextvars.ContextVar(
    "request_id", default=None
)

# LogRecord が標準で持つ属性。これ以外を「追加フィールド」として JSON に載せる
_STANDARD_ATTRS = frozenset(
    logging.LogRecord("", 0, "", 0, "", None, None).__dict__
) | {"message", "asctime", "taskName"}


class JsonFormatter(logging.Formatter):
    """1行1JSON。CloudWatch Logs Insights がそのまま解釈できる形にする。"""

    def format(self, record: logging.LogRecord) -> str:
        payload: dict[str, Any] = {
            "time": dt.datetime.fromtimestamp(record.created, tz=dt.UTC).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }

        request_id = request_id_var.get()
        if request_id:
            payload["request_id"] = request_id

        if record.exc_info:
            payload["exception"] = self.formatException(record.exc_info)

        # logger.info("...", extra={"status": 200}) の extra を拾う
        for key, value in record.__dict__.items():
            if key not in _STANDARD_ATTRS and not key.startswith("_"):
                payload[key] = value

        # 日本語をエスケープすると CloudWatch 上で読めなくなる
        return json.dumps(payload, ensure_ascii=False, default=str)


class TextFormatter(logging.Formatter):
    """開発用。リクエストIDが付いていれば添える。"""

    def format(self, record: logging.LogRecord) -> str:
        base = super().format(record)
        request_id = request_id_var.get()
        return f"{base} [request_id={request_id}]" if request_id else base


def configure_logging() -> None:
    """ルートロガーを設定する。

    basicConfig ではなくハンドラを差し替える。uvicorn が自前のハンドラを
    付けるため、そのままだと同じ行が2回出る（片方はJSON、片方は素のテキスト）。
    """
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(
        JsonFormatter()
        if settings.log_json_effective
        else TextFormatter("%(asctime)s %(levelname)-8s %(name)s %(message)s")
    )

    root = logging.getLogger()
    root.handlers = [handler]
    root.setLevel(settings.log_level.upper())

    # uvicorn のロガーは propagate=False で自前のハンドラを持つ。
    # ルートへ流し直して、書式を1つに揃える。
    for name in ("uvicorn", "uvicorn.error", "uvicorn.access"):
        logger = logging.getLogger(name)
        logger.handlers = []
        logger.propagate = True

    # SQLAlchemy のエコーは DB_ECHO で制御する。既定では黙らせる
    logging.getLogger("sqlalchemy.engine").setLevel(
        logging.INFO if settings.db_echo else logging.WARNING
    )
