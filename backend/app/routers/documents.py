"""AI資料の生成とメール送付。

LP の「ITサービス資料ダウンロード（無料）」フォームから呼ばれる。

/openai/generate との違い:
  - 未認証で呼べる（見込み客が使うフォームのため）
  - その代わりプロンプトは受け取らず、サーバー側で組み立てる
    （汎用の文章生成APIとして悪用されないようにするため）
  - レート制限を分けて、より厳しくしている
  - 生成結果をそのまま入力されたメールアドレスへ送る
"""
from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Annotated, Literal

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query, Request, status
from fastapi.responses import PlainTextResponse
from sqlalchemy.exc import SQLAlchemyError

from app.config import settings
from app.dependencies import CurrentUser, DbSession, client_ip
from app.models import DocumentStatus
from app.rate_limit import rate_limit
from app.schemas import DocumentRequest, DocumentResponse
from app.schemas.document import (
    DocumentDetail,
    DocumentListOut,
    DocumentStatusUpdate,
    DocumentSummary,
    EvaluationOut,
    ExportSummary,
    RevisionCreate,
    RevisionOut,
    SectionQuality,
)
from app.services.document import (
    build_prompt,
    build_user_info,
    generate_reference,
    parse_proposal,
    section_title,
)
from app.services.document_store import DocumentStore
from app.services.evaluation import evaluate
from app.services.mailer import send_document_mail, send_document_notification
from app.services.openai_client import (
    OpenAIRequestFailed,
    OpenAIUnavailable,
    generate_content,
)
from app.services.training_export import NotEnoughExamples, export

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/documents", tags=["documents"])

GENERIC_ERROR = "AI資料の生成に失敗しました。しばらく時間をおいて再度お試しください。"


async def _notify_safely(payload: DocumentRequest, reference: str) -> None:
    """担当者通知。失敗しても例外を外に出さない。

    バックグラウンドタスクで例外が出ると呼び出し元まで伝播し、
    利用者側では成功しているのにエラー扱いになってしまう。
    """
    try:
        await send_document_notification(payload, reference)
    except Exception:  # noqa: BLE001 - 通知失敗で資料送付を壊さない
        logger.exception("資料請求の担当者通知中に例外 reference=%s", reference)


@router.post(
    "",
    response_model=DocumentResponse,
    dependencies=[Depends(rate_limit(settings.rate_limit_document, "documents:request"))],
)
async def request_document(
    payload: DocumentRequest,
    background_tasks: BackgroundTasks,
    request: Request,
    db: DbSession,
) -> DocumentResponse:
    """AI資料を生成し、入力されたメールアドレスへ送付する。

    資料メールの送信は同期的に行う。送信できたかどうかを画面へ返し、
    「メールが届かない」と利用者が待ち続けることを避けるため。
    担当者への通知は届かなくても利用者に影響しないのでバックグラウンドへ回す。

    生成結果は必ず DB へ残す。後からファインチューニングの教師データを
    作れるのは、ここで記録したものだけ。
    """
    try:
        raw = await generate_content(build_prompt(payload), build_user_info(payload))
    except OpenAIUnavailable:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI資料生成は現在ご利用いただけません。管理者にお問い合わせください。",
        ) from None
    except OpenAIRequestFailed:
        # 詳細は openai_client 側でログ済み。クライアントへは一般的な文言のみ。
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=GENERIC_ERROR,
        ) from None

    sections = parse_proposal(raw)
    reference = generate_reference()
    generated_at = datetime.now(tz=timezone.utc)

    email_sent = await send_document_mail(payload, sections, reference, generated_at)

    # 保存に失敗しても利用者への送付は成立させる。
    # 記録は重要だが、目の前の価値提供を止めてまで優先するものではない。
    try:
        await DocumentStore(db).create(
            payload=payload,
            sections=sections,
            reference=reference,
            model=settings.openai_model,
            email_sent=email_sent,
            ip_address=client_ip(request),
        )
    except SQLAlchemyError:
        logger.exception("AI資料の保存に失敗しました reference=%s", reference)

    background_tasks.add_task(_notify_safely, payload, reference)

    logger.info(
        "AI資料を生成しました reference=%s sections=%s email_sent=%s",
        reference,
        len(sections),
        email_sent,
    )

    message = (
        f"AI資料を {payload.email} 宛にお送りしました。数分経っても届かない場合は"
        "迷惑メールフォルダをご確認ください。"
        if email_sent
        else "AI資料を作成しました。メールの送信に失敗したため、この画面でご確認ください。"
    )

    return DocumentResponse(
        message=message,
        reference=reference,
        content=sections,
        email_sent=email_sent,
    )


# --------------------------------------------------------------------- 管理用
# ここから下はすべて認証必須。生成物の確認と手直しに使う。
#
# 手直しの登録が、この機能群の中心。
# 「AIが生成したもの」と「人が直したもの」の対だけが学習データになる。


def _to_summary(document) -> DocumentSummary:  # noqa: ANN001 - ORM モデル
    return DocumentSummary(
        reference=document.reference,
        company_name=document.company_name,
        industry=document.industry,
        person_name=document.person_name,
        status=document.status.value,
        email_sent=document.email_sent,
        revision_count=len(document.revisions),
        model=document.model,
        prompt_version=document.prompt_version,
        created_at=document.created_at,
    )


@router.get("/records", response_model=DocumentListOut)
async def list_documents(
    _current_user: CurrentUser,
    db: DbSession,
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    status_filter: Annotated[DocumentStatus | None, Query(alias="status")] = None,
) -> DocumentListOut:
    total, documents = await DocumentStore(db).list(limit, offset, status_filter)
    return DocumentListOut(total=total, items=[_to_summary(d) for d in documents])


@router.get("/records/stats")
async def document_stats(_current_user: CurrentUser, db: DbSession) -> dict[str, object]:
    """学習データの貯まり具合。

    ファインチューニングに着手してよいかの判断材料。
    """
    store = DocumentStore(db)
    total, _ = await store.list(limit=1, offset=0, status=None)
    trainable = await store.count_trainable()
    return {
        "total": total,
        "trainable": trainable,
        "minimum_recommended": settings.finetune_minimum_examples,
        "ready": trainable >= settings.finetune_minimum_examples,
    }


@router.get("/records/{reference}", response_model=DocumentDetail)
async def get_document(
    reference: str,
    _current_user: CurrentUser,
    db: DbSession,
) -> DocumentDetail:
    document = await DocumentStore(db).get_by_reference(reference)
    if document is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="指定された資料が見つかりません"
        )

    return DocumentDetail(
        reference=document.reference,
        company_name=document.company_name,
        industry=document.industry,
        department=document.department,
        role=document.role,
        person_name=document.person_name,
        additional_requirements=document.additional_requirements,
        status=document.status.value,
        email_sent=document.email_sent,
        model=document.model,
        prompt_version=document.prompt_version,
        created_at=document.created_at,
        generated_sections=document.sections,
        current_sections=document.latest_sections,
        revisions=[RevisionOut.model_validate(r) for r in document.revisions],
    )


@router.post(
    "/records/{reference}/revisions",
    response_model=RevisionOut,
    status_code=status.HTTP_201_CREATED,
)
async def create_revision(
    reference: str,
    payload: RevisionCreate,
    current_user: CurrentUser,
    db: DbSession,
) -> RevisionOut:
    """人が手直しした版を登録する。

    ここに溜まったものだけが、後のファインチューニングの正解データになる。
    """
    store = DocumentStore(db)
    document = await store.get_by_reference(reference)
    if document is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="指定された資料が見つかりません"
        )

    # 生成物に無い節を足せると学習データの構造が崩れる
    unknown = set(payload.sections) - set(document.sections)
    if unknown:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=(
                "生成物に存在しない節が含まれています: "
                + ", ".join(sorted(section_title(k) for k in unknown))
            ),
        )

    revision = await store.add_revision(
        document=document,
        sections=payload.sections,
        note=payload.note,
        editor_id=current_user.id,
        mark_reviewed=payload.mark_reviewed,
    )
    logger.info(
        "資料の手直しを登録しました reference=%s changed=%s",
        reference,
        revision.changed_section_count,
    )
    return RevisionOut.model_validate(revision)


@router.get("/training/evaluation", response_model=EvaluationOut)
async def training_evaluation(
    _current_user: CurrentUser,
    db: DbSession,
    limit: int = Query(default=500, ge=1, le=2000),
) -> EvaluationOut:
    """人がどれだけ直したかを測る。

    ファインチューニングをやるべきかの判断材料であり、
    やった後に効果があったかの判定にも同じ指標を使う。
    """
    _total, documents = await DocumentStore(db).list(limit=limit, offset=0, status=None)
    result = evaluate(documents)

    return EvaluationOut(
        documents=result.documents,
        untouched_rate=result.untouched_rate,
        mean_similarity=result.mean_similarity,
        sections=[
            SectionQuality(
                key=s.key,
                title=s.title,
                documents=s.documents,
                edited=s.edited,
                edit_rate=s.edit_rate,
                mean_similarity=s.mean_similarity,
            )
            for s in result.sections
        ],
        worst_sections=[s.title for s in result.worst_sections()],
    )


@router.get("/training/summary", response_model=ExportSummary)
async def training_summary(
    _current_user: CurrentUser,
    db: DbSession,
) -> ExportSummary:
    """書き出せる件数の確認。実際に流す前の下見に使う。"""
    store = DocumentStore(db)
    _total, documents = await store.list(limit=2000, offset=0, status=None)

    try:
        result = export(documents, allow_below_threshold=True)
    except NotEnoughExamples:  # pragma: no cover - allow_below_threshold で来ない
        result = None

    trainable = await store.count_trainable()
    return ExportSummary(
        trainable=trainable,
        minimum_required=settings.finetune_minimum_examples,
        train=len(result.train) if result else 0,
        validation=len(result.validation) if result else 0,
        ready=trainable >= settings.finetune_minimum_examples,
    )


@router.get("/training/export")
async def training_export(
    _current_user: CurrentUser,
    db: DbSession,
    split: Literal["train", "validation"] = Query(default="train"),
    validation_ratio: float = Query(default=0.2, ge=0.0, le=0.5),
    force: bool = Query(
        default=False,
        description="件数が閾値未満でも書き出す（文体は安定しません）",
    ),
) -> PlainTextResponse:
    """OpenAI のファインチューニング形式（JSONL）で書き出す。

    system / user は生成時とまったく同じ組み立てを通している。
    ここがずれると、学習したプロンプトと本番のプロンプトが食い違い、
    学習しても効果が出ない。
    """
    _total, documents = await DocumentStore(db).list(limit=2000, offset=0, status=None)

    try:
        result = export(
            documents,
            validation_ratio=validation_ratio,
            allow_below_threshold=force,
        )
    except NotEnoughExamples as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                f"学習データが不足しています（{exc.available} / {exc.required} 件）。"
                "この状態で学習しても文体は安定せず、費用と時間だけがかかります。"
                "どうしても試す場合は force=true を付けてください。"
            ),
        ) from None

    records = result.train if split == "train" else result.validation
    filename = f"finetune-{split}.jsonl"
    return PlainTextResponse(
        content=result.to_jsonl(records),
        media_type="application/jsonl",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.patch("/records/{reference}/status", response_model=DocumentSummary)
async def update_document_status(
    reference: str,
    payload: DocumentStatusUpdate,
    _current_user: CurrentUser,
    db: DbSession,
) -> DocumentSummary:
    store = DocumentStore(db)
    document = await store.get_by_reference(reference)
    if document is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="指定された資料が見つかりません"
        )

    updated = await store.update_status(document, DocumentStatus(payload.status))
    return _to_summary(updated)
