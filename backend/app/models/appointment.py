"""面談予約モデル。

以前、面談予約は「お問い合わせ」の本文へテキストとして流し込まれていた。

    【面談予約】
    ご希望日: 2026-08-24
    ご希望時間帯: 10:00-11:00
    ...

保存はされていたが、希望日時が本文の一部でしかないため
「明日の予約」を検索することも、枠の重複を検知することもできなかった。
ここでは希望日・希望時間帯・相談区分を独立した列として持ち、
予約そのものを一次データとして扱う。
"""
from __future__ import annotations

import enum
import secrets
from datetime import date, datetime, timezone
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, Date, DateTime, Enum, ForeignKey, Index, String, Text, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin
from app.services.appointment import consultation_label

if TYPE_CHECKING:
    from app.models.user import User


class AppointmentStatus(str, enum.Enum):
    """予約のライフサイクル。

    申し込んだ時点では PENDING（＝枠は仮押さえ）であり、
    担当者が CONFIRMED にして初めて確定する。
    フォーム送信をそのまま「予約確定」として扱わないための区別。
    """

    PENDING = "pending"        # 申し込みを受け付けた（未確定）
    CONFIRMED = "confirmed"    # 担当者が確定した
    CANCELLED = "cancelled"    # 取り消した（枠は解放される）
    COMPLETED = "completed"    # 面談を実施した


# 枠を占有している状態。キャンセル済みと実施済みは重複判定の対象にしない。
ACTIVE_STATUSES = (AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED)


class Appointment(Base, TimestampMixin):
    __tablename__ = "appointments"
    __table_args__ = (
        # 同じ枠を二重に押さえられないようにする。
        # アプリ側でも重複を確認しているが、同時に2件申し込まれると
        # 「両方とも空きと判定して両方 INSERT」が起こりうる。
        # 部分ユニークインデックスなら DB が最後の砦になる。
        # キャンセル済み・実施済みは対象外（枠を解放するため）。
        Index(
            "uq_appointments_active_slot",
            "preferred_date",
            "preferred_slot",
            unique=True,
            postgresql_where=text("status IN ('pending', 'confirmed')"),
            sqlite_where=text("status IN ('pending', 'confirmed')"),
        ),
        # 管理一覧の既定の並び（状態で絞って新しい順）に効かせる
        Index("ix_appointments_status_created_at", "status", "created_at"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)

    # お客様に提示する受付番号
    reference: Mapped[str] = mapped_column(String(32), unique=True, index=True, nullable=False)

    # ログイン中に申し込まれた場合のみ紐づく
    user_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )

    # ------------------------------------------------------------- 申込者
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(255), index=True, nullable=False)
    phone: Mapped[str] = mapped_column(String(50), nullable=False)
    company: Mapped[str] = mapped_column(String(255), nullable=False)
    department: Mapped[str | None] = mapped_column(String(255), nullable=True)
    position: Mapped[str | None] = mapped_column(String(255), nullable=True)

    # ------------------------------------------------------------- 予約内容
    # 相談区分は表示名ではなくキーで保存する（ラベル変更で過去データが壊れないように）
    consultation_type: Mapped[str] = mapped_column(String(50), nullable=False)
    preferred_date: Mapped[date] = mapped_column(Date(), nullable=False, index=True)
    # '10:00-11:00' 形式。値は app.services.appointment.TIME_SLOTS に限る
    preferred_slot: Mapped[str] = mapped_column(String(20), nullable=False)
    message: Mapped[str | None] = mapped_column(Text, nullable=True)

    # ------------------------------------------------------------- 運用
    status: Mapped[AppointmentStatus] = mapped_column(
        Enum(
            AppointmentStatus,
            name="appointment_status",
            values_callable=lambda e: [m.value for m in e],
        ),
        default=AppointmentStatus.PENDING,
        nullable=False,
    )
    # 担当者用のメモ。申込者には見せない
    staff_note: Mapped[str | None] = mapped_column(Text, nullable=True)
    confirmed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # メールの結果。「送ったつもり」を管理画面で見分けられるようにする
    ack_sent: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    staff_notified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # 「いまの状態」を申込者へ知らせた日時。NULL なら知らせていない。
    # 状態を変えるたびに NULL に戻すため、確定済みなのにここが NULL なら
    # 「確定したが本人はまだ知らない」と読める。
    status_notice_sent_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # 迷惑メール調査・不正利用調査のために保持する
    ip_address: Mapped[str | None] = mapped_column(String(45), nullable=True)
    user_agent: Mapped[str | None] = mapped_column(String(512), nullable=True)

    user: Mapped["User | None"] = relationship(back_populates="appointments")

    @property
    def consultation_label(self) -> str:
        """相談区分の表示名。メール本文と管理画面で同じ文字列を使う。"""
        return consultation_label(self.consultation_type)

    @staticmethod
    def generate_reference() -> str:
        """受付番号を採番する。日付＋暗号論的乱数で一意性を確保する。"""
        today = datetime.now(tz=timezone.utc).strftime("%Y%m%d")
        return f"AP-{today}-{secrets.token_hex(4).upper()}"

    def __repr__(self) -> str:  # pragma: no cover - デバッグ用
        return (
            f"<Appointment reference={self.reference!r} "
            f"{self.preferred_date} {self.preferred_slot} status={self.status.value}>"
        )
