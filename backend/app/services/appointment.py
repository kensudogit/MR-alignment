"""面談予約の定義（時間帯・相談区分・営業日）。

予約枠と相談区分は「画面とメールとDBで同じもの」でなければならない。
以前は選択肢がフロントエンドの <select> にだけ存在し、
送信された値の妥当性を誰も検証していなかった。
ここを唯一の定義とし、API のバリデーション・空き枠の算出・
メール本文の表示名をすべてこの表から引く。
"""
from __future__ import annotations

from datetime import date, datetime, timedelta, timezone

# 受付時間（平日 9:00〜18:00）を1時間単位に割ったもの。
# 12:00-13:00 は昼休みのため枠を置かない。
TIME_SLOTS: tuple[str, ...] = (
    "09:00-10:00",
    "10:00-11:00",
    "11:00-12:00",
    "13:00-14:00",
    "14:00-15:00",
    "15:00-16:00",
    "16:00-17:00",
    "17:00-18:00",
)

# 相談区分。キーを DB に保存し、表示にはラベルを使う。
# キーで持つのは、ラベルを直したときに過去の予約の分類が壊れないようにするため。
CONSULTATION_TYPES: dict[str, str] = {
    "system-development": "システム開発",
    "digital-transformation": "デジタル変革",
    "cloud-migration": "クラウド移行",
    "security": "セキュリティ対策",
    "data-analysis": "データ分析",
    "it-strategy": "IT戦略",
    "other": "その他",
}

# 予約は日本時間で運用する。
# UTC の「今日」は日本時間より最大9時間遅れるため、
# 当日の朝に当日枠を申し込むと「過去日」と判定されうる。
JST = timezone(timedelta(hours=9))

# これ以上先の日付は受け付けない。
# 半年先の枠を押さえられても予定が変わるだけで、枠が死ぬ。
MAX_LEAD_DAYS = 90


def today_jst() -> date:
    """日本時間での今日。"""
    return datetime.now(tz=JST).date()


def consultation_label(key: str | None) -> str:
    """相談区分の表示名。未知のキーはそのまま返す（過去データを消さない）。"""
    if not key:
        return "指定なし"
    return CONSULTATION_TYPES.get(key, key)


def is_business_day(value: date) -> bool:
    """営業日か。

    土日のみを判定する。祝日は判定しない（祝日カレンダーを持っていないため）。
    祝日に申し込まれた場合は、担当者が確定の連絡時に調整する。
    """
    return value.weekday() < 5
