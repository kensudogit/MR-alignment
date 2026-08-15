"""AI資料の記録（generated_documents / document_revisions）

/api/documents は生成した資料をどこにも保存していなかったため、
ファインチューニングの教師データを作る手段が無かった。

生成物（generated_documents）と人が手直しした版（document_revisions）を
対で残す。この差分がそのまま学習データになる。

Revision ID: 0002
Revises: 0001
Create Date: 2026-08-15

"""
from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0002"
down_revision: str | None = "0001"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

# PostgreSQL では JSONB、それ以外（テストの SQLite）では JSON
_JSON = sa.JSON().with_variant(postgresql.JSONB(astext_type=sa.Text()), "postgresql")

# ENUM 型はここで作らない。create_table が列定義から自動生成する。
# 明示的に create すると、その後 create_table が同じ型を作ろうとして
# DuplicateObjectError になる（0001 と同じ書き方に揃えている）。
_DOCUMENT_STATUS = sa.Enum(
    "generated",
    "reviewed",
    "sent",
    "rejected",
    name="document_status",
)


def upgrade() -> None:
    op.create_table(
        "generated_documents",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("reference", sa.String(length=32), nullable=False),
        # 入力
        sa.Column("company_name", sa.String(length=255), nullable=False),
        sa.Column("industry", sa.String(length=100), nullable=True),
        sa.Column("department", sa.String(length=255), nullable=True),
        sa.Column("role", sa.String(length=255), nullable=True),
        sa.Column("person_name", sa.String(length=255), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("additional_requirements", sa.Text(), nullable=True),
        # 出力
        sa.Column("sections", _JSON, nullable=False),
        # 生成条件
        sa.Column("model", sa.String(length=100), nullable=False),
        sa.Column("prompt_version", sa.String(length=32), nullable=False),
        sa.Column(
            "status", _DOCUMENT_STATUS, nullable=False, server_default="generated"
        ),
        sa.Column(
            "email_sent", sa.Boolean(), nullable=False, server_default=sa.false()
        ),
        sa.Column("ip_address", sa.String(length=45), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id", name="pk_generated_documents"),
    )
    op.create_index(
        "ix_generated_documents_reference", "generated_documents", ["reference"], unique=True
    )
    op.create_index("ix_generated_documents_email", "generated_documents", ["email"])
    op.create_index(
        "ix_generated_documents_status_created_at",
        "generated_documents",
        ["status", "created_at"],
    )

    op.create_table(
        "document_revisions",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("document_id", sa.Integer(), nullable=False),
        sa.Column("sections", _JSON, nullable=False),
        sa.Column("editor_id", sa.Integer(), nullable=True),
        sa.Column("note", sa.Text(), nullable=True),
        sa.Column(
            "changed_section_count", sa.Integer(), nullable=False, server_default="0"
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id", name="pk_document_revisions"),
        sa.ForeignKeyConstraint(
            ["document_id"],
            ["generated_documents.id"],
            name="fk_document_revisions_document_id",
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["editor_id"],
            ["users.id"],
            name="fk_document_revisions_editor_id",
            ondelete="SET NULL",
        ),
    )
    op.create_index(
        "ix_document_revisions_document_id", "document_revisions", ["document_id"]
    )
    op.create_index(
        "ix_document_revisions_editor_id", "document_revisions", ["editor_id"]
    )


def downgrade() -> None:
    op.drop_index("ix_document_revisions_editor_id", table_name="document_revisions")
    op.drop_index("ix_document_revisions_document_id", table_name="document_revisions")
    op.drop_table("document_revisions")

    op.drop_index(
        "ix_generated_documents_status_created_at", table_name="generated_documents"
    )
    op.drop_index("ix_generated_documents_email", table_name="generated_documents")
    op.drop_index("ix_generated_documents_reference", table_name="generated_documents")
    op.drop_table("generated_documents")

    # PostgreSQL では ENUM 型がテーブル削除後も残るため明示的に落とす
    bind = op.get_bind()
    if bind.dialect.name == "postgresql":
        _DOCUMENT_STATUS.drop(bind, checkfirst=True)
