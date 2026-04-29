"""
Image editing router.
POST /api/edit/inpaint        – inpaint masked region
POST /api/edit/outpaint       – extend canvas
POST /api/edit/remove-bg      – background removal (online API)
POST /api/edit/img2img        – image-to-image transformation
POST /api/edit/style-transfer – apply style to existing image
POST /api/upload              – upload reference/source image
"""
from __future__ import annotations

import time

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_current_user
from app.models.database import Image as ImageModel, User, get_db
from app.models.schemas import (
    GeneratedImageOut,
    GenerationResponse,
    InpaintRequest,
    Img2ImgRequest,
    OutpaintRequest,
    RemoveBgRequest,
    StyleTransferRequest,
    UploadResponse,
)
from app.services import image_editor as editor
from app.services.image_processor import validate_image_bytes, get_image_info
from app.services.storage import upload_image_bytes

router = APIRouter(prefix="/api", tags=["editing"])


# ─── Upload reference image ───────────────────────────────────────────────────

@router.post(
    "/upload",
    response_model=UploadResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload a reference/source image",
)
async def upload_image(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> UploadResponse:
    allowed = {"image/jpeg", "image/png", "image/webp", "image/gif"}
    if file.content_type not in allowed:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: {file.content_type}. Allowed: {allowed}",
        )

    image_bytes = await file.read()
    validate_image_bytes(image_bytes, max_mb=20.0)
    info = get_image_info(image_bytes)

    upload = await upload_image_bytes(
        image_bytes,
        operation="upload",
        user_id=current_user.id,
        format=info["format"].lower() if info["format"] != "unknown" else "png",
    )

    # Save record to DB
    img = ImageModel(
        user_id=current_user.id,
        image_url=upload["url"],
        thumbnail_url=upload.get("thumbnail_url"),
        cloudinary_public_id=upload.get("public_id"),
        operation="upload",
        width=upload.get("width"),
        height=upload.get("height"),
        file_size=upload.get("bytes"),
        format=upload.get("format", "png"),
    )
    db.add(img)
    await db.flush()

    return UploadResponse(
        image_url=upload["url"],
        thumbnail_url=upload.get("thumbnail_url"),
        cloudinary_public_id=upload["public_id"],
        width=upload.get("width", 0),
        height=upload.get("height", 0),
        format=upload.get("format", "png"),
        file_size=upload.get("bytes", 0),
    )


# ─── Inpainting ───────────────────────────────────────────────────────────────

@router.post(
    "/edit/inpaint",
    response_model=GenerationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Inpaint a masked region",
)
async def inpaint(
    payload: InpaintRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> GenerationResponse:
    start = time.time()

    try:
        result = await editor.inpaint(
            original_url=payload.original_image_url,
            mask_url=payload.mask_image_url,
            prompt=payload.prompt,
            style=payload.style,
            user_id=current_user.id,
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Inpainting failed: {str(e)}")

    img = ImageModel(
        user_id=current_user.id,
        image_url=result["url"],
        thumbnail_url=result.get("thumbnail_url"),
        cloudinary_public_id=result.get("public_id"),
        prompt=payload.prompt,
        negative_prompt=payload.negative_prompt,
        style=payload.style,
        operation="inpaint",
        width=result.get("width"),
        height=result.get("height"),
        file_size=result.get("bytes"),
        format="png",
        provider=_provider(),
    )
    db.add(img)
    await db.flush()
    await db.refresh(img)

    return GenerationResponse(
        images=[GeneratedImageOut.model_validate(img)],
        prompt_used=payload.prompt,
        generation_time_seconds=round(time.time() - start, 2),
    )


# ─── Outpainting ─────────────────────────────────────────────────────────────

@router.post(
    "/edit/outpaint",
    response_model=GenerationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Extend image canvas (outpaint)",
)
async def outpaint(
    payload: OutpaintRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> GenerationResponse:
    start = time.time()

    try:
        result = await editor.outpaint(req=payload, user_id=current_user.id)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Outpainting failed: {str(e)}")

    img = ImageModel(
        user_id=current_user.id,
        image_url=result["url"],
        thumbnail_url=result.get("thumbnail_url"),
        cloudinary_public_id=result.get("public_id"),
        prompt=payload.prompt,
        operation="outpaint",
        width=result.get("width"),
        height=result.get("height"),
        file_size=result.get("bytes"),
        format="png",
        provider=_provider(),
    )
    db.add(img)
    await db.flush()
    await db.refresh(img)

    return GenerationResponse(
        images=[GeneratedImageOut.model_validate(img)],
        prompt_used=payload.prompt or "outpaint",
        generation_time_seconds=round(time.time() - start, 2),
    )


# ─── Background Removal ───────────────────────────────────────────────────────

@router.post(
    "/edit/remove-bg",
    response_model=GenerationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Remove background from image (online API)",
)
async def remove_bg(
    payload: RemoveBgRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> GenerationResponse:
    start = time.time()

    import httpx

    # Download source image
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.get(payload.image_url)
        if resp.status_code != 200:
            raise HTTPException(status_code=400, detail="Could not fetch source image")
        source_bytes = resp.content

    try:
        result = await editor.remove_background_and_replace(
            image_bytes=source_bytes,
            replacement_type=payload.replacement_type,
            replacement_color=payload.replacement_color,
            replacement_prompt=payload.replacement_prompt,
            user_id=current_user.id,
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Background removal failed: {str(e)}")

    img = ImageModel(
        user_id=current_user.id,
        image_url=result["url"],
        thumbnail_url=result.get("thumbnail_url"),
        cloudinary_public_id=result.get("public_id"),
        prompt=payload.replacement_prompt or f"background removal ({payload.replacement_type})",
        operation="remove_bg",
        aspect_ratio="1:1",
        quality="standard",
        provider=_bg_provider(),
        width=result.get("width"),
        height=result.get("height"),
        file_size=result.get("bytes"),
        format="png",
    )
    db.add(img)
    await db.flush()
    await db.refresh(img)

    return GenerationResponse(
        images=[GeneratedImageOut.model_validate(img)],
        prompt_used="background removal",
        generation_time_seconds=round(time.time() - start, 2),
    )


# ─── Image-to-Image ───────────────────────────────────────────────────────────

@router.post(
    "/edit/img2img",
    response_model=GenerationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Image-to-image transformation",
)
async def img_to_img(
    payload: Img2ImgRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> GenerationResponse:
    start = time.time()

    try:
        results = await editor.img2img(
            source_url=payload.source_image_url,
            prompt=payload.prompt,
            style=payload.style,
            strength=payload.strength,
            user_id=current_user.id,
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"img2img failed: {str(e)}")

    saved = []
    for result in results:
        img = ImageModel(
            user_id=current_user.id,
            image_url=result["url"],
            thumbnail_url=result.get("thumbnail_url"),
            cloudinary_public_id=result.get("public_id"),
            prompt=payload.prompt,
            negative_prompt=payload.negative_prompt,
            style=payload.style,
            aspect_ratio=payload.aspect_ratio,
            quality=payload.quality,
            operation="img2img",
            width=result.get("width"),
            height=result.get("height"),
            file_size=result.get("bytes"),
            format="png",
            provider=_provider(),
        )
        db.add(img)
        await db.flush()
        await db.refresh(img)
        saved.append(img)

    return GenerationResponse(
        images=[GeneratedImageOut.model_validate(img) for img in saved],
        prompt_used=payload.prompt,
        generation_time_seconds=round(time.time() - start, 2),
    )


# ─── Style Transfer ───────────────────────────────────────────────────────────

@router.post(
    "/edit/style-transfer",
    response_model=GenerationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Apply an artistic style to an image",
)
async def style_transfer(
    payload: StyleTransferRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> GenerationResponse:
    start = time.time()

    try:
        result = await editor.style_transfer(
            source_url=payload.source_image_url,
            style=payload.style,
            prompt=payload.prompt,
            strength=payload.strength,
            user_id=current_user.id,
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Style transfer failed: {str(e)}")

    img = ImageModel(
        user_id=current_user.id,
        image_url=result["url"],
        thumbnail_url=result.get("thumbnail_url"),
        cloudinary_public_id=result.get("public_id"),
        prompt=payload.prompt or f"style transfer ({payload.style})",
        style=payload.style,
        operation="style_transfer",
        aspect_ratio="1:1",
        quality="standard",
        width=result.get("width"),
        height=result.get("height"),
        file_size=result.get("bytes"),
        format="png",
        provider=_provider(),
    )
    db.add(img)
    await db.flush()
    await db.refresh(img)

    return GenerationResponse(
        images=[GeneratedImageOut.model_validate(img)],
        prompt_used=payload.prompt or f"style transfer ({payload.style})",
        generation_time_seconds=round(time.time() - start, 2),
    )


def _provider() -> str:
    from app.config import settings
    return settings.active_ai_provider


def _bg_provider() -> str:
    from app.config import settings
    return settings.bg_removal_provider
