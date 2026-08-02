"""認証エンドポイント。"""
from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError

from app.config import settings
from app.dependencies import CurrentUser, DbSession, client_ip, get_token_payload
from app.models import RevokedToken, User
from app.rate_limit import rate_limit
from app.schemas import (
    AuthResponse,
    ChangePasswordRequest,
    LoginRequest,
    MessageResponse,
    RegisterRequest,
    UpdateProfileRequest,
    UserPublic,
    UserResponse,
)
from app.security import TokenPayload, create_access_token, hash_password, verify_password

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["auth"])

# 認証失敗時は常に同じメッセージを返す。
# 「メールアドレスが存在しない」と「パスワードが違う」を区別できると、
# 登録済みアドレスを総当たりで特定されてしまう。
INVALID_CREDENTIALS = "メールアドレスまたはパスワードが正しくありません"


def _issue_token(user: User) -> tuple[str, int]:
    token, _jti, expires_at = create_access_token(user.id, user.token_version)
    expires_in = int((expires_at - datetime.now(tz=timezone.utc)).total_seconds())
    return token, expires_in


@router.post(
    "/register",
    response_model=AuthResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(rate_limit(settings.rate_limit_auth, "auth:register"))],
)
async def register(payload: RegisterRequest, db: DbSession) -> AuthResponse:
    existing = await db.scalar(select(User.id).where(User.email == payload.email))
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="このメールアドレスは既に登録されています",
        )

    user = User(
        name=payload.name,
        email=payload.email,
        hashed_password=hash_password(payload.password),
        organization=payload.organization,
        role=payload.role,
    )
    db.add(user)

    try:
        await db.commit()
    except IntegrityError:
        # ユニーク制約違反（同時登録の競合）
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="このメールアドレスは既に登録されています",
        ) from None

    await db.refresh(user)
    token, expires_in = _issue_token(user)

    logger.info("ユーザー登録 user_id=%s", user.id)

    return AuthResponse(
        message="ユーザー登録が完了しました",
        user=UserPublic.model_validate(user),
        token=token,
        expires_in=expires_in,
    )


@router.post(
    "/login",
    response_model=AuthResponse,
    dependencies=[Depends(rate_limit(settings.rate_limit_auth, "auth:login"))],
)
async def login(payload: LoginRequest, request: Request, db: DbSession) -> AuthResponse:
    user = await db.scalar(select(User).where(User.email == payload.email))

    if user is None or not verify_password(payload.password, user.hashed_password):
        logger.warning("ログイン失敗 email=%s ip=%s", payload.email, client_ip(request))
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=INVALID_CREDENTIALS,
        )

    if not user.is_active:
        # 無効化されたアカウントであることも伏せる
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=INVALID_CREDENTIALS,
        )

    user.last_login_at = datetime.now(tz=timezone.utc)
    await db.commit()
    await db.refresh(user)

    token, expires_in = _issue_token(user)

    return AuthResponse(
        message="ログインに成功しました",
        user=UserPublic.model_validate(user),
        token=token,
        expires_in=expires_in,
    )


@router.post("/logout", response_model=MessageResponse)
async def logout(
    payload: Annotated[TokenPayload, Depends(get_token_payload)],
    current_user: CurrentUser,
    db: DbSession,
) -> MessageResponse:
    """このリクエストで使われたトークンのみを失効させる。

    JWT はステートレスなため、失効リスト（revoked_tokens）に jti を記録する。
    """
    db.add(
        RevokedToken(
            jti=payload.jti,
            user_id=current_user.id,
            expires_at=payload.expires_at,
        )
    )
    try:
        await db.commit()
    except IntegrityError:
        # 既に失効済み（二重ログアウト）。成功として扱う。
        await db.rollback()

    return MessageResponse(message="ログアウトしました")


@router.get("/me", response_model=UserResponse)
async def me(current_user: CurrentUser) -> UserResponse:
    return UserResponse(user=UserPublic.model_validate(current_user))


@router.put("/profile", response_model=UserResponse)
async def update_profile(
    payload: UpdateProfileRequest,
    current_user: CurrentUser,
    db: DbSession,
) -> UserResponse:
    """email と password はここでは変更できない（意図的な制限）。"""
    updates = payload.model_dump(exclude_unset=True)

    for field, value in updates.items():
        setattr(current_user, field, value)

    await db.commit()
    await db.refresh(current_user)

    return UserResponse(user=UserPublic.model_validate(current_user))


@router.post(
    "/change-password",
    response_model=MessageResponse,
    dependencies=[Depends(rate_limit(settings.rate_limit_auth, "auth:change-password"))],
)
async def change_password(
    payload: ChangePasswordRequest,
    current_user: CurrentUser,
    db: DbSession,
) -> MessageResponse:
    if not verify_password(payload.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="現在のパスワードが正しくありません",
        )

    current_user.hashed_password = hash_password(payload.password)
    # token_version を進めることで、発行済みトークンをすべて無効化する。
    # 他端末に残ったセッションを確実に切るため。
    current_user.token_version += 1
    await db.commit()

    logger.info("パスワード変更 user_id=%s", current_user.id)

    return MessageResponse(
        message="パスワードを変更しました。再度ログインしてください。"
    )
