"""
Image processing utilities using Pillow.
Used for: resize, format conversion, thumbnail, composite, metadata extraction.
"""
from __future__ import annotations

import io
from typing import Optional, Tuple

from PIL import Image, ExifTags


# ─── Format conversion ───────────────────────────────────────────────────────

def convert_format(image_bytes: bytes, target_format: str = "webp", quality: int = 90) -> bytes:
    """
    Convert image bytes to target format.
    Supports: png, jpeg, webp.
    """
    target_format = target_format.lower()
    img = Image.open(io.BytesIO(image_bytes))

    if target_format == "jpeg" or target_format == "jpg":
        # JPEG doesn't support transparency
        if img.mode in ("RGBA", "LA", "P"):
            background = Image.new("RGB", img.size, (255, 255, 255))
            if img.mode == "P":
                img = img.convert("RGBA")
            background.paste(img, mask=img.split()[-1] if img.mode == "RGBA" else None)
            img = background
        buf = io.BytesIO()
        img.save(buf, format="JPEG", quality=quality, optimize=True)
    elif target_format == "webp":
        buf = io.BytesIO()
        img.save(buf, format="WEBP", quality=quality, method=6)
    elif target_format == "png":
        buf = io.BytesIO()
        img.save(buf, format="PNG", optimize=True)
    else:
        raise ValueError(f"Unsupported format: {target_format}")

    return buf.getvalue()


# ─── Resize ───────────────────────────────────────────────────────────────────

def resize_image(
    image_bytes: bytes,
    width: Optional[int] = None,
    height: Optional[int] = None,
    maintain_aspect: bool = True,
) -> bytes:
    """
    Resize image. If only one dimension given, calculates the other.
    """
    img = Image.open(io.BytesIO(image_bytes))
    orig_w, orig_h = img.size

    if width and height and not maintain_aspect:
        new_size = (width, height)
    elif width and maintain_aspect:
        ratio = width / orig_w
        new_size = (width, int(orig_h * ratio))
    elif height and maintain_aspect:
        ratio = height / orig_h
        new_size = (int(orig_w * ratio), height)
    else:
        new_size = (width or orig_w, height or orig_h)

    img = img.resize(new_size, Image.LANCZOS)
    buf = io.BytesIO()
    fmt = img.format or "PNG"
    img.save(buf, format=fmt)
    return buf.getvalue()


def smart_crop(image_bytes: bytes, width: int, height: int) -> bytes:
    """Center-crop to exact dimensions."""
    img = Image.open(io.BytesIO(image_bytes))
    img.thumbnail((width * 4, height * 4), Image.LANCZOS)  # scale down first

    # Center crop
    left = (img.width - width) // 2
    top = (img.height - height) // 2
    img = img.crop((left, top, left + width, top + height))

    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


# ─── Thumbnail ────────────────────────────────────────────────────────────────

def generate_thumbnail(image_bytes: bytes, size: int = 400) -> bytes:
    """Generate square thumbnail."""
    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    img.thumbnail((size, size), Image.LANCZOS)
    buf = io.BytesIO()
    img.save(buf, format="WEBP", quality=80)
    return buf.getvalue()


# ─── Metadata ─────────────────────────────────────────────────────────────────

def get_image_info(image_bytes: bytes) -> dict:
    """Extract basic metadata from image bytes."""
    img = Image.open(io.BytesIO(image_bytes))
    info = {
        "width": img.width,
        "height": img.height,
        "format": img.format or "unknown",
        "mode": img.mode,
        "file_size": len(image_bytes),
    }
    return info


# ─── Mask utilities ───────────────────────────────────────────────────────────

def ensure_mask_for_inpaint(mask_bytes: bytes, target_size: Tuple[int, int]) -> bytes:
    """
    Normalize mask for inpainting:
    - Resize to match original image
    - Ensure: white = inpaint area, black = keep area
    - Convert to RGBA
    """
    mask = Image.open(io.BytesIO(mask_bytes)).convert("L")
    mask = mask.resize(target_size, Image.NEAREST)
    mask_rgba = mask.convert("RGBA")

    buf = io.BytesIO()
    mask_rgba.save(buf, format="PNG")
    return buf.getvalue()


def validate_image_bytes(image_bytes: bytes, max_mb: float = 20.0) -> None:
    """Raise ValueError if image is invalid or too large."""
    max_bytes = int(max_mb * 1024 * 1024)
    if len(image_bytes) > max_bytes:
        raise ValueError(f"Image exceeds {max_mb}MB limit")
    try:
        img = Image.open(io.BytesIO(image_bytes))
        img.verify()
    except Exception as e:
        raise ValueError(f"Invalid image: {e}")