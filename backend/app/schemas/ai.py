"""AI 資料生成のスキーマ。"""
from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field, field_validator

PROMPT_MAX_LENGTH = 4000

# プロンプトへ流し込んでよいキーのホワイトリスト。
# 任意のキーを通すとプロンプトインジェクションの入口になる。
ALLOWED_USER_INFO_KEYS = frozenset(
    {"name", "organization", "role", "industry", "email", "interest", "budget"}
)


class GenerateRequest(BaseModel):
    """API キーは受け取らない。

    旧実装はクライアントから apiKey を受け取っていたが、
    キーはサーバー側の環境変数でのみ保持する。
    """

    model_config = ConfigDict(populate_by_name=True)

    prompt: str = Field(min_length=1, max_length=PROMPT_MAX_LENGTH)
    user_info: dict[str, str] = Field(default_factory=dict, alias="userInfo")

    @field_validator("user_info")
    @classmethod
    def _filter_keys(cls, value: dict[str, str]) -> dict[str, str]:
        """未知のキーは黙って捨て、値の長さも制限する。"""
        return {
            k: v[:255]
            for k, v in value.items()
            if k in ALLOWED_USER_INFO_KEYS and isinstance(v, str) and v.strip()
        }


class GenerateResponse(BaseModel):
    success: bool = True
    content: str
