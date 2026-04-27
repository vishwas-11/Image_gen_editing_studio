"""
Upload router.
POST /api/upload            – upload one image (multipart)
POST /api/upload/mask       – upload mask image from Fabric.js (base64 or file)
POST /api/upload/url        – upload by providing a remote URL
GET  /api/upload/{image_id} – get upload status / metadata
"""
from __future__ import annotations

import base64
import io
import re

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_current_user
from app.models.database import Image as ImageModel, User, get_db
from app.models.schemas import ImageOut, UploadResponse
from app.services.image_processor import get_image_info, validate_image_bytes
from app.services.storage import upload_image_bytes, upload_image_from_url

router = APIRouter(prefix="/api/upload", tags=["upload"])

ALLOWED_MIME = {"image/jpeg", "image/png", "image/webp", "image/gif", "image/bmp"}
MAX_MB = 20.0


# ─── Standard file upload ─────────────────────────────────────────────────────

@router.post(
    "",
    response_model=UploadResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload a reference/source image (multipart)",
)
async def upload_image(
    file: UploadFile = File(...),
    operation: str = Form("upload"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> UploadResponse:
    if file.content_type not in ALLOWED_MIME:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{file.content_type}'. Allowed: {sorted(ALLOWED_MIME)}",
        )

    image_bytes = await file.read()

    try:
        validate_image_bytes(image_bytes, max_mb=MAX_MB)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    info = get_image_info(image_bytes)
    fmt = info["format"].lower()
    if fmt == "unknown":
        fmt = "png"

    upload = await upload_image_bytes(
        image_bytes,
        operation=operation,
        user_id=current_user.id,
        format=fmt,
    )

    # Persist to DB
    img = ImageModel(
        user_id=current_user.id,
        image_url=upload["url"],
        thumbnail_url=upload.get("thumbnail_url"),
        cloudinary_public_id=upload.get("public_id"),
        operation=operation,
        width=upload.get("width"),
        height=upload.get("height"),
        file_size=upload.get("bytes"),
        format=fmt,
    )
    db.add(img)
    await db.flush()

    return UploadResponse(
        image_url=upload["url"],
        thumbnail_url=upload.get("thumbnail_url"),
        cloudinary_public_id=upload["public_id"],
        width=upload.get("width", 0),
        height=upload.get("height", 0),
        format=fmt,
        file_size=upload.get("bytes", 0),
    )


# ─── Mask upload (base64 from Fabric.js canvas) ───────────────────────────────

@router.post(
    "/mask",
    response_model=UploadResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload inpaint mask from Fabric.js (base64 data URI or file)",
)
async def upload_mask(
    file: UploadFile | None = File(None),
    base64_data: str | None = Form(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> UploadResponse:
    """
    Accepts either:
    - A file upload (multipart)
    - A base64 data URI from Fabric.js canvas.toDataURL()
      e.g.  "data:image/png;base64,iVBORw0KGgo..."
    """
    if base64_data:
        # Strip data URI header if present
        match = re.match(r"data:image/\w+;base64,(.+)", base64_data, re.DOTALL)
        if match:
            raw_b64 = match.group(1)
        else:
            raw_b64 = base64_data.strip()
        try:
            image_bytes = base64.b64decode(raw_b64)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid base64 data")
    elif file:
        image_bytes = await file.read()
    else:
        raise HTTPException(status_code=400, detail="Provide either 'file' or 'base64_data'")

    try:
        validate_image_bytes(image_bytes, max_mb=10.0)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    upload = await upload_image_bytes(
        image_bytes,
        operation="mask",
        user_id=current_user.id,
        format="png",
    )

    return UploadResponse(
        image_url=upload["url"],
        thumbnail_url=upload.get("thumbnail_url"),
        cloudinary_public_id=upload["public_id"],
        width=upload.get("width", 0),
        height=upload.get("height", 0),
        format="png",
        file_size=upload.get("bytes", 0),
    )


# ─── Upload by URL ────────────────────────────────────────────────────────────

@router.post(
    "/url",
    response_model=UploadResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload an image by providing a remote URL",
)
async def upload_from_url(
    image_url: str = Form(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> UploadResponse:
    if not image_url.startswith(("http://", "https://")):
        raise HTTPException(status_code=400, detail="Must be a valid HTTP/HTTPS URL")

    try:
        upload = await upload_image_from_url(
            image_url,
            operation="upload",
            user_id=current_user.id,
            format="png",
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Failed to fetch/upload image: {e}")

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