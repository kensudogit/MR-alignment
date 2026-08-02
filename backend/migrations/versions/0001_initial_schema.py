"""初期スキーマ（users / contacts / revoked_tokens）

旧 Laravel スキーマからの変更点:
  - users に organization / role を追加（旧実装では AuthController が保存を
    試みていたがカラムが存在しなかった）
  - contacts を新規追加（旧実装は問い合わせをログ出力のみで永続化していなかった）
  - password_reset_tokens / failed_jobs は Laravel 固有のため廃止
  - personal_access_tokens は JWT + revoked_tokens に置き換え

Revision ID: 0001
Revises:
Create Date: 2026-08-02

"""
from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0001"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("hashed_password", sa.String(length=255), nullable=False),
        sa.Column("organization", sa.String(length=255), nullable=True),
        sa.Column("role", sa.String(length=255), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("email_verified_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("last_login_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("token_version", sa.Integer(), nullable=False, server_default="0"),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.Column(
            "updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.PrimaryKeyConstraint("id", name="pk_users"),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    op.create_table(
        "contacts",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("reference", sa.String(length=32), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=True),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("organization", sa.String(length=255), nullable=True),
        sa.Column("role", sa.String(length=255), nullable=True),
        sa.Column("subject", sa.String(length=255), nullable=False),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column(
            "contact_method",
            sa.Enum("email", "phone", "both", name="contact_method"),
            nullable=False,
            server_default="email",
        ),
        sa.Column(
            "urgency",
            sa.Enum("low", "normal", "high", "urgent", name="urgency"),
            nullable=False,
            server_default="normal",
        ),
        sa.Column(
            "status",
            sa.Enum("new", "in_progress", "closed", name="contact_status"),
            nullable=False,
            server_default="new",
        ),
        sa.Column("ip_address", sa.String(length=45), nullable=True),
        sa.Column("user_agent", sa.String(length=512), nullable=True),
        sa.Column("responded_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.Column(
            "updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["users.id"],
            name="fk_contacts_user_id_users",
            ondelete="SET NULL",
        ),
        sa.PrimaryKeyConstraint("id", name="pk_contacts"),
    )
    op.create_index("ix_contacts_reference", "contacts", ["reference"], unique=True)
    op.create_index("ix_contacts_email", "contacts", ["email"])
    op.create_index("ix_contacts_user_id", "contacts", ["user_id"])
    # 管理画面で「未対応を新しい順に」取得する用途を想定した複合インデックス
    op.create_index("ix_contacts_status_created_at", "contacts", ["status", "created_at"])

    op.create_table(
        "revoked_tokens",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("jti", sa.String(length=64), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=True),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column(
            "revoked_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["users.id"],
            name="fk_revoked_tokens_user_id_users",
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name="pk_revoked_tokens"),
    )
    op.create_index("ix_revoked_tokens_jti", "revoked_tokens", ["jti"], unique=True)
    op.create_index("ix_revoked_tokens_user_id", "revoked_tokens", ["user_id"])
    # 期限切れレコードの一括削除に使う
    op.create_index("ix_revoked_tokens_expires_at", "revoked_tokens", ["expires_at"])


def downgrade() -> None:
    op.drop_index("ix_revoked_tokens_expires_at", table_name="revoked_tokens")
    op.drop_index("ix_revoked_tokens_user_id", table_name="revoked_tokens")
    op.drop_index("ix_revoked_tokens_jti", table_name="revoked_tokens")
    op.drop_table("revoked_tokens")

    op.drop_index("ix_contacts_status_created_at", table_name="contacts")
    op.drop_index("ix_contacts_user_id", table_name="contacts")
    op.drop_index("ix_contacts_email", table_name="contacts")
    op.drop_index("ix_contacts_reference", table_name="contacts")
    op.drop_table("contacts")

    op.drop_index("ix_users_email", table_name="users")
    op.drop_table("users")

    # PostgreSQL では ENUM 型がテーブル削除後も残るため明示的に落とす
    bind = op.get_bind()
    if bind.dialect.name == "postgresql":
        sa.Enum(name="contact_status").drop(bind, checkfirst=True)
        sa.Enum(name="urgency").drop(bind, checkfirst=True)
        sa.Enum(name="contact_method").drop(bind, checkfirst=True)
