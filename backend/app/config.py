"""アプリケーション設定。

すべての設定は環境変数から読み込む。
秘密情報（OpenAI APIキー、JWT署名鍵、DBパスワード）はここでのみ扱い、
フロントエンドへは絶対に渡さない。
"""
from __future__ import annotations

import secrets
from functools import lru_cache
from typing import Literal

from pydantic import Field, field_validator, model_validator
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
    # 1行1JSONで出す。CloudWatch Logs Insights で絞り込むために必要。
    # 既定は本番のみ。開発中は人が読める形のほうがよい。
    log_json: bool | None = None

    # ------------------------------------------------------------- プロキシ
    # 自分の前段にいる信頼できるプロキシの段数。
    # X-Forwarded-For の右から何個目を「本当のクライアント」とみなすかに使う。
    # 詳細と、先頭を信じてはいけない理由は app/dependencies.py の client_ip に書いた。
    #
    #   0 → X-Forwarded-For を一切信用しない（既定）
    #   1 → ALB や一般的なリバースプロキシが1段
    #   2 → CloudFront → ALB の2段
    #
    # 既定を 0 にしているのは、間違えたときの向きを選んだため。
    #   多すぎる側に間違える（実構成が1段なのに 0）
    #     → 全員が同じ IP に見え、レート制限を全利用者で共有する。
    #        不便だが、外部から破ることはできない。
    #   少なすぎる側に間違える（実構成が2段なのに 1）
    #     → クライアントが書いた値を信じてしまい、
    #        ヘッダを付け替えるだけでレート制限を無制限に回避できる。
    #
    # 後者は攻撃者に主導権を渡す。設定漏れは前者へ倒す。
    # 実際の段数はデプロイ後にアクセスログの client_ip で確認して設定すること
    # （docs/railway-setup.md / infra/README.md に手順あり）。
    trusted_proxy_hops: int = 0

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
    # STARTTLS（平文で接続してから TLS へ切り替える。ポート 587 の方式）
    mail_use_tls: bool = False
    # 最初から TLS で接続する方式（SMTPS。ポート 465 の方式）。
    # JCOM の mailssl.zaq.ne.jp:465 のような ISP のメールサーバーはこちら。
    # 未設定でもポートが 465 なら SMTPS として扱う（`mail_ssl_required` を参照）。
    mail_use_ssl: bool = False
    mail_from_address: str = "noreply@example.com"
    mail_from_name: str = "MR Alignment"
    contact_mail_to: str | None = None
    # Amazon SES の設定セット名。指定すると各メールにヘッダを付け、
    # 開封・バウンス・苦情を SES 側で集計できるようになる。
    # SES 以外（JCOM 等）では未設定のままでよい。
    mail_configuration_set: str | None = None

    # ------------------------------------------------------------- 管理者
    # 面談予約の管理画面（/admin/appointments）を開けるアカウント。
    # カンマ区切りのメールアドレスで指定する。
    #
    # DB に is_admin フラグを持たせなかったのは、最初の管理者を作る手段が
    # 「本番DBへ直接 UPDATE を打つ」しかなくなるため。
    # 環境変数なら Railway の設定画面だけで完結し、権限を外すのも同じ場所でできる。
    # 未設定の場合、管理APIは誰も呼べない（＝安全側に倒す）。
    admin_emails: str = ""

    # ------------------------------------------------------------- 学習データ
    # ファインチューニングに着手してよい最小件数。
    # これを下回る状態で学習しても、文体は安定せず費用だけがかかる。
    finetune_minimum_examples: int = 100

    # ------------------------------------------------------------- Redis
    # レート制限の共有ストア。
    # 未設定だとプロセス内メモリになり、ECS のタスクを増やした瞬間に
    # 実効上限が「タスク数 × ワーカー数 × 設定値」まで緩む。
    # 本番で複数タスクを動かすなら必ず設定すること。
    # 例: redis://mr-alignment.xxxx.ng.0001.apne1.cache.amazonaws.com:6379/0
    redis_url: str | None = None
    redis_timeout: float = 1.0

    # ------------------------------------------------------------- レート制限
    rate_limit_auth: str = "5/minute"
    rate_limit_contact: str = "10/hour"
    # 面談予約は枠を押さえる操作なので、問い合わせより厳しくする。
    # 大量に投げられると空き枠を埋め尽くされる（枠の枯渇）ため。
    rate_limit_appointment: str = "5/hour"
    rate_limit_openai: str = "10/minute"
    # 資料請求は未認証で呼べる（＝OpenAIの課金が発生する）ため、
    # 認証必須の /openai/generate よりも厳しくしておく。
    rate_limit_document: str = "5/hour"

    @property
    def cors_origins(self) -> list[str]:
        return [o.strip() for o in self.frontend_url.split(",") if o.strip()]

    @property
    def admin_email_set(self) -> frozenset[str]:
        """管理者のメールアドレス。比較は小文字で行う。"""
        return frozenset(
            e.strip().lower() for e in self.admin_emails.split(",") if e.strip()
        )

    def is_admin(self, email: str) -> bool:
        """管理者か。

        判定はここ1か所に置く。認可（app/dependencies.py の get_admin_user）と
        画面の出し分けの2か所で別々に書くと、片方だけ直したときに
        「画面には出ないが API は通る」状態になりうる。
        """
        return email.lower() in self.admin_email_set

    @property
    def is_production(self) -> bool:
        return self.app_env == "production"

    @property
    def log_json_effective(self) -> bool:
        """JSON で出すか。明示指定が無ければ本番のみ。"""
        return self.is_production if self.log_json is None else self.log_json

    @property
    def mail_ssl_required(self) -> bool:
        """接続の最初から TLS を張る必要があるか（SMTPS）。

        ポート 465 は仕様上ずっと TLS のため、平文で接続すると
        `smtplib` がサーバーの応答を読めずタイムアウトする。
        MAIL_USE_SSL の設定漏れでメールが飛ばなくなるのを避けるため、
        465 のときは設定に関わらず SMTPS として扱う。
        """
        return self.mail_use_ssl or self.mail_port == 465

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
