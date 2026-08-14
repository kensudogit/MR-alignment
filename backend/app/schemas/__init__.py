"""リクエスト/レスポンススキーマ。"""
from app.schemas.ai import GenerateRequest, GenerateResponse
from app.schemas.auth import (
    AuthResponse,
    ChangePasswordRequest,
    LoginRequest,
    MessageResponse,
    RegisterRequest,
    UpdateProfileRequest,
    UserPublic,
    UserResponse,
)
from app.schemas.contact import ContactCreate, ContactCreated, ContactDetail, ContactList
from app.schemas.document import DocumentRequest, DocumentResponse

__all__ = [
    "GenerateRequest",
    "GenerateResponse",
    "AuthResponse",
    "ChangePasswordRequest",
    "LoginRequest",
    "MessageResponse",
    "RegisterRequest",
    "UpdateProfileRequest",
    "UserPublic",
    "UserResponse",
    "ContactCreate",
    "ContactCreated",
    "ContactDetail",
    "ContactList",
    "DocumentRequest",
    "DocumentResponse",
]
