"""
Cloudinary storage service.
ALL images (generated, uploaded, edited, thumbnails) go through here.
Returns Cloudinary URLs — nothing is ever stored locally.
"""
from __future__ import annotations

import io
import os
from typing import Optional

import cloudinary
import cloudinary.uploader
import cloudinary.api
from cloudinary.utils import cloudinary_url

from app.config import settings

# ─── Configure Cloudinary once at import ─────────────────────────────────────
cloudinary.config(
    cloud_name=settings.CLOUDINARY_CLOUD_NAME,
    api_key=settings.CLOUDINARY_API_KEY,
    api_secret=settings.CLOUDINARY_API_SECRET,
    secure=True,
)

# Folder prefixes
FOLDER_GENERATED = "ai_studio/generated"
FOLDER_ORIGINAL = "ai_studio/original"
FOLDER_EDITED = "ai_studio/edited"
FOLDER_MASKS = "ai_studio/masks"
FOLDER_THUMBNAILS = "ai_studio/thumbnails"


# ─── Upload helpers ───────────────────────────────────────────────────────────

def _folder_for_operation(operation: str) -> str:
    mapping = {
        "generate": FOLDER_GENERATED,
        "inpaint": FOLDER_EDITED,
        "outpaint": FOLDER_EDITED,
        "remove_bg": FOLDER_EDITED,
        "img2img": FOLDER_EDITED,
        "style_transfer": FOLDER_EDITED,
        "upload": FOLDER_ORIGINAL,
        "mask": FOLDER_MASKS,
    }
    return mapping.get(operation, FOLDER_GENERATED)


async def upload_image_bytes(
    image_bytes: bytes,
    operation: str = "generate",
    public_id: Optional[str] = None,
    format: str = "png",
    user_id: Optional[str] = None,
) -> dict:
    """
    Upload raw image bytes to Cloudinary.

    Returns a dict with:
        url, thumbnail_url, public_id, width, height, format, bytes
    """
    folder = _folder_for_operation(operation)
    if user_id:
        folder = f"{folder}/{user_id}"

    upload_result = cloudinary.uploader.upload(
        image_bytes,
        folder=folder,
        public_id=public_id,
        resource_type="image",
        format=format,
        overwrite=True,
        # Auto-generate thumbnail transformation
        eager=[
            {"width": 400, "height": 400, "crop": "fill", "format": "webp"},
        ],
        eager_async=False,
    )

    # Build thumbnail URL from eager transformation or Cloudinary transformation URL
    thumbnail_url: Optional[str] = None
    if upload_result.get("eager"):
        thumbnail_url = upload_result["eager"][0].get("secure_url")
    else:
        # Fallback: derive thumbnail via Cloudinary URL transformation
        thumb_url, _ = cloudinary_url(
            upload_result["public_id"],
            width=400,
            height=400,
            crop="fill",
            format="webp",
            secure=True,
        )
        thumbnail_url = thumb_url

    return {
        "url": upload_result["secure_url"],
        "thumbnail_url": thumbnail_url,
        "public_id": upload_result["public_id"],
        "width": upload_result.get("width", 0),
        "height": upload_result.get("height", 0),
        "format": upload_result.get("format", format),
        "bytes": upload_result.get("bytes", len(image_bytes)),
    }


async def upload_image_from_url(
    image_url: str,
    operation: str = "generate",
    user_id: Optional[str] = None,
    format: str = "png",
) -> dict:
    """
    Upload an image to Cloudinary from a remote URL.
    Used when AI providers return image URLs instead of bytes.
    """
    folder = _folder_for_operation(operation)
    if user_id:
        folder = f"{folder}/{user_id}"

    upload_result = cloudinary.uploader.upload(
        image_url,
        folder=folder,
        resource_type="image",
        format=format,
        eager=[
            {"width": 400, "height": 400, "crop": "fill", "format": "webp"},
        ],
        eager_async=False,
    )

    thumbnail_url: Optional[str] = None
    if upload_result.get("eager"):
        thumbnail_url = upload_result["eager"][0].get("secure_url")
    else:
        thumb_url, _ = cloudinary_url(
            upload_result["public_id"],
            width=400,
            height=400,
            crop="fill",
            format="webp",
            secure=True,
        )
        thumbnail_url = thumb_url

    return {
        "url": upload_result["secure_url"],
        "thumbnail_url": thumbnail_url,
        "public_id": upload_result["public_id"],
        "width": upload_result.get("width", 0),
        "height": upload_result.get("height", 0),
        "format": upload_result.get("format", format),
        "bytes": upload_result.get("bytes", 0),
    }


async def delete_image(public_id: str) -> bool:
    """Delete an image from Cloudinary by its public_id."""
    try:
        result = cloudinary.uploader.destroy(public_id, resource_type="image")
        return result.get("result") == "ok"
    except Exception:
        return False


def get_transformed_url(
    public_id: str,
    width: Optional[int] = None,
    height: Optional[int] = None,
    crop: str = "fill",
    format: str = "webp",
) -> str:
    """
    Return a Cloudinary transformation URL for on-the-fly resizing.
    """
    transforms: dict = {"secure": True, "format": format, "crop": crop}
    if width:
        transforms["width"] = width
    if height:
        transforms["height"] = height

    url, _ = cloudinary_url(public_id, **transforms)
    return url