"""SMTP の接続方式。

ポート 465（SMTPS）とポート 587（STARTTLS）を取り違えると、
例外は出ないまま送信だけが行われない状態になりやすい。
接続の張り方をここで固定する。
"""
from __future__ import annotations

import smtplib

import pytest

from app.config import Settings
from app.services import mailer


class _FakeSMTP:
    """smtplib.SMTP / SMTP_SSL の代わり。呼ばれ方だけを記録する。"""

    instances: list["_FakeSMTP"] = []

    def __init__(self, host: str, port: int, timeout: float | None = None, **kwargs: object) -> None:
        self.host = host
        self.port = port
        self.timeout = timeout
        self.kwargs = kwargs
        self.starttls_called = False
        self.logged_in: tuple[str, str] | None = None
        self.sent = 0
        _FakeSMTP.instances.append(self)

    def starttls(self, **kwargs: object) -> None:
        self.starttls_called = True

    def login(self, username: str, password: str) -> None:
        self.logged_in = (username, password)

    def send_message(self, message: object) -> None:
        self.sent += 1

    def __enter__(self) -> "_FakeSMTP":
        return self

    def __exit__(self, *exc: object) -> None:
        return None


class _FakeSMTPS(_FakeSMTP):
    pass


@pytest.fixture(autouse=True)
def _reset() -> None:
    _FakeSMTP.instances = []


def _patch(monkeypatch: pytest.MonkeyPatch, **settings_kwargs: object) -> None:
    monkeypatch.setattr(smtplib, "SMTP", _FakeSMTP)
    monkeypatch.setattr(smtplib, "SMTP_SSL", _FakeSMTPS)
    monkeypatch.setattr(
        mailer,
        "settings",
        Settings(database_url="postgresql+asyncpg://u:p@h/db", **settings_kwargs),
    )


def test_ポート465はSMTPSで接続しSTARTTLSを呼ばない(monkeypatch: pytest.MonkeyPatch) -> None:
    _patch(
        monkeypatch,
        mail_host="mailssl.zaq.ne.jp",
        mail_port=465,
        mail_username="user@example.com",
        mail_password="secret",
    )

    mailer._send_sync(object())  # type: ignore[arg-type]

    smtp = _FakeSMTP.instances[0]
    assert isinstance(smtp, _FakeSMTPS), "465 は最初から TLS を張る必要がある"
    assert smtp.starttls_called is False
    assert smtp.logged_in == ("user@example.com", "secret")
    assert smtp.sent == 1


def test_MAIL_USE_SSLを立てればポートに関係なくSMTPSになる(monkeypatch: pytest.MonkeyPatch) -> None:
    _patch(monkeypatch, mail_host="smtp.example.com", mail_port=2465, mail_use_ssl=True)

    mailer._send_sync(object())  # type: ignore[arg-type]

    assert isinstance(_FakeSMTP.instances[0], _FakeSMTPS)


def test_ポート587はSTARTTLSで接続する(monkeypatch: pytest.MonkeyPatch) -> None:
    _patch(
        monkeypatch,
        mail_host="smtp.example.com",
        mail_port=587,
        mail_use_tls=True,
    )

    mailer._send_sync(object())  # type: ignore[arg-type]

    smtp = _FakeSMTP.instances[0]
    assert not isinstance(smtp, _FakeSMTPS)
    assert smtp.starttls_called is True


def test_開発用のmailpitは平文のまま(monkeypatch: pytest.MonkeyPatch) -> None:
    """docker-compose の mailpit は TLS も認証も持たない。"""
    _patch(monkeypatch, mail_host="mailpit", mail_port=1025)

    mailer._send_sync(object())  # type: ignore[arg-type]

    smtp = _FakeSMTP.instances[0]
    assert not isinstance(smtp, _FakeSMTPS)
    assert smtp.starttls_called is False
    assert smtp.logged_in is None


def test_MAIL_HOST未設定なら接続しない(monkeypatch: pytest.MonkeyPatch) -> None:
    _patch(monkeypatch, mail_host=None)

    mailer._send_sync(object())  # type: ignore[arg-type]

    assert _FakeSMTP.instances == []


def test_タイムアウトを渡している(monkeypatch: pytest.MonkeyPatch) -> None:
    """ISP のメールサーバーは応答が遅く、既定の無制限だと接続が滞留する。"""
    _patch(monkeypatch, mail_host="mailssl.zaq.ne.jp", mail_port=465)

    mailer._send_sync(object())  # type: ignore[arg-type]

    assert _FakeSMTP.instances[0].timeout == mailer.SMTP_TIMEOUT_SECONDS
