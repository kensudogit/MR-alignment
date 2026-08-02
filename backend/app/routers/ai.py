"""AI 資料生成エンドポイント。"""
from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, HTTPException, status

from app.config import settings
from app.dependencies import CurrentUser
from app.rate_limit import rate_limit
from app.schemas import GenerateRequest, GenerateResponse
from app.services.openai_client import (
    OpenAIRequestFailed,
    OpenAIUnavailable,
    generate_content,
)

logger = logging.getLogger(__name__)

# 旧実装は /api/openai/generate だったため、パスは互換を保つ
router = APIRouter(prefix="/openai", tags=["ai"])

GENERIC_ERROR = "AI資料の生成に失敗しました。しばらく時間をおいて再度お試しください。"


@router.post(
    "/generate",
    response_model=GenerateResponse,
    dependencies=[Depends(rate_limit(settings.rate_limit_openai, "openai:generate"))],
)
async def generate(payload: GenerateRequest, current_user: CurrentUser) -> GenerateResponse:
    """認証必須。

    未認証で呼べると、誰でも OpenAI の課金を発生させられる。
    レート制限と併せて二重に保護している。
    """
    try:
        content = await generate_content(payload.prompt, payload.user_info)
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

    logger.info(
        "AI資料を生成しました user_id=%s prompt_length=%s",
        current_user.id,
        len(payload.prompt),
    )

    return GenerateResponse(content=content)
