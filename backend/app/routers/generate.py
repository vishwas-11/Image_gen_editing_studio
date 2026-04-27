"""
Image generation router.
POST /api/generate          – single or batch text-to-image
POST /api/generate/batch    – explicit batch (1-8)
POST /api/generate/variations – generate variations of an existing image
GET  /api/styles             – list available style presets
"""
from __future__ import annotations

import time
from typing import List

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_current_user
from app.models.database import Image as ImageModel, User, get_db
from app.models.schemas import (
    GenerateBatchRequest,
    GenerateRequest,
    GenerationResponse,
    GeneratedImageOut,
    StylePreset,
    VariationRequest,
)
from app.services.image_generator import get_generator
from app.services.image_processor import validate_image_bytes
from app.services.storage import upload_image_bytes

router = APIRouter(prefix="/api", tags=["generation"])


# ─── Helpers ──────────────────────────────────────────────────────────────────

async def _save_image_to_db(
    db: AsyncSession,
    user_id: str,
    upload_result: dict,
    prompt: str,
    negative_prompt: str | None,
    style: str,
    aspect_ratio: str,
    quality: str,
    operation: str,
    seed: str | None = None,
) -> ImageModel:
    img = ImageModel(
        user_id=user_id,
        image_url=upload_result["url"],
        thumbnail_url=upload_result.get("thumbnail_url"),
        cloudinary_public_id=upload_result.get("public_id"),
        prompt=prompt,
        negative_prompt=negative_prompt,
        style=style,
        aspect_ratio=aspect_ratio,
        quality=quality,
        seed=seed or upload_result.get("seed"),
        provider=_get_provider_name(),
        operation=operation,
        width=upload_result.get("width"),
        height=upload_result.get("height"),
        file_size=upload_result.get("bytes"),
        format=upload_result.get("format", "png"),
    )
    db.add(img)
    await db.flush()
    await db.refresh(img)
    return img


def _get_provider_name() -> str:
    from app.config import settings
    return settings.active_ai_provider


# ─── Routes ───────────────────────────────────────────────────────────────────

@router.post(
    "/generate",
    response_model=GenerationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Generate image(s) from text prompt",
)
async def generate_images(
    payload: GenerateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> GenerationResponse:
    start = time.time()
    generator = get_generator()

    try:
        upload_results = await generator.generate(
            prompt=payload.prompt,
            style=payload.style,
            aspect_ratio=payload.aspect_ratio,
            quality=payload.quality,
            n=payload.batch,
            seed=payload.seed,
            negative_prompt=payload.negative_prompt,
            user_id=current_user.id,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"AI provider error: {str(e)}",
        )

    saved: list[ImageModel] = []
    for res in upload_results:
        img = await _save_image_to_db(
            db=db,
            user_id=current_user.id,
            upload_result=res,
            prompt=payload.prompt,
            negative_prompt=payload.negative_prompt,
            style=payload.style,
            aspect_ratio=payload.aspect_ratio,
            quality=payload.quality,
            operation="generate",
            seed=res.get("seed"),
        )
        saved.append(img)

    elapsed = round(time.time() - start, 2)

    return GenerationResponse(
        images=[GeneratedImageOut.model_validate(img) for img in saved],
        prompt_used=payload.prompt,
        generation_time_seconds=elapsed,
    )


@router.post(
    "/generate/batch",
    response_model=GenerationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Batch generate 1–8 images",
)
async def generate_batch(
    payload: GenerateBatchRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> GenerationResponse:
    # Reuse the same logic
    return await generate_images(payload, current_user, db)  # type: ignore


@router.post(
    "/generate/variations",
    response_model=GenerationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Generate N variations of an existing image",
)
async def generate_variations(
    payload: VariationRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> GenerationResponse:
    import httpx

    start = time.time()

    # Download source image
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.get(payload.source_image_url)
        if resp.status_code != 200:
            raise HTTPException(status_code=400, detail="Could not fetch source image")
        source_bytes = resp.content

    validate_image_bytes(source_bytes)

    generator = get_generator()

    try:
        if hasattr(generator, "generate_variation"):
            upload_results = await generator.generate_variation(
                image_bytes=source_bytes,
                prompt=payload.prompt,
                style=payload.style,
                n=payload.count,
                user_id=current_user.id,
            )
        else:
            # Fallback: generate with similar prompt
            upload_results = await generator.generate(
                prompt=payload.prompt or "variation, same style and composition",
                style=payload.style,
                n=payload.count,
                user_id=current_user.id,
            )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"AI provider error: {str(e)}")

    saved = []
    for res in upload_results:
        img = await _save_image_to_db(
            db=db,
            user_id=current_user.id,
            upload_result=res,
            prompt=payload.prompt or "variation",
            negative_prompt=payload.negative_prompt,
            style=payload.style,
            aspect_ratio="1:1",
            quality="standard",
            operation="variation",
        )
        saved.append(img)

    return GenerationResponse(
        images=[GeneratedImageOut.model_validate(img) for img in saved],
        prompt_used=payload.prompt or "variation",
        generation_time_seconds=round(time.time() - start, 2),
    )


@router.get(
    "/styles",
    response_model=list[dict],
    summary="List all available style presets",
)
async def get_styles() -> list[dict]:
    from app.services.image_generator import STYLE_PROMPTS

    return [
        {
            "id": key,
            "name": key.replace("_", " ").title(),
            "prompt_suffix": value,
        }
        for key, value in STYLE_PROMPTS.items()
    ]