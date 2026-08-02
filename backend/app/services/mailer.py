"""メール送信。

標準ライブラリの smtplib を使い、外部依存を増やさない。
smtplib は同期 API のため、イベントループを止めないよう
`asyncio.to_thread` でワーカースレッドへ逃がす。

送信失敗はログに残すのみで、呼び出し側の処理は継続させる。
お問い合わせは先に DB へ保存済みであり、メールが飛ばなくても内容は失われない。
"""
from __future__ import annotations

import asyncio
import logging
import smtplib
from email.message import EmailMessage
from email.utils import formataddr

from app.config import settings
from app.models import Contact

logger = logging.getLogger(__name__)


def _build_contact_mail(contact: Contact, recipient: str) -> EmailMessage:
    message = EmailMessage()
    message["Subject"] = f"[お問い合わせ {contact.reference}] {contact.subject}"
    # From はアプリのアドレスにする。お客様のアドレスにすると SPF/DKIM で弾かれる。
    message["From"] = formataddr((settings.mail_from_name, settings.mail_from_address))
    message["To"] = recipient
    # 返信するとお客様へ直接届くようにする
    message["Reply-To"] = contact.email

    body = f"""新しいお問い合わせを受け付けました。

受付番号   : {contact.reference}
お名前     : {contact.name}
メール     : {contact.email}
会社・組織 : {contact.organization or "（未記入）"}
役職       : {contact.role or "（未記入）"}
連絡方法   : {contact.contact_method.value}
緊急度     : {contact.urgency.value}
受付日時   : {contact.created_at:%Y-%m-%d %H:%M:%S}

【件名】
{contact.subject}

【お問い合わせ内容】
{contact.message}

---
このメールは {settings.app_name} から自動送信されています。
"""
    message.set_content(body)
    return message


def _send_sync(message: EmailMessage) -> None:
    host = settings.mail_host
    if not host:  # pragma: no cover - 呼び出し側で確認済み
        return

    with smtplib.SMTP(host, settings.mail_port, timeout=10) as smtp:
        if settings.mail_use_tls:
            smtp.starttls()
        if settings.mail_username and settings.mail_password:
            smtp.login(settings.mail_username, settings.mail_password)
        smtp.send_message(message)


async def send_contact_notification(contact: Contact) -> bool:
    """担当者へお問い合わせを通知する。

    Returns:
        送信できたら True。設定不足・失敗時は False（例外は投げない）。
    """
    recipient = settings.contact_mail_to
    if not recipient:
        logger.warning(
            "CONTACT_MAIL_TO が未設定のため通知メールを送信しませんでした reference=%s",
            contact.reference,
        )
        return False

    if not settings.mail_host:
        logger.warning(
            "MAIL_HOST が未設定のため通知メールを送信しませんでした reference=%s",
            contact.reference,
        )
        return False

    message = _build_contact_mail(contact, recipient)

    try:
        await asyncio.to_thread(_send_sync, message)
    except (smtplib.SMTPException, OSError) as exc:
        logger.error(
            "お問い合わせ通知メールの送信に失敗しました reference=%s error=%s",
            contact.reference,
            exc,
        )
        return False

    logger.info("お問い合わせ通知メールを送信しました reference=%s", contact.reference)
    return True
