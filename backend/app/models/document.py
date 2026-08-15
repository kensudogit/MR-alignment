"""AI資料の記録。

生成した資料を保存していないと、後からファインチューニングの教師データを
作れない。そして本当に価値があるのは「AIが生成した文章」ではなく
「それを人が手直しした後の文章」なので、生成物と修正版を対で残す。

  generated_documents … AIが生成したもの（そのまま）
  document_revisions  … 人が直したもの（何度でも積める）

この2つの差分が、そのまま学習データになる。
"""
from __future__ import annotations

import enum
import secrets
from datetime import datetime, timezone
from typing import TYPE_CHECKING, Any

from sqlalchemy import (
    JSON,
    Boolean,
    Enum,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.user import User

# PostgreSQL では JSONB（索引が張れる）、テストの SQLite では JSON を使う
JSONType = JSON().with_variant(JSONB, "postgresql")


class DocumentStatus(str, enum.Enum):
    """資料のライフサイクル。

    学習データとして使ってよいのは、人の確認を経たもの（reviewed / sent）だけ。
    generated のまま溜まったものを教師データにすると、AIの出力でAIを学習させる
    ことになり、癖が増幅される。
    """

    GENERATED = "generated"      # 生成しただけ
    REVIEWED = "reviewed"        # 人が確認・修正した
    SENT = "sent"                # 顧客へ送付した
    REJECTED = "rejected"        # 使い物にならなかった


class GeneratedDocument(Base, TimestampMixin):
    __tablename__ = "generated_documents"
    __table_args__ = (
        Index("ix_generated_documents_status_created_at", "status", "created_at"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)

    reference: Mapped[str] = mapped_column(
        String(32), unique=True, index=True, nullable=False
    )

    # ------------------------------------------------------------- 入力
    # 生成の再現と、業界別の傾向分析のために入力もそのまま残す
    company_name: Mapped[str] = mapped_column(String(255), nullable=False)
    industry: Mapped[str | None] = mapped_column(String(100), nullable=True)
    department: Mapped[str | None] = mapped_column(String(255), nullable=True)
    role: Mapped[str | None] = mapped_column(String(255), nullable=True)
    person_name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(255), index=True, nullable=False)
    additional_requirements: Mapped[str | None] = mapped_column(Text, nullable=True)

    # ------------------------------------------------------------- 出力
    # 節キー -> 本文。整形後のものを保存する
    sections: Mapped[dict[str, Any]] = mapped_column(JSONType, nullable=False)

    # ------------------------------------------------------------- 生成条件
    # どのモデル・どの版のプロンプトで作ったか。
    # これが無いと、後から「どの条件の出力を教師データに使うか」を選別できない。
    model: Mapped[str] = mapped_column(String(100), nullable=False)
    prompt_version: Mapped[str] = mapped_column(String(32), nullable=False)

    status: Mapped[DocumentStatus] = mapped_column(
        Enum(
            DocumentStatus,
            name="document_status",
            values_callable=lambda e: [m.value for m in e],
        ),
        default=DocumentStatus.GENERATED,
        nullable=False,
    )
    email_sent: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # 不正利用調査のために保持する
    ip_address: Mapped[str | None] = mapped_column(String(45), nullable=True)

    revisions: Mapped[list["DocumentRevision"]] = relationship(
        back_populates="document",
        cascade="all, delete-orphan",
        order_by="DocumentRevision.id",
    )

    @staticmethod
    def generate_reference() -> str:
        today = datetime.now(tz=timezone.utc).strftime("%Y%m%d")
        return f"DOC-{today}-{secrets.token_hex(4).upper()}"

    @property
    def latest_sections(self) -> dict[str, Any]:
        """最新の内容。修正があればそちらを返す。"""
        if self.revisions:
            return self.revisions[-1].sections
        return self.sections

    def __repr__(self) -> str:  # pragma: no cover - デバッグ用
        return f"<GeneratedDocument reference={self.reference!r} status={self.status.value}>"


class DocumentRevision(Base, TimestampMixin):
    """人が手直しした版。

    1つの資料に何度でも積める。最後のものが最新版。
    ここに溜まったものだけが、ファインチューニングの正解データになりうる。
    """

    __tablename__ = "document_revisions"

    id: Mapped[int] = mapped_column(primary_key=True)

    document_id: Mapped[int] = mapped_column(
        ForeignKey("generated_documents.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    sections: Mapped[dict[str, Any]] = mapped_column(JSONType, nullable=False)

    # 誰が直したか。ログイン中の場合のみ紐づく
    editor_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )
    # 「業界の記述が一般論すぎた」など、直した理由。後の分析に効く
    note: Mapped[str | None] = mapped_column(Text, nullable=True)

    # 何節に手が入ったか。全文比較せずに修正量を測れるようにしておく
    changed_section_count: Mapped[int] = mapped_column(
        Integer, default=0, nullable=False
    )

    document: Mapped["GeneratedDocument"] = relationship(back_populates="revisions")
    editor: Mapped["User | None"] = relationship()

    def __repr__(self) -> str:  # pragma: no cover - デバッグ用
        return (
            f"<DocumentRevision document_id={self.document_id} "
            f"changed={self.changed_section_count}>"
        )
