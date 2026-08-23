"""FastAPI の依存性。認証ガードとレート制限。"""
from __future__ import annotations

import ipaddress
import logging
from typing import Annotated

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.models import RevokedToken, User
from app.security import TokenError, TokenPayload, decode_access_token

logger = logging.getLogger(__name__)

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


async def get_admin_user(
    user: Annotated[User, Depends(get_current_user)],
) -> User:
    """管理者であることを確認する。

    管理者かどうかは ADMIN_EMAILS（環境変数）で決まる。
    DB のフラグにしなかった理由は app/config.py に記載。

    ADMIN_EMAILS が未設定なら誰も通さない。「設定漏れ＝全員管理者」に
    倒れると、予約者の氏名・電話番号が誰にでも見えてしまう。
    """
    if user.email.lower() not in settings.admin_email_set:
        # 管理APIの存在を推測させないよう、権限不足であることだけを伝える
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="この操作を行う権限がありません",
        )
    return user


def client_ip(request: Request) -> str:
    """クライアント IP を取得する。

    X-Forwarded-For の **先頭** を取ってはいけない。
    先頭は「クライアントが自称した値」で、いくらでも詐称できる。

        攻撃者が `X-Forwarded-For: 1.2.3.4` を付けて送る
          → ALB が実際の接続元を末尾に追加する
          → `X-Forwarded-For: 1.2.3.4, <攻撃者のIP>`

    先頭を信じると、リクエストごとに違う値を名乗るだけで
    IP単位のレート制限を素通りでき、監査用に残す IP も嘘になる。

    信頼できるのは「自分の前段にいるプロキシが書いた分」だけなので、
    右から `trusted_proxy_hops` 個目を採る。
      - ALB が1段だけ                  → 1（既定）
      - CloudFront → ALB の2段構成      → 2
      - プロキシ無し（直接公開）        → 0（ヘッダを一切信用しない）
    """
    hops = settings.trusted_proxy_hops
    socket_ip = request.client.host if request.client else "unknown"

    if hops <= 0:
        return socket_ip

    forwarded = request.headers.get("x-forwarded-for")
    if not forwarded:
        return socket_ip

    parts = [p.strip() for p in forwarded.split(",") if p.strip()]
    if not parts:
        return socket_ip

    # 段数より要素が少ない＝想定と構成が違う。
    # その場合は最も左（＝最も古い）ではなく、確実に信頼できる末尾を採る。
    index = len(parts) - hops
    resolved = parts[index] if 0 <= index < len(parts) else parts[-1]

    _warn_if_not_a_client_address(resolved, forwarded, hops)
    return resolved


# 警告は起動後1回だけ出す。毎リクエスト出しても新しい情報は無く、ログ料金だけが増える
_proxy_hops_warned = False


def _warn_if_not_a_client_address(resolved: str, forwarded: str, hops: int) -> None:
    """段数の設定が実際の構成と合っていないことを検知する。

    合っていないと、全リクエストが同じ内部アドレス（10.x など）に潰れる。
    その状態でも 200 は返るため、気づく手段が無いまま
    「IP 単位のはずのレート制限が、全利用者で1つの枠を奪い合う」ようになる。
    面談予約なら 5/hour が事業所全体で 5 件、という壊れ方をする。

    本物のクライアントのアドレスは必ずインターネットから到達できる。
    そうでない値が出てきたら、TRUSTED_PROXY_HOPS が実構成と違う。
    """
    global _proxy_hops_warned
    if _proxy_hops_warned:
        return

    try:
        if ipaddress.ip_address(resolved).is_global:
            return
    except ValueError:
        # IP として解釈できない値。これも構成が想定と違う兆候
        pass

    _proxy_hops_warned = True
    logger.warning(
        "TRUSTED_PROXY_HOPS=%s ですが、クライアント IP が %r になりました。"
        "インターネット上のアドレスではないため、段数の設定が実際の構成と"
        "合っていない可能性があります（X-Forwarded-For: %r）。"
        "この状態では、レート制限が全利用者で1つの枠を共有します。",
        hops,
        resolved,
        forwarded,
    )


CurrentUser = Annotated[User, Depends(get_current_user)]
AdminUser = Annotated[User, Depends(get_admin_user)]
OptionalUser = Annotated[User | None, Depends(get_optional_user)]
DbSession = Annotated[AsyncSession, Depends(get_db)]
