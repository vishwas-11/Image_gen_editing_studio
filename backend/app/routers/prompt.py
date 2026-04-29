"""
Prompt engineering router.
POST /api/prompt/enhance    – AI-enhance a prompt
GET  /api/prompt/random     – random creative prompt
GET  /api/prompt/templates  – list prompt templates
GET  /api/prompt/history    – recent prompts for the current user
"""
from __future__ import annotations

from sqlalchemy import select
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_current_user
from app.models.database import PromptHistory, User, get_db
from app.models.schemas import (
    PromptEnhanceRequest,
    PromptEnhanceResponse,
    PromptHistoryOut,
    PromptTemplate,
    RandomPromptResponse,
)
from app.services.prompt_service import (
    enhance_prompt,
    generate_random_prompt,
    get_prompt_templates,
)

router = APIRouter(prefix="/api/prompt", tags=["prompts"])


@router.post(
    "/enhance",
    response_model=PromptEnhanceResponse,
    summary="AI-enhance a basic prompt",
)
async def enhance(
    payload: PromptEnhanceRequest,
    _: User = Depends(get_current_user),
) -> PromptEnhanceResponse:
    try:
        enhanced = await enhance_prompt(payload.prompt, style=payload.style)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Prompt enhancement failed: {str(e)}")

    return PromptEnhanceResponse(
        original=payload.prompt,
        enhanced=enhanced,
        style_applied=payload.style,
    )


@router.get(
    "/random",
    response_model=RandomPromptResponse,
    summary="Generate a random creative prompt",
)
async def random_prompt(
    _: User = Depends(get_current_user),
) -> RandomPromptResponse:
    return generate_random_prompt()


@router.get(
    "/templates",
    response_model=list[PromptTemplate],
    summary="List all prompt templates",
)
async def list_templates(
    _: User = Depends(get_current_user),
) -> list[PromptTemplate]:
    return get_prompt_templates()


@router.get(
    "/history",
    response_model=list[PromptHistoryOut],
    summary="List recent prompts for the signed-in user",
)
async def prompt_history(
    current_user: User = Depends(get_current_user),
    limit: int = Query(30, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
) -> list[PromptHistoryOut]:
    q = (
        select(PromptHistory)
        .where(PromptHistory.user_id == current_user.id)
        .order_by(PromptHistory.created_at.desc())
        .limit(limit * 3)
    )
    rows = (await db.execute(q)).scalars().all()
    seen: set[str] = set()
    items: list[PromptHistoryOut] = []
    for row in rows:
        if row.prompt in seen:
            continue
        seen.add(row.prompt)
        items.append(PromptHistoryOut.model_validate(row))
        if len(items) >= limit:
            break
    return items
