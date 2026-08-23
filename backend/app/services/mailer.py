"""メール送信。

標準ライブラリの smtplib を使い、外部依存を増やさない。
smtplib は同期 API のため、イベントループを止めないよう
`asyncio.to_thread` でワーカースレッドへ逃がす。

送信失敗はログに残すのみで、呼び出し側の処理は継続させる。
お問い合わせは先に DB へ保存済みであり、メールが飛ばなくても内容は失われない。
AI資料についても、送信可否を戻り値で返して画面側に伝える。

扱うメールは6種類。
  1. お問い合わせ通知      → 担当者(CONTACT_MAIL_TO)宛
  2. AI資料               → フォームに入力されたお客様のアドレス宛
  3. 資料請求の受付通知     → 担当者(CONTACT_MAIL_TO)宛
  4. 面談予約の受付控え     → 申し込まれたお客様のアドレス宛（自動返信）
  5. 面談予約の通知        → 担当者(CONTACT_MAIL_TO)宛
  6. 面談予約の確定／取消   → 申し込まれたお客様のアドレス宛（担当者の操作で送る）
"""
from __future__ import annotations

import asyncio
import logging
import smtplib
import ssl
from datetime import datetime
from email.message import EmailMessage
from email.utils import formataddr

from app.config import settings
from app.models import Appointment, AppointmentStatus, Contact
from app.schemas.document import DocumentRequest
from app.services.document import (
    COMPANY_NAME,
    industry_label,
    render_html,
    render_text,
)

logger = logging.getLogger(__name__)

# ISP のメールサーバーは応答が遅いことがある。10秒だと本文の送信中に切れうる。
SMTP_TIMEOUT_SECONDS = 30


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


def _connect() -> smtplib.SMTP:
    """SMTP 接続を張る。

    接続方式は2種類あり、混同するとメールが飛ばない。
      - SMTPS（ポート 465）: 最初から TLS。`SMTP_SSL` を使う
      - STARTTLS（ポート 587）: 平文で接続してから TLS へ切り替える

    ISP のメールサーバー（例: JCOM の mailssl.zaq.ne.jp:465）は前者。
    平文の `SMTP` で 465 につなぐと応答を読めずタイムアウトする。
    """
    host = settings.mail_host
    assert host is not None  # 呼び出し側で確認済み

    if settings.mail_ssl_required:
        return smtplib.SMTP_SSL(
            host,
            settings.mail_port,
            timeout=SMTP_TIMEOUT_SECONDS,
            context=ssl.create_default_context(),
        )

    smtp = smtplib.SMTP(host, settings.mail_port, timeout=SMTP_TIMEOUT_SECONDS)
    if settings.mail_use_tls:
        smtp.starttls(context=ssl.create_default_context())
    return smtp


def _send_sync(message: EmailMessage) -> None:
    if not settings.mail_host:  # pragma: no cover - 呼び出し側で確認済み
        return

    with _connect() as smtp:
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

    生成物は generated_documents へ保存しているが、担当者が気づく手段は
    この通知メールしかない（管理画面はない）。CONTACT_MAIL_TO 未設定なら何もしない。
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


# --------------------------------------------------------------- 面談予約


def _appointment_lines(appointment: Appointment) -> str:
    """予約内容の共通部分。控えと担当者通知で同じ表記にする。"""
    return f"""受付番号   : {appointment.reference}
ご希望日   : {appointment.preferred_date:%Y年%m月%d日}
ご希望時間 : {appointment.preferred_slot}
相談内容   : {appointment.consultation_label}"""


def _build_appointment_ack(appointment: Appointment) -> EmailMessage:
    """申込者へ送る受付の控え。

    件名と本文で「まだ確定ではない」ことを明示する。
    自動返信を「予約確定」と読める文面にすると、担当者の都合が合わなかった
    ときに、お客様は確定したつもりで当日を待つことになる。
    """
    message = EmailMessage()
    message["Subject"] = f"【{COMPANY_NAME}】面談予約を承りました（{appointment.reference}）"
    message["From"] = formataddr((settings.mail_from_name, settings.mail_from_address))
    message["To"] = formataddr((appointment.name, appointment.email))

    # 返信は担当者へ届くようにする。未設定なら送信元のまま
    if settings.contact_mail_to:
        message["Reply-To"] = settings.contact_mail_to

    message.set_content(
        f"""{appointment.name} 様

このたびは面談のお申し込みをいただき、ありがとうございます。
以下の内容で承りました。

{_appointment_lines(appointment)}

【ご入力いただいた内容】
会社名     : {appointment.company}
部署       : {appointment.department or "（未記入）"}
役職       : {appointment.position or "（未記入）"}
電話番号   : {appointment.phone}

【ご要望・ご質問】
{appointment.message or "（記載なし）"}

──────────────────────────────
※このメールは受付の控えです。面談の日時はまだ確定していません。
　担当者が空き状況を確認のうえ、2営業日以内に確定のご連絡を差し上げます。
　日程の変更・キャンセルは、このメールへ返信してお知らせください。
──────────────────────────────

{COMPANY_NAME}
{settings.mail_from_address}
"""
    )
    return message


def _build_appointment_notification(appointment: Appointment) -> EmailMessage:
    message = EmailMessage()
    message["Subject"] = (
        f"[面談予約 {appointment.reference}] "
        f"{appointment.preferred_date:%m/%d} {appointment.preferred_slot} "
        f"{appointment.company}"
    )
    message["From"] = formataddr((settings.mail_from_name, settings.mail_from_address))
    message["To"] = settings.contact_mail_to or ""
    # 返信するとお客様へ直接届くようにする
    message["Reply-To"] = appointment.email

    message.set_content(
        f"""面談予約の申し込みがありました。確定のご連絡をお願いします。

{_appointment_lines(appointment)}

お名前     : {appointment.name}
会社名     : {appointment.company}
部署       : {appointment.department or "（未記入）"}
役職       : {appointment.position or "（未記入）"}
メール     : {appointment.email}
電話番号   : {appointment.phone}
申込日時   : {appointment.created_at:%Y-%m-%d %H:%M:%S}

【ご要望・ご質問】
{appointment.message or "（記載なし）"}

---
このメールは {settings.app_name} から自動送信されています。
"""
    )
    return message


async def send_appointment_ack(appointment: Appointment) -> bool:
    """申込者へ受付の控えを送る。

    Returns:
        送信できたら True。設定不足・失敗時は False（例外は投げない）。
    """
    if not settings.mail_host:
        logger.warning(
            "MAIL_HOST が未設定のため予約控えを送信しませんでした reference=%s",
            appointment.reference,
        )
        return False

    try:
        await asyncio.to_thread(_send_sync, _build_appointment_ack(appointment))
    except (smtplib.SMTPException, OSError) as exc:
        # 宛先アドレスはログに残さない（第三者が閲覧しうるため）
        logger.error(
            "予約控えの送信に失敗しました reference=%s error=%s", appointment.reference, exc
        )
        return False

    logger.info("予約控えを送信しました reference=%s", appointment.reference)
    return True


async def send_appointment_notification(appointment: Appointment) -> bool:
    """担当者へ面談予約を通知する。

    管理画面（/admin/appointments）でも確認できるが、
    予約が入ったことに気づく手段はこの通知メールしかない。
    """
    if not settings.contact_mail_to:
        logger.warning(
            "CONTACT_MAIL_TO が未設定のため予約通知を送信しませんでした reference=%s",
            appointment.reference,
        )
        return False

    if not settings.mail_host:
        logger.warning(
            "MAIL_HOST が未設定のため予約通知を送信しませんでした reference=%s",
            appointment.reference,
        )
        return False

    try:
        await asyncio.to_thread(_send_sync, _build_appointment_notification(appointment))
    except (smtplib.SMTPException, OSError) as exc:
        logger.error(
            "予約通知メールの送信に失敗しました reference=%s error=%s",
            appointment.reference,
            exc,
        )
        return False

    logger.info("予約通知メールを送信しました reference=%s", appointment.reference)
    return True


def _build_appointment_confirmation(appointment: Appointment) -> EmailMessage:
    """日程が確定したことを申込者へ知らせる。

    担当者メモ（staff_note）は絶対に載せない。社内の申し送りであり、
    申込者に見せる前提で書かれていない。
    """
    message = EmailMessage()
    message["Subject"] = f"【{COMPANY_NAME}】面談日程が確定しました（{appointment.reference}）"
    message["From"] = formataddr((settings.mail_from_name, settings.mail_from_address))
    message["To"] = formataddr((appointment.name, appointment.email))

    if settings.contact_mail_to:
        message["Reply-To"] = settings.contact_mail_to

    message.set_content(
        f"""{appointment.name} 様

お待たせいたしました。面談の日程が確定しましたのでお知らせします。

{_appointment_lines(appointment)}

当日の接続方法・場所については、必要に応じて別途ご案内いたします。
ご都合が変わった場合は、このメールへ返信してお知らせください。

どうぞよろしくお願いいたします。

{COMPANY_NAME}
{settings.mail_from_address}
"""
    )
    return message


def _build_appointment_cancellation(appointment: Appointment) -> EmailMessage:
    """予約を取り消したことを申込者へ知らせる。"""
    message = EmailMessage()
    message["Subject"] = f"【{COMPANY_NAME}】面談予約を取り消しました（{appointment.reference}）"
    message["From"] = formataddr((settings.mail_from_name, settings.mail_from_address))
    message["To"] = formataddr((appointment.name, appointment.email))

    if settings.contact_mail_to:
        message["Reply-To"] = settings.contact_mail_to

    message.set_content(
        f"""{appointment.name} 様

以下の面談予約を取り消しましたのでお知らせします。

{_appointment_lines(appointment)}

改めてご相談をご希望の場合は、このメールへ返信いただくか、
サイトの面談予約フォームから別の日時をお選びください。

{COMPANY_NAME}
{settings.mail_from_address}
"""
    )
    return message


# 状態ごとの文面。ここに無い状態（未確定・実施済み）では通知を送らない。
# 「未確定に戻した」「実施済みにした」は社内の整理であって、
# 申込者へ知らせる出来事ではない。
_STATUS_NOTICES = {
    AppointmentStatus.CONFIRMED: _build_appointment_confirmation,
    AppointmentStatus.CANCELLED: _build_appointment_cancellation,
}


def notifies_applicant(status: AppointmentStatus) -> bool:
    """その状態への変更を申込者へ知らせるか。

    呼び出し側（ルーター）がこの判定を持つと、文面の有無と食い違う。
    どの状態を知らせるかは、文面を持っているこのモジュールが唯一の情報源。
    """
    return status in _STATUS_NOTICES


async def send_appointment_status_notice(appointment: Appointment) -> bool:
    """確定・キャンセルを申込者へ知らせる。

    Returns:
        送信できたら True。対象外の状態・設定不足・失敗時は False（例外は投げない）。
    """
    builder = _STATUS_NOTICES.get(appointment.status)
    if builder is None:
        return False

    if not settings.mail_host:
        logger.warning(
            "MAIL_HOST が未設定のため状態通知を送信しませんでした reference=%s status=%s",
            appointment.reference,
            appointment.status.value,
        )
        return False

    try:
        await asyncio.to_thread(_send_sync, builder(appointment))
    except (smtplib.SMTPException, OSError) as exc:
        # 宛先アドレスはログに残さない（第三者が閲覧しうるため）
        logger.error(
            "状態通知の送信に失敗しました reference=%s status=%s error=%s",
            appointment.reference,
            appointment.status.value,
            exc,
        )
        return False

    logger.info(
        "状態通知を送信しました reference=%s status=%s",
        appointment.reference,
        appointment.status.value,
    )
    return True
