"""お問い合わせモデル。

旧 Laravel 実装ではログ出力のみで内容が永続化されていなかった。
ここでは PostgreSQL に保存し、後から追跡できるようにする。
"""
from __future__ import annotations

import enum
import secrets
from datetime import datetime, timezone
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Enum, ForeignKey, Index, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.user import User


class ContactMethod(str, enum.Enum):
    EMAIL = "email"
    PHONE = "phone"
    BOTH = "both"


class Urgency(str, enum.Enum):
    LOW = "low"
    NORMAL = "normal"
    HIGH = "high"
    URGENT = "urgent"


class ContactStatus(str, enum.Enum):
    NEW = "new"
    IN_PROGRESS = "in_progress"
    CLOSED = "closed"


class Contact(Base, TimestampMixin):
    __tablename__ = "contacts"
    __table_args__ = (
        Index("ix_contacts_status_created_at", "status", "created_at"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)

    # お客様に提示する受付番号
    reference: Mapped[str] = mapped_column(String(32), unique=True, index=True, nullable=False)

    # ログイン中に送信された場合のみ紐づく
    user_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(255), index=True, nullable=False)
    organization: Mapped[str | None] = mapped_column(String(255), nullable=True)
    role: Mapped[str | None] = mapped_column(String(255), nullable=True)

    subject: Mapped[str] = mapped_column(String(255), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)

    contact_method: Mapped[ContactMethod] = mapped_column(
        Enum(ContactMethod, name="contact_method", values_callable=lambda e: [m.value for m in e]),
        default=ContactMethod.EMAIL,
        nullable=False,
    )
    urgency: Mapped[Urgency] = mapped_column(
        Enum(Urgency, name="urgency", values_callable=lambda e: [m.value for m in e]),
        default=Urgency.NORMAL,
        nullable=False,
    )
    status: Mapped[ContactStatus] = mapped_column(
        Enum(ContactStatus, name="contact_status", values_callable=lambda e: [m.value for m in e]),
        default=ContactStatus.NEW,
        nullable=False,
    )

    # 迷惑メール調査・不正利用調査のために保持する
    ip_address: Mapped[str | None] = mapped_column(String(45), nullable=True)
    user_agent: Mapped[str | None] = mapped_column(String(512), nullable=True)

    responded_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    user: Mapped["User | None"] = relationship(back_populates="contacts")

    @staticmethod
    def generate_reference() -> str:
        """受付番号を採番する。

        旧実装は `'CT-' . time()` で、同一秒内に複数の問い合わせがあると衝突した。
        日付＋暗号論的乱数で一意性を確保する。
        """
        today = datetime.now(tz=timezone.utc).strftime("%Y%m%d")
        return f"CT-{today}-{secrets.token_hex(4).upper()}"

    def __repr__(self) -> str:  # pragma: no cover - デバッグ用
        return f"<Contact reference={self.reference!r} status={self.status.value}>"
