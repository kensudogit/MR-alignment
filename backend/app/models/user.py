"""ユーザーモデル。"""
from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.contact import Contact


class User(Base, TimestampMixin):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)

    # ハッシュ値のみを保持する。平文パスワードは一切保存しない。
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)

    organization: Mapped[str | None] = mapped_column(String(255), nullable=True)
    role: Mapped[str | None] = mapped_column(String(255), nullable=True)

    is_active: Mapped[bool] = mapped_column(default=True, nullable=False)

    email_verified_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    last_login_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # パスワード変更時にインクリメントする。
    # 発行済み JWT はすべて古い token_version を持つため、一括で無効化できる。
    token_version: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    contacts: Mapped[list["Contact"]] = relationship(
        back_populates="user",
        cascade="save-update, merge",
    )

    def __repr__(self) -> str:  # pragma: no cover - デバッグ用
        return f"<User id={self.id} email={self.email!r}>"
