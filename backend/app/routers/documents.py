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

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status

from app.config import settings
from app.rate_limit import rate_limit
from app.schemas import DocumentRequest, DocumentResponse
from app.services.document import (
    build_prompt,
    build_user_info,
    generate_reference,
    parse_proposal,
)
from app.services.mailer import send_document_mail, send_document_notification
from app.services.openai_client import (
    OpenAIRequestFailed,
    OpenAIUnavailable,
    generate_content,
)

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
) -> DocumentResponse:
    """AI資料を生成し、入力されたメールアドレスへ送付する。

    資料メールの送信は同期的に行う。送信できたかどうかを画面へ返し、
    「メールが届かない」と利用者が待ち続けることを避けるため。
    担当者への通知は届かなくても利用者に影響しないのでバックグラウンドへ回す。
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
