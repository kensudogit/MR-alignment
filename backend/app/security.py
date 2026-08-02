"""パスワードハッシュと JWT の発行・検証。

方針:
  - パスワードは bcrypt でハッシュ化する。平文は保存も記録もしない。
  - 認証は JWT（Bearer）。Cookie を使わないため、
    Microsoft Edge のサードパーティ Cookie 制限の影響を受けない。
  - トークンには jti（一意ID）と ver（token_version）を含める。
      * 個別ログアウト   -> jti を revoked_tokens に記録
      * パスワード変更   -> users.token_version をインクリメントし一括無効化
"""
from __future__ import annotations

import secrets
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.config import settings

# bcrypt は入力が 72 バイトを超えると黙って切り捨てる実装があるため、
# 呼び出し側で長さを制限する（下の hash_password / verify_password）。
BCRYPT_MAX_BYTES = 72

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class TokenError(Exception):
    """トークンが不正・失効している。"""


@dataclass(frozen=True)
class TokenPayload:
    """検証済みトークンの中身。"""

    user_id: int
    jti: str
    token_version: int
    expires_at: datetime


def _truncate(password: str) -> bytes:
    """bcrypt の 72 バイト制限に合わせて切り詰める。

    切り詰めを passlib 任せにすると、環境によって例外になったり
    黙って切られたりして挙動が揺れるため、明示的に行う。
    """
    encoded = password.encode("utf-8")
    if len(encoded) <= BCRYPT_MAX_BYTES:
        return encoded
    # マルチバイト文字の途中で切らないように調整する
    truncated = encoded[:BCRYPT_MAX_BYTES]
    while truncated:
        try:
            truncated.decode("utf-8")
            break
        except UnicodeDecodeError:
            truncated = truncated[:-1]
    return truncated


def hash_password(password: str) -> str:
    return pwd_context.hash(_truncate(password))


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return pwd_context.verify(_truncate(plain_password), hashed_password)
    except ValueError:
        # ハッシュ形式が壊れている場合も「不一致」として扱う
        return False


def create_access_token(
    user_id: int,
    token_version: int,
    expires_delta: timedelta | None = None,
) -> tuple[str, str, datetime]:
    """アクセストークンを発行する。

    Returns:
        (トークン文字列, jti, 有効期限)
    """
    now = datetime.now(tz=timezone.utc)
    expire = now + (expires_delta or timedelta(minutes=settings.access_token_expire_minutes))
    jti = secrets.token_urlsafe(24)

    payload = {
        "sub": str(user_id),
        "jti": jti,
        "ver": token_version,
        "iat": int(now.timestamp()),
        "exp": int(expire.timestamp()),
        "type": "access",
    }
    token = jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)
    return token, jti, expire


def decode_access_token(token: str) -> TokenPayload:
    """トークンを検証してペイロードを返す。

    署名・有効期限・型を検証する。失効チェック（jti / token_version）は
    DB 参照が必要なため dependencies 側で行う。
    """
    try:
        raw = jwt.decode(
            token,
            settings.jwt_secret_key,
            algorithms=[settings.jwt_algorithm],
        )
    except JWTError as exc:
        raise TokenError("トークンが不正または期限切れです") from exc

    if raw.get("type") != "access":
        raise TokenError("アクセストークンではありません")

    subject = raw.get("sub")
    jti = raw.get("jti")
    exp = raw.get("exp")

    if subject is None or jti is None or exp is None:
        raise TokenError("トークンに必要な項目がありません")

    try:
        user_id = int(subject)
    except (TypeError, ValueError) as exc:
        raise TokenError("トークンの sub が不正です") from exc

    return TokenPayload(
        user_id=user_id,
        jti=str(jti),
        token_version=int(raw.get("ver", 0)),
        expires_at=datetime.fromtimestamp(int(exp), tz=timezone.utc),
    )
