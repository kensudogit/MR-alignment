"""アプリケーション設定。

すべての設定は環境変数から読み込む。
秘密情報（OpenAI APIキー、JWT署名鍵、DBパスワード）はここでのみ扱い、
フロントエンドへは絶対に渡さない。
"""
from __future__ import annotations

import secrets
from functools import lru_cache
from typing import Literal

from pydantic import Field, PostgresDsn, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    # ------------------------------------------------------------- アプリ
    app_name: str = "MR Alignment API"
    app_env: Literal["local", "test", "staging", "production"] = "local"
    app_debug: bool = False
    api_prefix: str = "/api"
    log_level: str = "INFO"

    # ------------------------------------------------------------- DB
    # 例: postgresql+asyncpg://postgres:password@localhost:5432/mr_alignment
    database_url: str = "postgresql+asyncpg://postgres:password@localhost:5432/mr_alignment"
    db_echo: bool = False
    db_pool_size: int = 5
    db_max_overflow: int = 10
    db_pool_recycle: int = 1800

    # ------------------------------------------------------------- 認証
    # 未設定なら起動ごとにランダム生成する。
    # その場合サーバー再起動で既存トークンが全て無効になるため、
    # 本番では必ず固定値を環境変数で与えること（下の検証で強制している）。
    jwt_secret_key: str = Field(default_factory=lambda: secrets.token_urlsafe(48))
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24  # 24時間

    # ------------------------------------------------------------- CORS
    # カンマ区切りで複数指定可。'*' は使わない（資格情報付きリクエストで動作せず、
    # 全オリジンを許してしまうため）。
    frontend_url: str = "http://localhost:3000"
    cors_allow_origin_regex: str | None = None

    # ------------------------------------------------------------- OpenAI
    openai_api_key: str | None = None
    openai_model: str = "gpt-4o-mini"
    openai_endpoint: str = "https://api.openai.com/v1/chat/completions"
    openai_max_tokens: int = 2000
    openai_temperature: float = 0.7
    openai_timeout: float = 60.0

    # ------------------------------------------------------------- メール
    mail_host: str | None = None
    mail_port: int = 1025
    mail_username: str | None = None
    mail_password: str | None = None
    mail_use_tls: bool = False
    mail_from_address: str = "noreply@example.com"
    mail_from_name: str = "MR Alignment"
    contact_mail_to: str | None = None

    # ------------------------------------------------------------- レート制限
    rate_limit_auth: str = "5/minute"
    rate_limit_contact: str = "10/hour"
    rate_limit_openai: str = "10/minute"

    @property
    def cors_origins(self) -> list[str]:
        return [o.strip() for o in self.frontend_url.split(",") if o.strip()]

    @property
    def is_production(self) -> bool:
        return self.app_env == "production"

    @field_validator("database_url")
    @classmethod
    def _validate_database_url(cls, value: str) -> str:
        """非同期ドライバであることを保証する。

        `postgresql://` のままだと SQLAlchemy が同期ドライバを選び、
        async エンジンの生成時に分かりにくいエラーになる。
        """
        if value.startswith("postgres://"):
            # Railway / Heroku 形式を変換する
            value = value.replace("postgres://", "postgresql+asyncpg://", 1)
        elif value.startswith("postgresql://"):
            value = value.replace("postgresql://", "postgresql+asyncpg://", 1)

        if not (
            value.startswith("postgresql+asyncpg://")
            or value.startswith("sqlite+aiosqlite://")  # テスト用
        ):
            raise ValueError(
                "database_url は postgresql+asyncpg:// である必要があります "
                f"(受け取った値: {value.split('://')[0]}://…)"
            )
        return value

    @model_validator(mode="after")
    def _validate_production(self) -> Settings:
        """本番環境で危険な設定のまま起動しないようにする。"""
        if not self.is_production:
            return self

        errors: list[str] = []

        if self.app_debug:
            errors.append(
                "APP_DEBUG=true のままです。"
                "スタックトレースや設定値が外部へ露出します。"
            )
        if not _env_has("JWT_SECRET_KEY"):
            errors.append(
                "JWT_SECRET_KEY が未設定です。"
                "自動生成された鍵は再起動のたびに変わり、全トークンが無効になります。"
            )
        if "localhost" in self.frontend_url:
            errors.append(
                f"FRONTEND_URL が localhost のままです: {self.frontend_url}"
            )
        if "*" in self.cors_origins:
            errors.append("CORS の許可オリジンに '*' を指定してはいけません。")

        if errors:
            raise ValueError("本番設定エラー:\n- " + "\n- ".join(errors))
        return self


def _env_has(name: str) -> bool:
    import os

    return bool(os.environ.get(name))


@lru_cache
def get_settings() -> Settings:
    """設定はプロセス内で一度だけ読み込む。"""
    return Settings()


settings = get_settings()
