"""AI資料のメール送付（資料ダウンロードフォーム）のスキーマ。"""
from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

ADDITIONAL_REQUIREMENTS_MAX_LENGTH = 2000


class DocumentRequest(BaseModel):
    """LP の資料ダウンロードフォームの入力。

    プロンプトは受け取らない。
    /openai/generate は任意のプロンプトを受け付けるため認証必須にしているが、
    こちらは未認証の見込み客が使うフォームなので、代わりに
    「フォームの入力欄の値」だけを受け取り、プロンプトはサーバー側で組み立てる。
    こうしておくと、公開エンドポイントを汎用の文章生成APIとして
    悪用されることがない。
    """

    # フロントエンドは camelCase で送ってくるため alias で受ける
    model_config = ConfigDict(populate_by_name=True)

    email: EmailStr = Field(max_length=255)
    company_name: str = Field(min_length=1, max_length=255, alias="companyName")
    last_name: str = Field(min_length=1, max_length=100, alias="lastName")
    first_name: str = Field(min_length=1, max_length=100, alias="firstName")
    industry: str = Field(default="", max_length=100)
    department: str = Field(default="", max_length=255, alias="dept")
    role: str = Field(default="", max_length=255)
    additional_requirements: str = Field(
        default="",
        max_length=ADDITIONAL_REQUIREMENTS_MAX_LENGTH,
        alias="additionalRequirements",
    )

    @field_validator(
        "industry",
        "department",
        "role",
        "additional_requirements",
        mode="before",
    )
    @classmethod
    def _null_to_blank(cls, value: str | None) -> str:
        """未入力欄は FormData から null で届くことがあるため空文字に寄せる。"""
        return "" if value is None else value

    @property
    def full_name(self) -> str:
        return f"{self.last_name} {self.first_name}".strip()


class DocumentResponse(BaseModel):
    status: str = "success"
    message: str
    reference: str = Field(description="お客様提示用の資料番号")
    #  画面表示用。メール本文と同じ内容を返し、表示と送付物を一致させる
    content: dict[str, str]
    email_sent: bool = Field(description="入力されたアドレスへ送信できたか")


# ------------------------------------------------------------------ 記録の閲覧
# 以下は管理用。認証必須で、生成された資料の確認と手直しに使う。


class DocumentSummary(BaseModel):
    """一覧表示用。本文は含めない。"""

    model_config = ConfigDict(from_attributes=True)

    reference: str
    company_name: str
    industry: str | None
    person_name: str
    status: str
    email_sent: bool
    revision_count: int = Field(description="人が手直しした回数")
    model: str
    prompt_version: str
    created_at: datetime


class DocumentListOut(BaseModel):
    total: int
    items: list[DocumentSummary]


class RevisionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    sections: dict[str, str]
    note: str | None
    changed_section_count: int
    created_at: datetime


class DocumentDetail(BaseModel):
    """1件の詳細。生成物と手直し履歴の両方を返す。"""

    reference: str
    company_name: str
    industry: str | None
    department: str | None
    role: str | None
    person_name: str
    additional_requirements: str | None
    status: str
    email_sent: bool
    model: str
    prompt_version: str
    created_at: datetime

    #  AIが生成したそのまま
    generated_sections: dict[str, str]
    #  最新の内容（手直しがあればそちら）
    current_sections: dict[str, str]
    revisions: list[RevisionOut]


class RevisionCreate(BaseModel):
    """人が手直しした版を登録する。

    直した節だけを送れば足りる（部分更新）。送らなかった節は
    直前の内容が引き継がれる。

    節キーは生成物と同じものだけを受け付ける。勝手な節を足せると
    学習データの構造が崩れる。
    """

    sections: dict[str, str] = Field(min_length=1)
    note: str | None = Field(default=None, max_length=1000)
    #  この修正で確認済みとするか
    mark_reviewed: bool = True

    @field_validator("sections")
    @classmethod
    def _non_empty_values(cls, value: dict[str, str]) -> dict[str, str]:
        cleaned = {k: v.strip() for k, v in value.items() if v and v.strip()}
        if not cleaned:
            raise ValueError("本文が空です")
        return cleaned


class DocumentStatusUpdate(BaseModel):
    status: Literal["generated", "reviewed", "sent", "rejected"]
