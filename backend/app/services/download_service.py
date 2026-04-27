"""
Download service.
Handles format conversion, resolution variants, and ZIP packing
for single-image and batch/collection downloads.
"""
from __future__ import annotations

import io
import zipfile
from typing import Literal

import httpx

from app.services.image_processor import convert_format, resize_image, smart_crop

DownloadFormat = Literal["png", "jpeg", "webp"]
DownloadResolution = Literal["original", "2k", "1k", "thumbnail"]

RESOLUTION_MAP: dict[str, tuple[int, int] | None] = {
    "original":  None,            # no resize
    "2k":        (2048, 2048),
    "1k":        (1024, 1024),
    "thumbnail": (400, 400),
}

MIME_MAP: dict[str, str] = {
    "png":  "image/png",
    "jpeg": "image/jpeg",
    "webp": "image/webp",
}


async def fetch_and_convert(
    image_url: str,
    format: DownloadFormat = "png",
    resolution: DownloadResolution = "original",
    quality: int = 90,
) -> bytes:
    """
    Fetch image from Cloudinary URL, resize if requested, convert format.
    Returns final bytes ready to stream to client.
    """
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.get(image_url)
        resp.raise_for_status()
        image_bytes = resp.content

    # Resize if requested
    target = RESOLUTION_MAP.get(resolution)
    if target:
        w, h = target
        image_bytes = smart_crop(image_bytes, w, h)

    # Convert format
    return convert_format(image_bytes, target_format=format, quality=quality)


async def build_zip(
    images: list[dict],
    format: DownloadFormat = "png",
    resolution: DownloadResolution = "original",
) -> bytes:
    """
    Build a ZIP archive from a list of image dicts.
    Each dict must have: image_url, id (used for filename).

    Returns raw ZIP bytes.
    """
    zip_buf = io.BytesIO()

    async with httpx.AsyncClient(timeout=60) as client:
        with zipfile.ZipFile(zip_buf, "w", zipfile.ZIP_DEFLATED) as zf:
            for idx, img in enumerate(images, start=1):
                url = img.get("image_url") or img.get("url")
                img_id = img.get("id", str(idx))

                try:
                    resp = await client.get(url)
                    if resp.status_code != 200:
                        continue
                    raw = resp.content

                    target = RESOLUTION_MAP.get(resolution)
                    if target:
                        w, h = target
                        raw = smart_crop(raw, w, h)

                    final = convert_format(raw, target_format=format)
                    filename = f"{idx:03d}_{img_id[:8]}.{format}"
                    zf.writestr(filename, final)
                except Exception:
                    continue

    return zip_buf.getvalue()