"""生成品質の評価。

「人がどれだけ直したか」を測る。直しが少ないほどAIの出来が良い。

ファインチューニングをやるべきかの判断材料であり、
やった後に効果があったかの判定にも同じ指標を使う。

外部ライブラリは使わない。difflib は標準ライブラリで、
文字レベルの類似度を出すには十分。埋め込みベースの意味的類似度は
モデル呼び出しの費用がかかるうえ、ここで見たいのは
「どれだけ手が入ったか」なので文字ベースで足りる。
"""
from __future__ import annotations

from dataclasses import dataclass, field
from difflib import SequenceMatcher

from app.models import GeneratedDocument
from app.services.document import SECTION_TITLES, section_title


def similarity(a: str, b: str) -> float:
    """0〜1。1 なら手が入っていない。"""
    if not a and not b:
        return 1.0
    if not a or not b:
        return 0.0
    return SequenceMatcher(None, a, b).ratio()


@dataclass
class SectionStat:
    key: str
    title: str
    #  その節が存在した資料の数
    documents: int = 0
    #  手が入った資料の数
    edited: int = 0
    _ratios: list[float] = field(default_factory=list)

    @property
    def edit_rate(self) -> float:
        return round(self.edited / self.documents, 3) if self.documents else 0.0

    @property
    def mean_similarity(self) -> float:
        return round(sum(self._ratios) / len(self._ratios), 3) if self._ratios else 0.0


@dataclass
class Evaluation:
    documents: int
    #  一度も手が入らなかった資料の割合
    untouched_rate: float
    mean_similarity: float
    sections: list[SectionStat]

    def worst_sections(self, count: int = 3) -> list[SectionStat]:
        """最も手が入っている節。改善の優先順位に使う。"""
        ranked = sorted(
            (s for s in self.sections if s.documents),
            key=lambda s: (-s.edit_rate, s.mean_similarity),
        )
        return ranked[:count]


def evaluate(documents: list[GeneratedDocument]) -> Evaluation:
    """生成物と、人が手直しした最新版を突き合わせる。

    手直しの無い資料は「直す必要が無かった」とみなして
    類似度 1.0 として数える。除外すると、出来の良い資料ほど
    評価から抜け落ち、実態より悪い数字になる。
    """
    stats = {
        key: SectionStat(key=key, title=section_title(key)) for key in SECTION_TITLES
    }

    doc_ratios: list[float] = []
    untouched = 0

    for document in documents:
        generated = document.sections or {}
        latest = document.latest_sections or {}

        if not document.revisions:
            untouched += 1

        per_doc: list[float] = []
        for key, original in generated.items():
            stat = stats.setdefault(key, SectionStat(key=key, title=section_title(key)))
            revised = latest.get(key, "")
            ratio = similarity(original, revised)

            stat.documents += 1
            stat._ratios.append(ratio)
            if ratio < 1.0:
                stat.edited += 1
            per_doc.append(ratio)

        if per_doc:
            doc_ratios.append(sum(per_doc) / len(per_doc))

    total = len(documents)
    return Evaluation(
        documents=total,
        untouched_rate=round(untouched / total, 3) if total else 0.0,
        mean_similarity=(
            round(sum(doc_ratios) / len(doc_ratios), 3) if doc_ratios else 0.0
        ),
        sections=[stats[key] for key in stats],
    )
