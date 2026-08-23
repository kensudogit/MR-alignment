"""面談予約（appointments）

面談予約は /api/contact の本文へテキストとして流し込まれていた。

    【面談予約】
    ご希望日: 2026-08-24
    ご希望時間帯: 10:00-11:00

保存はされていたが、希望日時が本文の一部でしかないため
日付での検索も、枠の重複検知もできなかった。
予約を独立したテーブルとして持つ。

既存の contacts に入っている過去の予約は移行しない。
本文のテキストを機械的に解釈すると、書式のゆらぎで
希望日を取り違える可能性があり、予約データとしては危険なため。
過去分は contacts 側にそのまま残る。

Revision ID: 0003
Revises: 0002
Create Date: 2026-08-23

"""
from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0003"
down_revision: str | None = "0002"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

# ENUM 型はここで作らない。create_table が列定義から自動生成する。
# 明示的に create すると、その後 create_table が同じ型を作ろうとして
# DuplicateObjectError になる（0001 / 0002 と同じ書き方に揃えている）。
_APPOINTMENT_STATUS = sa.Enum(
    "pending",
    "confirmed",
    "cancelled",
    "completed",
    name="appointment_status",
)


def upgrade() -> None:
    op.create_table(
        "appointments",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("reference", sa.String(length=32), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=True),
        # 申込者
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("phone", sa.String(length=50), nullable=False),
        sa.Column("company", sa.String(length=255), nullable=False),
        sa.Column("department", sa.String(length=255), nullable=True),
        sa.Column("position", sa.String(length=255), nullable=True),
        # 予約内容
        sa.Column("consultation_type", sa.String(length=50), nullable=False),
        sa.Column("preferred_date", sa.Date(), nullable=False),
        sa.Column("preferred_slot", sa.String(length=20), nullable=False),
        sa.Column("message", sa.Text(), nullable=True),
        # 運用
        sa.Column(
            "status", _APPOINTMENT_STATUS, nullable=False, server_default="pending"
        ),
        sa.Column("staff_note", sa.Text(), nullable=True),
        sa.Column("confirmed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("ack_sent", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column(
            "staff_notified", sa.Boolean(), nullable=False, server_default=sa.false()
        ),
        sa.Column("ip_address", sa.String(length=45), nullable=True),
        sa.Column("user_agent", sa.String(length=512), nullable=True),
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
        sa.PrimaryKeyConstraint("id", name="pk_appointments"),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["users.id"],
            name="fk_appointments_user_id_users",
            ondelete="SET NULL",
        ),
    )
    op.create_index("ix_appointments_reference", "appointments", ["reference"], unique=True)
    op.create_index("ix_appointments_user_id", "appointments", ["user_id"])
    op.create_index("ix_appointments_email", "appointments", ["email"])
    op.create_index("ix_appointments_preferred_date", "appointments", ["preferred_date"])
    op.create_index(
        "ix_appointments_status_created_at", "appointments", ["status", "created_at"]
    )

    # 同じ枠を二重に押さえられないようにする部分ユニークインデックス。
    # アプリ側でも重複を確認しているが、同時に2件申し込まれると
    # 「両方とも空きと判定して両方 INSERT」が起こりうるため、DB を最後の砦にする。
    # キャンセル済み・実施済みは対象外（枠を解放するため）。
    op.create_index(
        "uq_appointments_active_slot",
        "appointments",
        ["preferred_date", "preferred_slot"],
        unique=True,
        postgresql_where=sa.text("status IN ('pending', 'confirmed')"),
        sqlite_where=sa.text("status IN ('pending', 'confirmed')"),
    )


def downgrade() -> None:
    op.drop_index("uq_appointments_active_slot", table_name="appointments")
    op.drop_index("ix_appointments_status_created_at", table_name="appointments")
    op.drop_index("ix_appointments_preferred_date", table_name="appointments")
    op.drop_index("ix_appointments_email", table_name="appointments")
    op.drop_index("ix_appointments_user_id", table_name="appointments")
    op.drop_index("ix_appointments_reference", table_name="appointments")
    op.drop_table("appointments")

    # PostgreSQL では ENUM 型がテーブル削除後も残るため明示的に落とす
    bind = op.get_bind()
    if bind.dialect.name == "postgresql":
        _APPOINTMENT_STATUS.drop(bind, checkfirst=True)
