"""お問い合わせエンドポイント。"""
from __future__ import annotations

import logging

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query, Request, status
from sqlalchemy import func, select

from app.config import settings
from app.dependencies import CurrentUser, DbSession, OptionalUser, client_ip
from app.models import Contact
from app.rate_limit import rate_limit
from app.schemas import ContactCreate, ContactCreated, ContactDetail, ContactList
from app.services.mailer import send_contact_notification

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/contact", tags=["contact"])


async def _notify_safely(contact: Contact) -> None:
    """通知メールを送る。失敗しても例外を外に出さない。

    バックグラウンドタスクで例外が出ると ASGI の呼び出し元まで伝播し、
    受付済みのリクエストがエラー扱いになってしまう。
    お問い合わせは既に DB へ保存済みなので、送信失敗はログだけで足りる。
    """
    try:
        await send_contact_notification(contact)
    except Exception:  # noqa: BLE001 - 通知失敗で受付を壊さない
        logger.exception("お問い合わせ通知の送信中に例外 reference=%s", contact.reference)


@router.post(
    "",
    response_model=ContactCreated,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(rate_limit(settings.rate_limit_contact, "contact:create"))],
)
async def create_contact(
    payload: ContactCreate,
    request: Request,
    background_tasks: BackgroundTasks,
    db: DbSession,
    current_user: OptionalUser,
) -> ContactCreated:
    """お問い合わせを受け付ける。

    旧実装はログ出力のみで内容が失われていた。ここでは PostgreSQL に保存する。
    通知メールはバックグラウンドで送るため、SMTP が遅くても
    利用者を待たせない。送信失敗しても受付自体は成立する。
    """
    contact = Contact(
        reference=Contact.generate_reference(),
        user_id=current_user.id if current_user else None,
        name=payload.name,
        email=payload.email,
        organization=payload.organization,
        role=payload.role,
        subject=payload.subject,
        message=payload.message,
        contact_method=payload.contact_method,
        urgency=payload.urgency,
        ip_address=client_ip(request)[:45],
        user_agent=(request.headers.get("user-agent") or "")[:512] or None,
    )
    db.add(contact)
    await db.commit()
    await db.refresh(contact)

    # 通知は非同期に送る。SMTP が遅くても利用者を待たせない。
    # 送信で何が起きてもリクエスト処理を壊さないよう、必ず握る。
    background_tasks.add_task(_notify_safely, contact)

    logger.info("お問い合わせを受け付けました reference=%s", contact.reference)

    return ContactCreated(
        message="お問い合わせを受け付けました。担当者よりご連絡いたします。",
        contact_id=contact.reference,
        submitted_at=contact.created_at,
    )


@router.get("", response_model=ContactList)
async def list_contacts(
    current_user: CurrentUser,
    db: DbSession,
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
) -> ContactList:
    """自分が送信したお問い合わせの一覧。

    注意: 現時点では管理者ロールの概念が無いため、
    「ログイン中ユーザー自身の問い合わせ」のみを返す。
    全件を扱う管理画面を作る場合は、role による権限判定を追加すること。
    """
    total = await db.scalar(
        select(func.count(Contact.id)).where(Contact.user_id == current_user.id)
    )
    result = await db.scalars(
        select(Contact)
        .where(Contact.user_id == current_user.id)
        .order_by(Contact.created_at.desc())
        .limit(limit)
        .offset(offset)
    )

    return ContactList(
        total=int(total or 0),
        items=[ContactDetail.model_validate(c) for c in result.all()],
    )


@router.get("/{reference}", response_model=ContactDetail)
async def get_contact(reference: str, current_user: CurrentUser, db: DbSession) -> ContactDetail:
    contact = await db.scalar(select(Contact).where(Contact.reference == reference))

    # 他人の問い合わせは 404 として扱う。403 だと受付番号の存在を教えてしまう。
    if contact is None or contact.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="お問い合わせが見つかりません",
        )

    return ContactDetail.model_validate(contact)
