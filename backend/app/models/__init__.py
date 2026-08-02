"""モデル定義。

Alembic がすべてのテーブルを検出できるよう、ここで必ず import しておく。
import 漏れがあると autogenerate がテーブルを削除する差分を作ってしまう。
"""
from app.models.base import Base, TimestampMixin
from app.models.contact import Contact, ContactMethod, ContactStatus, Urgency
from app.models.revoked_token import RevokedToken
from app.models.user import User

__all__ = [
    "Base",
    "TimestampMixin",
    "User",
    "Contact",
    "ContactMethod",
    "ContactStatus",
    "Urgency",
    "RevokedToken",
]
