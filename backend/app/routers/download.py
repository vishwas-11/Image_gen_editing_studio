"""
Download router.
GET  /api/gallery/{id}/download              – single image download
POST /api/download/batch                     – batch download selected images as ZIP
GET  /api/collections/{id}/download          – collection ZIP (handled in collections.py)
"""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import Response
from pydantic import BaseModel
from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.dependencies import get_current_user
from app.models.database import Image as ImageModel, User, get_db
from app.services.download_service import (
    DownloadFormat,
    DownloadResolution,
    build_zip,
    fetch_and_convert,
)

router = APIRouter(prefix="/api", tags=["download"])


class BatchDownloadRequest(BaseModel):
    image_ids: List[str]
    format: DownloadFormat = "png"
    resolution: DownloadResolution = "original"


@router.get(
    "/gallery/{image_id}/download",
    summary="Download single image (format + resolution options)",
    responses={
        200: {"content": {"image/png": {}, "image/jpeg": {}, "image/webp": {}}},
    },
)
async def download_image(
    image_id: str,
    format: DownloadFormat = Query("png"),
    resolution: DownloadResolution = Query("original"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Response:
    img = await _get_owned_image(db, image_id, current_user.id)

    try:
        image_bytes = await fetch_and_convert(
            image_url=img.image_url,
            format=format,
            resolution=resolution,
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Download failed: {e}")

    mime_map = {"png": "image/png", "jpeg": "image/jpeg", "webp": "image/webp"}
    filename = f"ai_studio_{image_id[:8]}.{format}"

    return Response(
        content=image_bytes,
        media_type=mime_map[format],
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.post(
    "/download/batch",
    summary="Batch download selected images as ZIP",
)
async def batch_download(
    payload: BatchDownloadRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Response:
    if len(payload.image_ids) > 50:
        raise HTTPException(status_code=400, detail="Maximum 50 images per batch download")

    # Fetch only images owned by current user
    q = await db.execute(
        select(ImageModel).where(
            and_(
                ImageModel.id.in_(payload.image_ids),
                ImageModel.user_id == current_user.id,
            )
        )
    )
    images = q.scalars().all()

    if not images:
        raise HTTPException(status_code=404, detail="No accessible images found")

    image_list = [{"image_url": img.image_url, "id": img.id} for img in images]

    try:
        zip_bytes = await build_zip(
            images=image_list,
            format=payload.format,
            resolution=payload.resolution,
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"ZIP build failed: {e}")

    return Response(
        content=zip_bytes,
        media_type="application/zip",
        headers={"Content-Disposition": 'attachment; filename="ai_studio_batch.zip"'},
    )


async def _get_owned_image(db: AsyncSession, image_id: str, user_id: str) -> ImageModel:
    img = (
        await db.execute(
            select(ImageModel).where(
                and_(ImageModel.id == image_id, ImageModel.user_id == user_id)
            )
        )
    ).scalar_one_or_none()
    if not img:
        raise HTTPException(status_code=404, detail="Image not found")
    return img