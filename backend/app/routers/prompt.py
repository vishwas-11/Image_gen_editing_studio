"""
Prompt engineering router.
POST /api/prompt/enhance    – AI-enhance a prompt
GET  /api/prompt/random     – random creative prompt
GET  /api/prompt/templates  – list prompt templates
"""
from fastapi import APIRouter, Depends, HTTPException

from app.dependencies import get_current_user
from app.models.database import User
from app.models.schemas import (
    PromptEnhanceRequest,
    PromptEnhanceResponse,
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