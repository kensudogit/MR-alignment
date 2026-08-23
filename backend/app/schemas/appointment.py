"""面談予約のスキーマ。"""
from __future__ import annotations

from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

from app.models.appointment import AppointmentStatus
from app.services.appointment import (
    CONSULTATION_TYPES,
    MAX_LEAD_DAYS,
    TIME_SLOTS,
    is_business_day,
    today_jst,
)

MESSAGE_MAX_LENGTH = 2000


class AppointmentCreate(BaseModel):
    """予約フォームの入力。

    フロントエンドは camelCase で送ってくるため alias で受ける。
    選択肢（相談区分・時間帯）は必ずサーバー側で検証する。
    画面の <select> だけを頼りにすると、直接 API を叩かれたときに
    存在しない枠の予約が入り、空き枠の計算が狂う。
    """

    model_config = ConfigDict(populate_by_name=True)

    name: str = Field(min_length=1, max_length=255)
    email: EmailStr = Field(max_length=255)
    phone: str = Field(min_length=1, max_length=50)
    company: str = Field(min_length=1, max_length=255)
    department: str | None = Field(default=None, max_length=255)
    position: str | None = Field(default=None, max_length=255)

    consultation_type: str = Field(alias="consultationType", max_length=50)
    preferred_date: date = Field(alias="preferredDate")
    preferred_slot: str = Field(alias="preferredTime", max_length=20)
    message: str | None = Field(default=None, max_length=MESSAGE_MAX_LENGTH)

    @field_validator("department", "position", "message", mode="before")
    @classmethod
    def _empty_to_none(cls, value: object) -> object:
        """空文字は「未入力」として扱う。フォームは空欄を '' で送ってくる。"""
        if isinstance(value, str) and value.strip() == "":
            return None
        return value

    @field_validator("consultation_type")
    @classmethod
    def _known_consultation_type(cls, value: str) -> str:
        if value not in CONSULTATION_TYPES:
            raise ValueError("相談内容の選択値が不正です")
        return value

    @field_validator("preferred_slot")
    @classmethod
    def _known_slot(cls, value: str) -> str:
        if value not in TIME_SLOTS:
            raise ValueError("希望時間の選択値が不正です")
        return value

    @field_validator("preferred_date")
    @classmethod
    def _bookable_date(cls, value: date) -> date:
        today = today_jst()
        if value < today:
            raise ValueError("過去の日付は指定できません")
        if (value - today).days > MAX_LEAD_DAYS:
            raise ValueError(f"ご予約は{MAX_LEAD_DAYS}日先までとさせていただいています")
        if not is_business_day(value):
            raise ValueError("土日は受け付けておりません。平日をお選びください")
        return value


class AppointmentCreated(BaseModel):
    status: str = "success"
    message: str
    reference: str = Field(description="お客様提示用の受付番号")
    preferred_date: date
    preferred_slot: str
    appointment_status: AppointmentStatus
    submitted_at: datetime


class SlotAvailability(BaseModel):
    slot: str
    available: bool


class AvailabilityOut(BaseModel):
    """指定日の空き枠。

    フォームで日付を選んだ時点で埋まっている枠を落とすために使う。
    ここで空きに見えても、送信時にもう一度サーバー側で確認する
    （表示から送信までの間に他の人が押さえることがあるため）。
    """

    status: str = "success"
    date: date
    bookable: bool = Field(description="その日自体が受付可能か（平日・期間内か）")
    reason: str | None = Field(default=None, description="受付できない場合の理由")
    slots: list[SlotAvailability]


class AppointmentSummary(BaseModel):
    """管理一覧の1行。"""

    model_config = ConfigDict(from_attributes=True)

    reference: str
    name: str
    email: EmailStr
    company: str
    consultation_type: str
    # 表示名はモデル側のプロパティから取る（画面とメールで表記を揃えるため）
    consultation_label: str
    preferred_date: date
    preferred_slot: str
    status: AppointmentStatus
    ack_sent: bool
    staff_notified: bool
    # 確定・取消を申込者へ知らせた日時。NULL なら知らせていない。
    # 一覧に出すのは「確定にしたのに連絡が行っていない予約」を見つけるため
    status_notice_sent_at: datetime | None
    created_at: datetime


class AppointmentDetail(AppointmentSummary):
    """管理画面の詳細。申込者が入力した内容をすべて含む。"""

    phone: str
    department: str | None
    position: str | None
    message: str | None
    staff_note: str | None
    confirmed_at: datetime | None
    user_id: int | None


class AppointmentList(BaseModel):
    status: str = "success"
    total: int
    items: list[AppointmentSummary]


class AppointmentUpdate(BaseModel):
    """担当者による更新。状態とメモだけを変更できる。

    申込者が入力した内容（氏名・希望日時など）は書き換えない。
    日時を変えたい場合は、申込者との合意のうえで
    キャンセル＋再登録にする（履歴が残るため）。
    """

    status: AppointmentStatus | None = None
    staff_note: str | None = Field(default=None, max_length=2000)

    # 確定・取消を申込者へメールで知らせるか。
    # 既定を True にしているのは、「確定したのに連絡が行かない」ほうが
    # 「二重に連絡が行く」より損害が大きいため。
    # 電話などで既に伝えてある場合は False にする。
    notify: bool = Field(
        default=True,
        description="確定・取消を申込者へメールで知らせる（未確定・実施済みへの変更では送らない）",
    )
