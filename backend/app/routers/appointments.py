"""面談予約エンドポイント。

以前、面談予約は /api/contact へテキストとして流し込まれていた。
保存はされていたが、

  - 希望日時が本文の一部でしかなく、日付で検索できない
  - 同じ枠が二重に埋まっても誰も気づかない
  - 申込者には画面の受付番号しか残らない（控えのメールがない）
  - 担当者が確認する手段が通知メールだけで、一覧も状態管理もない

という状態だった。ここでは予約を独立した資源として扱う。

公開されているのは POST（申し込み）と GET /availability（空き枠）だけ。
一覧・詳細・状態更新は管理者（ADMIN_EMAILS）に限る。
予約には氏名・電話番号が含まれるため、認証だけでは足りない。
"""
from __future__ import annotations

import logging
from datetime import UTC, date, datetime
from typing import Annotated

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query, Request, status
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import session_scope
from app.dependencies import AdminUser, DbSession, OptionalUser, client_ip
from app.models import ACTIVE_STATUSES, Appointment, AppointmentStatus
from app.rate_limit import rate_limit
from app.schemas import (
    AppointmentCreate,
    AppointmentCreated,
    AppointmentDetail,
    AppointmentList,
    AppointmentSummary,
    AppointmentUpdate,
    AvailabilityOut,
    SlotAvailability,
)
from app.services.appointment import (
    MAX_LEAD_DAYS,
    TIME_SLOTS,
    is_business_day,
    today_jst,
)
from app.services.mailer import (
    notifies_applicant,
    send_appointment_ack,
    send_appointment_notification,
    send_appointment_status_notice,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/appointments", tags=["appointments"])

SLOT_TAKEN_MESSAGE = "ご希望の枠はすでに埋まっています。別の日時をお選びください。"

SLOT_CONFLICT_MESSAGE = "この枠には別の予約が入っています。先にそちらを取り消してください。"


async def _taken_slots(db: AsyncSession, target: date) -> set[str]:
    """指定日で埋まっている枠。キャンセル済み・実施済みは含めない。"""
    result = await db.scalars(
        select(Appointment.preferred_slot).where(
            Appointment.preferred_date == target,
            Appointment.status.in_(ACTIVE_STATUSES),
        )
    )
    return set(result.all())


async def _deliver_mails(appointment_id: int) -> None:
    """控えと担当者通知を送り、結果を記録する。

    バックグラウンドで動く。SMTP が遅くても申込者を待たせないため。
    ここで例外を外に出すと ASGI の呼び出し元まで伝播し、
    受付済みのリクエストがエラー扱いになるので、必ず握る。

    送信できたかを DB に残すのは、「控えが届かない」と言われたときに
    送信の成否を管理画面で確認できるようにするため。
    """
    ack = False
    notified = False
    try:
        async with session_scope() as session:
            appointment = await session.get(Appointment, appointment_id)
            if appointment is None:  # pragma: no cover - 直前に作成済み
                logger.error("予約が見つかりません id=%s", appointment_id)
                return

            # 2通は独立して送る。控えの失敗で担当者通知まで止めると、
            # 予約が入ったこと自体に誰も気づけなくなる。
            for label, send in (
                ("控え", send_appointment_ack),
                ("担当者通知", send_appointment_notification),
            ):
                try:
                    result = await send(appointment)
                except Exception:  # noqa: BLE001 - 片方の失敗を波及させない
                    logger.exception(
                        "予約メール(%s)の送信中に例外 reference=%s",
                        label,
                        appointment.reference,
                    )
                    result = False
                if label == "控え":
                    ack = result
                else:
                    notified = result

            appointment.ack_sent = ack
            appointment.staff_notified = notified
            await session.commit()
    except Exception:  # noqa: BLE001 - 通知失敗で受付を壊さない
        logger.exception(
            "予約メールの記録中に例外 id=%s ack=%s notified=%s",
            appointment_id,
            ack,
            notified,
        )


# --------------------------------------------------------------------- 申し込み


@router.post(
    "",
    response_model=AppointmentCreated,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(rate_limit(settings.rate_limit_appointment, "appointments:create"))],
)
async def create_appointment(
    payload: AppointmentCreate,
    request: Request,
    background_tasks: BackgroundTasks,
    db: DbSession,
    current_user: OptionalUser,
) -> AppointmentCreated:
    """面談予約を受け付ける。

    この時点では「申し込みを受け付けた（pending）」であって確定ではない。
    担当者が管理画面で確定させて初めて confirmed になる。
    """
    if payload.preferred_slot in await _taken_slots(db, payload.preferred_date):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=SLOT_TAKEN_MESSAGE)

    appointment = Appointment(
        reference=Appointment.generate_reference(),
        user_id=current_user.id if current_user else None,
        name=payload.name,
        email=str(payload.email),
        phone=payload.phone,
        company=payload.company,
        department=payload.department,
        position=payload.position,
        consultation_type=payload.consultation_type,
        preferred_date=payload.preferred_date,
        preferred_slot=payload.preferred_slot,
        message=payload.message,
        ip_address=client_ip(request)[:45],
        user_agent=(request.headers.get("user-agent") or "")[:512] or None,
    )
    db.add(appointment)

    try:
        await db.commit()
    except IntegrityError:
        # 上の確認を通ったあとに、別のリクエストが同じ枠を押さえた場合。
        # 部分ユニークインデックスが最後の砦になる。
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail=SLOT_TAKEN_MESSAGE
        ) from None

    await db.refresh(appointment)

    # メールはバックグラウンドへ回す。届かなくても予約自体は DB に残る。
    background_tasks.add_task(_deliver_mails, appointment.id)

    logger.info(
        "面談予約を受け付けました reference=%s date=%s slot=%s",
        appointment.reference,
        appointment.preferred_date,
        appointment.preferred_slot,
    )

    return AppointmentCreated(
        message=(
            "面談のお申し込みを受け付けました。"
            "確認のメールをお送りしています。"
            "日程は担当者の確認後に確定し、2営業日以内にご連絡いたします。"
        ),
        reference=appointment.reference,
        preferred_date=appointment.preferred_date,
        preferred_slot=appointment.preferred_slot,
        appointment_status=appointment.status,
        submitted_at=appointment.created_at,
    )


@router.get("/availability", response_model=AvailabilityOut)
async def get_availability(
    db: DbSession,
    target: Annotated[date, Query(alias="date", description="YYYY-MM-DD")],
) -> AvailabilityOut:
    """指定日の空き枠。フォームで埋まっている枠を落とすために使う。

    受付できない日（過去・土日・先すぎる日）は理由を添えて全枠 false で返す。
    画面側で同じ判定を書くと、サーバーの判定とずれて
    「選べるのに送信すると弾かれる」ことになる。
    """
    today = today_jst()
    reason: str | None = None

    if target < today:
        reason = "過去の日付は指定できません"
    elif (target - today).days > MAX_LEAD_DAYS:
        reason = f"ご予約は{MAX_LEAD_DAYS}日先までとさせていただいています"
    elif not is_business_day(target):
        reason = "土日は受け付けておりません"

    if reason is not None:
        return AvailabilityOut(
            date=target,
            bookable=False,
            reason=reason,
            slots=[SlotAvailability(slot=s, available=False) for s in TIME_SLOTS],
        )

    taken = await _taken_slots(db, target)
    return AvailabilityOut(
        date=target,
        bookable=True,
        slots=[SlotAvailability(slot=s, available=s not in taken) for s in TIME_SLOTS],
    )


# --------------------------------------------------------------------- 管理用
# ここから下は管理者（ADMIN_EMAILS）のみ。
# 予約には氏名・電話番号・会社名が含まれるため、ログイン済みというだけでは通さない。


@router.get("", response_model=AppointmentList)
async def list_appointments(
    _admin: AdminUser,
    db: DbSession,
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    status_filter: Annotated[AppointmentStatus | None, Query(alias="status")] = None,
    upcoming: bool = Query(
        default=False, description="true なら今日以降の予約だけを希望日の昇順で返す"
    ),
) -> AppointmentList:
    conditions = []
    if status_filter is not None:
        conditions.append(Appointment.status == status_filter)
    if upcoming:
        conditions.append(Appointment.preferred_date >= today_jst())

    total = await db.scalar(select(func.count(Appointment.id)).where(*conditions))

    query = select(Appointment).where(*conditions)
    if upcoming:
        # 直近の予定から見たい
        query = query.order_by(Appointment.preferred_date, Appointment.preferred_slot)
    else:
        # 新しい申し込みから見たい
        query = query.order_by(Appointment.created_at.desc(), Appointment.id.desc())

    result = await db.scalars(query.limit(limit).offset(offset))

    return AppointmentList(
        total=int(total or 0),
        items=[AppointmentSummary.model_validate(a) for a in result.all()],
    )


@router.get("/{reference}", response_model=AppointmentDetail)
async def get_appointment(reference: str, _admin: AdminUser, db: DbSession) -> AppointmentDetail:
    appointment = await db.scalar(select(Appointment).where(Appointment.reference == reference))
    if appointment is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="予約が見つかりません")
    return AppointmentDetail.model_validate(appointment)


@router.patch("/{reference}", response_model=AppointmentDetail)
async def update_appointment(
    reference: str,
    payload: AppointmentUpdate,
    _admin: AdminUser,
    db: DbSession,
) -> AppointmentDetail:
    """状態と担当者メモを更新する。

    申込者が入力した内容は書き換えない。日時を動かしたい場合は
    合意のうえでキャンセルし、新しい予約として登録する（履歴が残るため）。

    確定・取消にしたときは、申込者へその旨をメールで送る（payload.notify）。
    送信はバックグラウンドに回さず、この場で待つ。担当者は1件ずつ操作しており、
    「確定にしたのにメールが飛んでいない」ことをその場で知れたほうが、
    数十秒待たされるより損害が小さい。
    """
    appointment = await db.scalar(select(Appointment).where(Appointment.reference == reference))
    if appointment is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="予約が見つかりません")

    if payload.staff_note is not None:
        appointment.staff_note = payload.staff_note

    status_changed = payload.status is not None and payload.status != appointment.status

    if payload.status is not None and payload.status != appointment.status:
        # 解放済みの枠へ戻すときは、その間に別の予約が入っていないか確認する
        if (
            payload.status in ACTIVE_STATUSES
            and appointment.status not in ACTIVE_STATUSES
            and appointment.preferred_slot
            in await _taken_slots(db, appointment.preferred_date)
        ):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT, detail=SLOT_CONFLICT_MESSAGE
            )

        appointment.status = payload.status

        if payload.status is AppointmentStatus.CONFIRMED:
            appointment.confirmed_at = datetime.now(tz=UTC)
        elif payload.status in (AppointmentStatus.PENDING, AppointmentStatus.CANCELLED):
            # 未確定に戻した／取り消した場合は確定日時を落とす。
            # completed のときは残す（実施したなら確定していたはずのため）。
            appointment.confirmed_at = None

        # 状態が変われば、申込者に伝えてある内容は古くなる。
        # 一旦 NULL に戻し、この変更を知らせられたときだけ入れ直す。
        appointment.status_notice_sent_at = None

    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail=SLOT_CONFLICT_MESSAGE
        ) from None

    # 状態が「確定」「取消」に変わったときだけ申込者へ知らせる。
    # 未確定へ戻す・実施済みにするのは社内の整理であって、
    # 申込者へ伝える出来事ではない。
    if status_changed and payload.notify and notifies_applicant(appointment.status):
        try:
            sent = await send_appointment_status_notice(appointment)
        except Exception:  # noqa: BLE001 - 通知の失敗で状態変更を巻き戻さない
            logger.exception("状態通知の送信中に例外 reference=%s", appointment.reference)
            sent = False

        if sent:
            appointment.status_notice_sent_at = datetime.now(tz=UTC)
            await db.commit()

    await db.refresh(appointment)
    logger.info(
        "予約を更新しました reference=%s status=%s notice=%s",
        appointment.reference,
        appointment.status.value,
        appointment.status_notice_sent_at is not None,
    )
    return AppointmentDetail.model_validate(appointment)
