"""AI資料のメール送付（資料ダウンロードフォーム）のスキーマ。"""
from __future__ import annotations

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
