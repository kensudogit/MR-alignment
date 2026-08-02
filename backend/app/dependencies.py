"""FastAPI の依存性。認証ガードとレート制限。"""
from __future__ import annotations

from typing import Annotated

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import RevokedToken, User
from app.security import TokenError, TokenPayload, decode_access_token

# auto_error=False にして、認証エラーの形式を自前で統一する
bearer_scheme = HTTPBearer(auto_error=False)

CREDENTIALS_EXCEPTION = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="認証が必要です",
    headers={"WWW-Authenticate": "Bearer"},
)


async def get_token_payload(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
) -> TokenPayload:
    if credentials is None or not credentials.credentials:
        raise CREDENTIALS_EXCEPTION
    try:
        return decode_access_token(credentials.credentials)
    except TokenError as exc:
        raise CREDENTIALS_EXCEPTION from exc


async def get_current_user(
    payload: Annotated[TokenPayload, Depends(get_token_payload)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> User:
    """トークンから現在のユーザーを解決する。

    署名検証だけでは不十分で、以下も確認する。
      - jti が失効リストに載っていないか（個別ログアウト）
      - token_version が一致するか（パスワード変更による一括失効）
      - アカウントが有効か
    """
    revoked = await db.scalar(select(RevokedToken.id).where(RevokedToken.jti == payload.jti))
    if revoked is not None:
        raise CREDENTIALS_EXCEPTION

    user = await db.get(User, payload.user_id)
    if user is None or not user.is_active:
        raise CREDENTIALS_EXCEPTION

    if user.token_version != payload.token_version:
        # パスワード変更後の古いトークン
        raise CREDENTIALS_EXCEPTION

    return user


async def get_optional_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> User | None:
    """認証は任意。お問い合わせのように未ログインでも使える機能で用いる。"""
    if credentials is None or not credentials.credentials:
        return None
    try:
        payload = decode_access_token(credentials.credentials)
    except TokenError:
        return None

    revoked = await db.scalar(select(RevokedToken.id).where(RevokedToken.jti == payload.jti))
    if revoked is not None:
        return None

    user = await db.get(User, payload.user_id)
    if user is None or not user.is_active or user.token_version != payload.token_version:
        return None
    return user


def client_ip(request: Request) -> str:
    """クライアント IP を取得する。

    Railway / Vercel などのリバースプロキシ配下では X-Forwarded-For を見る必要がある。
    先頭の値が元のクライアント。
    """
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


CurrentUser = Annotated[User, Depends(get_current_user)]
OptionalUser = Annotated[User | None, Depends(get_optional_user)]
DbSession = Annotated[AsyncSession, Depends(get_db)]
