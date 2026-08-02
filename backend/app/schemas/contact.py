"""お問い合わせのスキーマ。"""
from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.models.contact import ContactMethod, ContactStatus, Urgency

MESSAGE_MAX_LENGTH = 2000


class ContactCreate(BaseModel):
    # フロントエンドは camelCase で送ってくるため alias で受ける
    model_config = ConfigDict(populate_by_name=True)

    name: str = Field(min_length=1, max_length=255)
    email: EmailStr = Field(max_length=255)
    organization: str | None = Field(default=None, max_length=255)
    role: str | None = Field(default=None, max_length=255)
    subject: str = Field(min_length=1, max_length=255)
    message: str = Field(min_length=1, max_length=MESSAGE_MAX_LENGTH)
    contact_method: ContactMethod = Field(default=ContactMethod.EMAIL, alias="contactMethod")
    urgency: Urgency = Field(default=Urgency.NORMAL)


class ContactCreated(BaseModel):
    status: str = "success"
    message: str
    contact_id: str = Field(description="お客様提示用の受付番号")
    submitted_at: datetime


class ContactDetail(BaseModel):
    """管理用途。現状は認証必須の一覧取得で使用する。"""

    model_config = ConfigDict(from_attributes=True)

    id: int
    reference: str
    name: str
    email: EmailStr
    organization: str | None
    role: str | None
    subject: str
    message: str
    contact_method: ContactMethod
    urgency: Urgency
    status: ContactStatus
    created_at: datetime
    responded_at: datetime | None


class ContactList(BaseModel):
    status: str = "success"
    total: int
    items: list[ContactDetail]
