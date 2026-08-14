"""メール送信。

標準ライブラリの smtplib を使い、外部依存を増やさない。
smtplib は同期 API のため、イベントループを止めないよう
`asyncio.to_thread` でワーカースレッドへ逃がす。

送信失敗はログに残すのみで、呼び出し側の処理は継続させる。
お問い合わせは先に DB へ保存済みであり、メールが飛ばなくても内容は失われない。
AI資料についても、送信可否を戻り値で返して画面側に伝える。

扱うメールは3種類。
  1. お問い合わせ通知      → 担当者(CONTACT_MAIL_TO)宛
  2. AI資料               → フォームに入力されたお客様のアドレス宛
  3. 資料請求の受付通知     → 担当者(CONTACT_MAIL_TO)宛
"""
from __future__ import annotations

import asyncio
import logging
import smtplib
from datetime import datetime
from email.message import EmailMessage
from email.utils import formataddr

from app.config import settings
from app.models import Contact
from app.schemas.document import DocumentRequest
from app.services.document import (
    COMPANY_NAME,
    industry_label,
    render_html,
    render_text,
)

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


# ------------------------------------------------------------------- AI資料


def _build_document_mail(
    request: DocumentRequest,
    sections: dict[str, str],
    reference: str,
    generated_at: datetime,
) -> EmailMessage:
    """本文をテキスト＋HTMLのマルチパートで作り、同じ内容のHTMLを添付する。

    添付を付けるのは、受信者がブラウザで開いて印刷（PDF保存）できるようにするため。
    PDF そのものを生成するには日本語フォントの同梱が必要になるため、
    サイト側の「印刷してPDF保存」と同じ方式に揃えている。
    """
    message = EmailMessage()
    message["Subject"] = f"【{COMPANY_NAME}】ITサービス提案資料のご送付（{reference}）"
    message["From"] = formataddr((settings.mail_from_name, settings.mail_from_address))
    message["To"] = formataddr((request.full_name, str(request.email)))

    # 返信は担当者へ届くようにする。未設定なら送信元のまま
    if settings.contact_mail_to:
        message["Reply-To"] = settings.contact_mail_to

    message.set_content(render_text(request, sections, reference, generated_at))
    html_body = render_html(request, sections, reference, generated_at)
    message.add_alternative(html_body, subtype="html")
    message.add_attachment(
        html_body.encode("utf-8"),
        maintype="text",
        subtype="html",
        filename=f"ITサービス提案資料_{reference}.html",
    )
    return message


async def send_document_mail(
    request: DocumentRequest,
    sections: dict[str, str],
    reference: str,
    generated_at: datetime,
) -> bool:
    """生成したAI資料を、フォームに入力されたアドレスへ送る。

    Returns:
        送信できたら True。設定不足・失敗時は False（例外は投げない）。
        資料自体はレスポンスでも返すため、送信できなくても画面では閲覧できる。
    """
    if not settings.mail_host:
        logger.warning(
            "MAIL_HOST が未設定のため資料メールを送信しませんでした reference=%s",
            reference,
        )
        return False

    message = _build_document_mail(request, sections, reference, generated_at)

    try:
        await asyncio.to_thread(_send_sync, message)
    except (smtplib.SMTPException, OSError) as exc:
        # 宛先アドレスはログに残さない（第三者が閲覧しうるため）
        logger.error(
            "資料メールの送信に失敗しました reference=%s error=%s",
            reference,
            exc,
        )
        return False

    logger.info("資料メールを送信しました reference=%s", reference)
    return True


def _build_document_notification(request: DocumentRequest, reference: str) -> EmailMessage:
    message = EmailMessage()
    message["Subject"] = f"[資料請求 {reference}] {request.company_name}"
    message["From"] = formataddr((settings.mail_from_name, settings.mail_from_address))
    message["To"] = settings.contact_mail_to or ""
    message["Reply-To"] = str(request.email)

    message.set_content(
        f"""資料ダウンロードフォームから請求がありました。

資料番号   : {reference}
会社名     : {request.company_name}
業界       : {industry_label(request.industry) or "（未記入）"}
部署       : {request.department or "（未記入）"}
役職       : {request.role or "（未記入）"}
お名前     : {request.full_name}
メール     : {request.email}

【追加要件・ご要望】
{request.additional_requirements or "（未記入）"}

---
このメールは {settings.app_name} から自動送信されています。
"""
    )
    return message


async def send_document_notification(request: DocumentRequest, reference: str) -> bool:
    """資料請求があったことを担当者へ知らせる。

    このフォームは DB へ保存していないため、通知を送らないとリードが残らない。
    CONTACT_MAIL_TO 未設定なら何もしない。
    """
    if not settings.contact_mail_to or not settings.mail_host:
        return False

    try:
        await asyncio.to_thread(_send_sync, _build_document_notification(request, reference))
    except (smtplib.SMTPException, OSError) as exc:
        logger.error(
            "資料請求の担当者通知に失敗しました reference=%s error=%s", reference, exc
        )
        return False

    logger.info("資料請求の担当者通知を送信しました reference=%s", reference)
    return True
