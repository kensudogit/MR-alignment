"""面談予約: 状態変更の通知日時（appointments.status_notice_sent_at）

確定・キャンセルを申込者へ自動で知らせるようにしたため、
「いつ知らせたか」を残す列を足す。

日時で持つのは、状態を戻して再通知したときに
「最後に何を伝えたか」を追えるようにするため。
NULL なら一度も知らせていない。

Revision ID: 0004
Revises: 0003
Create Date: 2026-08-23

"""
from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0004"
down_revision: str | None = "0003"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "appointments",
        sa.Column("status_notice_sent_at", sa.DateTime(timezone=True), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("appointments", "status_notice_sent_at")
