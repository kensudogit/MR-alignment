"""認証関連のスキーマ。"""
from __future__ import annotations

import re

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator, model_validator

PASSWORD_MIN_LENGTH = 8
PASSWORD_MAX_LENGTH = 72  # bcrypt の上限に合わせる


def _validate_password_strength(value: str) -> str:
    if len(value) < PASSWORD_MIN_LENGTH:
        raise ValueError(f"パスワードは{PASSWORD_MIN_LENGTH}文字以上にしてください")
    if len(value.encode("utf-8")) > PASSWORD_MAX_LENGTH:
        raise ValueError("パスワードが長すぎます（72バイト以内）")
    if not re.search(r"[A-Za-z]", value):
        raise ValueError("パスワードには英字を含めてください")
    if not re.search(r"\d", value):
        raise ValueError("パスワードには数字を含めてください")
    return value


class UserPublic(BaseModel):
    """API が返すユーザー表現。

    hashed_password や token_version は含めない。
    from_attributes を使いつつ、フィールドを明示することで
    モデルにカラムが増えても勝手に露出しないようにしている。
    """

    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: EmailStr
    organization: str | None = None
    role: str | None = None


class RegisterRequest(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    email: EmailStr = Field(max_length=255)
    password: str
    password_confirmation: str
    organization: str | None = Field(default=None, max_length=255)
    role: str | None = Field(default=None, max_length=255)

    @field_validator("password")
    @classmethod
    def _check_password(cls, v: str) -> str:
        return _validate_password_strength(v)

    @model_validator(mode="after")
    def _check_confirmation(self) -> "RegisterRequest":
        if self.password != self.password_confirmation:
            raise ValueError("パスワードが一致しません")
        return self


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class AuthResponse(BaseModel):
    status: str = "success"
    message: str
    user: UserPublic
    token: str
    token_type: str = "bearer"
    expires_in: int = Field(description="トークンの有効期間（秒）")


class MessageResponse(BaseModel):
    status: str = "success"
    message: str


class UserResponse(BaseModel):
    status: str = "success"
    user: UserPublic


class UpdateProfileRequest(BaseModel):
    """email と password はここでは変更させない（別フローで扱う）。"""

    name: str | None = Field(default=None, min_length=1, max_length=255)
    organization: str | None = Field(default=None, max_length=255)
    role: str | None = Field(default=None, max_length=255)


class ChangePasswordRequest(BaseModel):
    current_password: str
    password: str
    password_confirmation: str

    @field_validator("password")
    @classmethod
    def _check_password(cls, v: str) -> str:
        return _validate_password_strength(v)

    @model_validator(mode="after")
    def _check(self) -> "ChangePasswordRequest":
        if self.password != self.password_confirmation:
            raise ValueError("新しいパスワードが一致しません")
        if self.password == self.current_password:
            raise ValueError("現在のパスワードと異なるパスワードを設定してください")
        return self
