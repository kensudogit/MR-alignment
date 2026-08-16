"""ファインチューニング用データの書き出し。

教師データにしてよいのは「AIが生成し、人が手直しし、確認済みになったもの」
だけ。生成したままのものを混ぜると、AIの出力でAIを学習させることになり、
癖がそのまま増幅される。

出力は OpenAI のファインチューニング形式（1行1JSON）。

  {"messages": [
    {"role": "system",    "content": "…"},
    {"role": "user",      "content": "…"},
    {"role": "assistant", "content": "…"}
  ]}

**system / user は生成時とまったく同じ組み立てを通す。**
別々に組み立てると「学習したプロンプトと本番のプロンプトが違う」状態になり、
学習しても効果が出ない。そのため document.build_prompt /
openai_client.build_user_message をそのまま再利用している。
"""
from __future__ import annotations

import json
import logging
from dataclasses import dataclass

from app.config import settings
from app.models import GeneratedDocument
from app.services.document import (
    SECTION_TITLES,
    build_prompt,
    build_user_info,
    industry_label,
)
from app.services.openai_client import SYSTEM_PROMPT, build_user_message

logger = logging.getLogger(__name__)


class NotEnoughExamples(Exception):
    """学習に足る件数が貯まっていない。"""

    def __init__(self, available: int, required: int) -> None:
        self.available = available
        self.required = required
        super().__init__(f"学習データが不足しています（{available} / {required} 件）")


@dataclass(frozen=True)
class StoredPromptSource:
    """保存済みレコードから、プロンプト組み立てに必要な項目だけを取り出す。

    DocumentRequest と同じ形にして、生成時と同一の関数へ流す。
    """

    company_name: str
    industry: str
    department: str
    role: str
    additional_requirements: str
    _full_name: str

    @property
    def full_name(self) -> str:
        return self._full_name

    @classmethod
    def from_document(cls, document: GeneratedDocument) -> "StoredPromptSource":
        return cls(
            company_name=document.company_name,
            # 保存時に日本語ラベルへ変換済み。industry_label は未知の値を
            # そのまま返すため、二重変換にはならない。
            industry=industry_label(document.industry or ""),
            department=document.department or "",
            role=document.role or "",
            additional_requirements=document.additional_requirements or "",
            _full_name=document.person_name,
        )


def is_trainable(document: GeneratedDocument) -> bool:
    """教師データに使ってよいか。

    人の手が入っていること、かつ確認済み・送付済みであること。
    却下されたものは、内容が悪かったという判断なので当然除く。
    """
    from app.models import DocumentStatus

    return bool(document.revisions) and document.status in (
        DocumentStatus.REVIEWED,
        DocumentStatus.SENT,
    )


def build_example(document: GeneratedDocument) -> dict[str, object]:
    """1件分の学習例を組み立てる。

    assistant の内容は「人が手直しした後の最新版」。
    AIが生成したそのままではない点が肝心で、
    そこが人の判断を学ばせる唯一の情報源になる。
    """
    source = StoredPromptSource.from_document(document)

    return {
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {
                "role": "user",
                "content": build_user_message(
                    build_prompt(source), build_user_info(source)
                ),
            },
            {
                "role": "assistant",
                # 生成時に JSON を要求しているので、正解も同じ形で与える
                "content": json.dumps(document.latest_sections, ensure_ascii=False),
            },
        ]
    }


@dataclass
class ExportResult:
    total: int
    train: list[dict[str, object]]
    validation: list[dict[str, object]]

    def to_jsonl(self, records: list[dict[str, object]]) -> str:
        return "\n".join(json.dumps(r, ensure_ascii=False) for r in records)


def export(
    documents: list[GeneratedDocument],
    validation_ratio: float = 0.2,
    allow_below_threshold: bool = False,
) -> ExportResult:
    """学習データを書き出す。

    件数が閾値に届かない場合は既定で拒否する。
    足りないまま学習しても文体は安定せず、費用と時間だけがかかる。
    それでも試したい場合のために allow_below_threshold を残している。
    """
    trainable = [d for d in documents if is_trainable(d)]
    required = settings.finetune_minimum_examples

    if len(trainable) < required and not allow_below_threshold:
        raise NotEnoughExamples(available=len(trainable), required=required)

    examples = [build_example(d) for d in trainable]

    # 検証用は末尾から取る。created_at 降順で渡される前提のため、
    # 結果的に「古いものが検証」になり、時間で分けたことになる。
    split = max(1, int(len(examples) * (1 - validation_ratio))) if examples else 0
    train = examples[:split]
    validation = examples[split:]

    logger.info(
        "学習データを書き出しました total=%s train=%s validation=%s",
        len(examples),
        len(train),
        len(validation),
    )
    return ExportResult(total=len(examples), train=train, validation=validation)


def section_keys() -> list[str]:
    """節キーの定義順。評価の並び順に使う。"""
    return list(SECTION_TITLES)
