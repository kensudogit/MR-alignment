"""失効済みトークン（JWT の個別ログアウト用）。

JWT はステートレスなため、そのままでは「ログアウト」で個別のトークンを
無効化できない。以下の 2 段構えで対応する。

  1. 個別ログアウト  -> このテーブルに jti を記録（本ファイル）
  2. パスワード変更  -> users.token_version をインクリメントし全トークンを無効化

expires_at を過ぎたレコードは検証に不要なため、定期的に削除してよい。
"""
from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class RevokedToken(Base):
    __tablename__ = "revoked_tokens"

    id: Mapped[int] = mapped_column(primary_key=True)

    # JWT の jti クレーム
    jti: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)

    user_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True
    )

    # このトークンが自然失効する時刻。これを過ぎたら行を削除してよい。
    expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, index=True
    )

    revoked_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    def __repr__(self) -> str:  # pragma: no cover - デバッグ用
        return f"<RevokedToken jti={self.jti!r}>"
