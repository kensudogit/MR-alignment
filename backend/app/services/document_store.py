"""AI資料の永続化。

生成のたびに1件保存する。保存に失敗しても資料の送付は止めない
（記録は重要だが、目の前の利用者への価値提供より優先されるものではない）。

DB 操作は contact のようにルーターへ直接書いてもよいが、
「手直し版を積む」「学習に使える件数を数える」など Cypher ならぬ
SQL 以上の判断が入るため、ここへ切り出している。
"""
from __future__ import annotations

import logging

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models import DocumentRevision, DocumentStatus, GeneratedDocument
from app.schemas.document import DocumentRequest
from app.services.document import PROMPT_VERSION, industry_label

logger = logging.getLogger(__name__)


class DocumentStore:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    # ------------------------------------------------------------- 保存
    async def create(
        self,
        payload: DocumentRequest,
        sections: dict[str, str],
        reference: str,
        model: str,
        email_sent: bool,
        ip_address: str | None,
    ) -> GeneratedDocument:
        document = GeneratedDocument(
            reference=reference,
            company_name=payload.company_name,
            # 表示に使う日本語ラベルで保存する。英語コードのままだと
            # 後から集計するたびに変換表が要る。
            industry=industry_label(payload.industry) or None,
            department=payload.department or None,
            role=payload.role or None,
            person_name=payload.full_name,
            email=str(payload.email),
            additional_requirements=payload.additional_requirements or None,
            sections=sections,
            model=model,
            prompt_version=PROMPT_VERSION,
            status=DocumentStatus.GENERATED,
            email_sent=email_sent,
            ip_address=ip_address,
        )
        self.db.add(document)
        await self.db.commit()
        await self.db.refresh(document)
        return document

    # ------------------------------------------------------------- 参照
    async def get_by_reference(self, reference: str) -> GeneratedDocument | None:
        result = await self.db.execute(
            select(GeneratedDocument)
            .where(GeneratedDocument.reference == reference)
            .options(selectinload(GeneratedDocument.revisions))
        )
        return result.scalar_one_or_none()

    async def list(
        self, limit: int, offset: int, status: DocumentStatus | None
    ) -> tuple[int, list[GeneratedDocument]]:
        conditions = []
        if status is not None:
            conditions.append(GeneratedDocument.status == status)

        count_stmt = select(func.count()).select_from(GeneratedDocument)
        list_stmt = (
            select(GeneratedDocument)
            .options(selectinload(GeneratedDocument.revisions))
            .order_by(GeneratedDocument.created_at.desc())
            .limit(limit)
            .offset(offset)
        )
        for condition in conditions:
            count_stmt = count_stmt.where(condition)
            list_stmt = list_stmt.where(condition)

        total = await self.db.scalar(count_stmt) or 0
        result = await self.db.execute(list_stmt)
        return total, list(result.scalars().all())

    # ------------------------------------------------------------- 更新
    async def add_revision(
        self,
        document: GeneratedDocument,
        sections: dict[str, str],
        note: str | None,
        editor_id: int | None,
        mark_reviewed: bool,
    ) -> DocumentRevision:
        """手直しした版を積む。

        送られた節だけを直前の版へ上書きする「部分更新」。
        全置換にすると、1節だけ直したいときに全文を送る必要があり、
        送り忘れた節が黙って消える。

        直前の版と比べて何節に手が入ったかを数えておく。
        全文を比較しなくても修正量が分かり、
        「ほとんど直っていない＝AIの出来が良い」の判断に使える。
        """
        previous = document.latest_sections
        merged = {**previous, **sections}
        changed = sum(
            1 for key, value in sections.items() if previous.get(key) != value
        )

        revision = DocumentRevision(
            document_id=document.id,
            sections=merged,
            editor_id=editor_id,
            note=note,
            changed_section_count=changed,
        )
        self.db.add(revision)

        if mark_reviewed and document.status is DocumentStatus.GENERATED:
            document.status = DocumentStatus.REVIEWED

        await self.db.commit()
        await self.db.refresh(revision)
        return revision

    async def update_status(
        self, document: GeneratedDocument, status: DocumentStatus
    ) -> GeneratedDocument:
        document.status = status
        await self.db.commit()
        await self.db.refresh(document)
        return document

    # ------------------------------------------------------------- 集計
    async def count_trainable(self) -> int:
        """学習に使える件数。

        人の手が入った版があり、かつ確認済み・送付済みのものだけを数える。
        生成したままのものを教師データにすると、AIの出力でAIを学習させる
        ことになるため対象外。
        """
        stmt = (
            select(func.count(func.distinct(GeneratedDocument.id)))
            .select_from(GeneratedDocument)
            .join(DocumentRevision, DocumentRevision.document_id == GeneratedDocument.id)
            .where(
                GeneratedDocument.status.in_(
                    [DocumentStatus.REVIEWED, DocumentStatus.SENT]
                )
            )
        )
        return await self.db.scalar(stmt) or 0
