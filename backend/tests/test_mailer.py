"""SMTP の接続方式。

ポート 465（SMTPS）とポート 587（STARTTLS）を取り違えると、
例外は出ないまま送信だけが行われない状態になりやすい。
接続の張り方をここで固定する。
"""
from __future__ import annotations

import smtplib
from datetime import date, datetime

import pytest

from app.config import Settings
from app.models import Appointment, AppointmentStatus
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


# ------------------------------------------------------------------ 面談予約


def _appointment() -> Appointment:
    """DB を使わずに組み立てた予約。メール本文の確認にはこれで足りる。"""
    return Appointment(
        reference="AP-20260823-ABCD1234",
        name="山田太郎",
        email="yamada@example.com",
        phone="090-1234-5678",
        company="株式会社テスト",
        department="情報システム部",
        position="部長",
        consultation_type="it-strategy",
        preferred_date=date(2026, 8, 24),
        preferred_slot="10:00-11:00",
        message="基幹システムの刷新について相談したい",
        created_at=datetime(2026, 8, 23, 17, 30),
    )


def test_申込者への控えは確定ではないと明記する(monkeypatch: pytest.MonkeyPatch) -> None:
    """「予約確定」と読める文面だと、日程が合わなかったときに当日まで待たせてしまう。"""
    _patch(monkeypatch, mail_host="smtp.example.com", contact_mail_to="staff@example.com")

    message = mailer._build_appointment_ack(_appointment())
    body = message.get_content()

    assert "まだ確定していません" in body
    assert "2026年08月24日" in body
    assert "10:00-11:00" in body
    assert "IT戦略" in body, "相談区分はキーではなく表示名で出す"
    # 宛先は申込者、返信は担当者へ
    assert "yamada@example.com" in message["To"]
    assert message["Reply-To"] == "staff@example.com"


def test_担当者への予約通知は件名で日時と会社が分かる(monkeypatch: pytest.MonkeyPatch) -> None:
    """受信箱に並んだ状態で、開かずに予定を把握できるようにする。"""
    _patch(monkeypatch, mail_host="smtp.example.com", contact_mail_to="staff@example.com")

    message = mailer._build_appointment_notification(_appointment())

    assert "AP-20260823-ABCD1234" in message["Subject"]
    assert "08/24 10:00-11:00" in message["Subject"]
    assert "株式会社テスト" in message["Subject"]
    assert message["To"] == "staff@example.com"
    # 返信するとお客様へ直接届く
    assert message["Reply-To"] == "yamada@example.com"
    assert "090-1234-5678" in message.get_content()


async def test_CONTACT_MAIL_TO未設定なら担当者通知は送らない(monkeypatch: pytest.MonkeyPatch) -> None:
    _patch(monkeypatch, mail_host="smtp.example.com", contact_mail_to=None)

    assert await mailer.send_appointment_notification(_appointment()) is False
    assert _FakeSMTP.instances == []


async def test_MAIL_HOST未設定なら控えも送らない(monkeypatch: pytest.MonkeyPatch) -> None:
    _patch(monkeypatch, mail_host=None)

    assert await mailer.send_appointment_ack(_appointment()) is False
    assert _FakeSMTP.instances == []


def test_確定メールに担当者メモは含めない(monkeypatch: pytest.MonkeyPatch) -> None:
    """社内の申し送りであり、申込者に見せる前提で書かれていない。"""
    _patch(monkeypatch, mail_host="smtp.example.com", contact_mail_to="staff@example.com")

    appointment = _appointment()
    appointment.status = AppointmentStatus.CONFIRMED
    appointment.staff_note = "前回の商談では予算感が合わなかった"

    body = mailer._build_appointment_confirmation(appointment).get_content()

    assert "予算感" not in body
    assert "2026年08月24日" in body
    assert "10:00-11:00" in body


def test_取消メールは再予約の方法を案内する(monkeypatch: pytest.MonkeyPatch) -> None:
    _patch(monkeypatch, mail_host="smtp.example.com", contact_mail_to="staff@example.com")

    appointment = _appointment()
    appointment.status = AppointmentStatus.CANCELLED

    message = mailer._build_appointment_cancellation(appointment)

    assert "取り消しました" in message["Subject"]
    assert "面談予約フォーム" in message.get_content()
    assert "yamada@example.com" in message["To"]


def test_知らせるのは確定と取消だけ() -> None:
    """未確定へ戻す・実施済みにするのは社内の整理で、申込者へ伝える出来事ではない。"""
    assert mailer.notifies_applicant(AppointmentStatus.CONFIRMED) is True
    assert mailer.notifies_applicant(AppointmentStatus.CANCELLED) is True
    assert mailer.notifies_applicant(AppointmentStatus.PENDING) is False
    assert mailer.notifies_applicant(AppointmentStatus.COMPLETED) is False


async def test_対象外の状態では送信しない(monkeypatch: pytest.MonkeyPatch) -> None:
    _patch(monkeypatch, mail_host="smtp.example.com")

    appointment = _appointment()
    appointment.status = AppointmentStatus.COMPLETED

    assert await mailer.send_appointment_status_notice(appointment) is False
    assert _FakeSMTP.instances == []
