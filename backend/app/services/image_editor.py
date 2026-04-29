"""
Image editing service.
- Inpainting: delegates to the generator's inpaint method
- Background Removal: remove.bg API (primary) or Clipdrop (fallback)
- Outpainting: Stability AI outpainting or manual Pillow expand + inpaint
- Image-to-Image: delegates to generator
"""
from __future__ import annotations

import io
from typing import List, Literal, Optional

import httpx
from PIL import Image, ImageDraw

from app.config import settings
from app.models.schemas import OutpaintRequest, StylePreset
from app.services import image_generator as gen_module
from app.services.storage import upload_image_bytes


# ─── Background Removal ───────────────────────────────────────────────────────

async def remove_background_removebg(image_bytes: bytes) -> bytes:
    """
    Remove background using remove.bg API.
    Returns PNG bytes with transparent background.
    """
    if not settings.REMOVE_BG_API_KEY:
        raise RuntimeError("REMOVE_BG_API_KEY not configured")

    async with httpx.AsyncClient(timeout=60) as client:
        resp = await client.post(
            "https://api.remove.bg/v1.0/removebg",
            headers={"X-Api-Key": settings.REMOVE_BG_API_KEY},
            files={"image_file": ("image.png", image_bytes, "image/png")},
            data={"size": "auto"},
        )
        if resp.status_code != 200:
            try:
                detail = resp.json().get("errors", [{"title": resp.text}])[0]["title"]
            except Exception:
                detail = resp.text
            raise RuntimeError(f"remove.bg error: {detail}")
        return resp.content


async def remove_background_clipdrop(image_bytes: bytes) -> bytes:
    """
    Remove background using Clipdrop (Stability AI) API.
    Fallback when remove.bg is not configured.
    """
    if not settings.CLIPDROP_API_KEY:
        raise RuntimeError("CLIPDROP_API_KEY not configured")

    async with httpx.AsyncClient(timeout=60) as client:
        resp = await client.post(
            "https://clipdrop-api.co/remove-background/v1",
            headers={"x-api-key": settings.CLIPDROP_API_KEY},
            files={"image_file": ("image.png", image_bytes, "image/png")},
        )
        if resp.status_code != 200:
            raise RuntimeError(f"Clipdrop error: {resp.text}")
        return resp.content


async def remove_background(image_bytes: bytes) -> bytes:
    """
    Route to the configured background removal provider.
    """
    provider = settings.bg_removal_provider
    if provider == "removebg":
        return await remove_background_removebg(image_bytes)
    return await remove_background_clipdrop(image_bytes)


async def remove_background_and_replace(
    image_bytes: bytes,
    replacement_type: Literal["transparent", "color", "prompt"],
    replacement_color: Optional[str] = None,
    replacement_prompt: Optional[str] = None,
    user_id: Optional[str] = None,
) -> dict:
    """
    Full pipeline:
    1. Remove background via API
    2. Optionally composite new background (solid color or AI-generated)
    3. Upload result to Cloudinary
    """
    # Step 1: Remove background
    no_bg_bytes = await remove_background(image_bytes)

    if replacement_type == "transparent":
        # Just upload the transparent PNG
        return await upload_image_bytes(no_bg_bytes, operation="remove_bg", user_id=user_id, format="png")

    # Step 2a: Solid color replacement
    if replacement_type == "color" and replacement_color:
        fg = Image.open(io.BytesIO(no_bg_bytes)).convert("RGBA")
        background = Image.new("RGBA", fg.size, replacement_color)
        composite = Image.alpha_composite(background, fg).convert("RGB")
        buf = io.BytesIO()
        composite.save(buf, format="PNG")
        result_bytes = buf.getvalue()
        return await upload_image_bytes(result_bytes, operation="remove_bg", user_id=user_id, format="png")

    # Step 2b: AI-generated background
    if replacement_type == "prompt" and replacement_prompt:
        generator = gen_module.get_generator()
        # Generate a background image, then composite the foreground on top
        bg_results = await generator.generate(
            prompt=replacement_prompt,
            n=1,
            user_id=user_id,
        )
        # Download the generated background bytes via httpx
        async with httpx.AsyncClient(timeout=30) as client:
            bg_resp = await client.get(bg_results[0]["url"])
            bg_bytes = bg_resp.content

        fg = Image.open(io.BytesIO(no_bg_bytes)).convert("RGBA")
        bg = Image.open(io.BytesIO(bg_bytes)).convert("RGBA").resize(fg.size)
        composite = Image.alpha_composite(bg, fg).convert("RGB")
        buf = io.BytesIO()
        composite.save(buf, format="PNG")
        result_bytes = buf.getvalue()
        return await upload_image_bytes(result_bytes, operation="remove_bg", user_id=user_id, format="png")

    # Fallback: transparent
    return await upload_image_bytes(no_bg_bytes, operation="remove_bg", user_id=user_id, format="png")


# ─── Outpainting ─────────────────────────────────────────────────────────────

def _expand_image(
    image_bytes: bytes,
    directions: List[str],
    pixels: int,
) -> tuple[bytes, bytes]:
    """
    Expand the canvas in given directions using Pillow.
    Returns (expanded_image_bytes, mask_bytes).
    Mask is white where new content should be generated, black elsewhere.
    """
    original = Image.open(io.BytesIO(image_bytes)).convert("RGBA")
    orig_w, orig_h = original.size

    left_exp = pixels if "left" in directions else 0
    right_exp = pixels if "right" in directions else 0
    top_exp = pixels if "top" in directions else 0
    bottom_exp = pixels if "bottom" in directions else 0

    new_w = orig_w + left_exp + right_exp
    new_h = orig_h + top_exp + bottom_exp

    # New expanded canvas (white background)
    expanded = Image.new("RGBA", (new_w, new_h), (255, 255, 255, 255))
    expanded.paste(original, (left_exp, top_exp))

    # Mask: white = areas to inpaint, black = keep original
    mask = Image.new("L", (new_w, new_h), 0)  # start all black
    draw = ImageDraw.Draw(mask)
    if left_exp:
        draw.rectangle([0, 0, left_exp - 1, new_h], fill=255)
    if right_exp:
        draw.rectangle([new_w - right_exp, 0, new_w, new_h], fill=255)
    if top_exp:
        draw.rectangle([0, 0, new_w, top_exp - 1], fill=255)
    if bottom_exp:
        draw.rectangle([0, new_h - bottom_exp, new_w, new_h], fill=255)

    # Convert mask to RGBA for API compatibility
    mask_rgba = mask.convert("RGBA")

    exp_buf = io.BytesIO()
    expanded.convert("RGB").save(exp_buf, format="PNG")

    mask_buf = io.BytesIO()
    mask_rgba.save(mask_buf, format="PNG")

    return exp_buf.getvalue(), mask_buf.getvalue()


async def outpaint(
    req: OutpaintRequest,
    user_id: Optional[str] = None,
) -> dict:
    """
    Outpaint pipeline:
    1. Download original from Cloudinary URL
    2. Expand canvas with Pillow
    3. Inpaint the expanded regions via AI
    4. Upload result to Cloudinary
    """
    async with httpx.AsyncClient(timeout=30) as client:
        img_resp = await client.get(req.original_image_url)
        img_bytes = img_resp.content

    expanded_bytes, mask_bytes = _expand_image(img_bytes, req.directions, req.pixels)

    prompt = req.prompt or "seamlessly continue the image, same style and lighting"

    generator = gen_module.get_generator()
    if hasattr(generator, "inpaint"):
        result = await generator.inpaint(
            original_bytes=expanded_bytes,
            mask_bytes=mask_bytes,
            prompt=prompt,
            user_id=user_id,
        )
    else:
        # Fallback: just upload the expanded image
        result = await upload_image_bytes(expanded_bytes, operation="outpaint", user_id=user_id)

    return result


# ─── Image-to-Image ───────────────────────────────────────────────────────────

async def img2img(
    source_url: str,
    prompt: str,
    style: StylePreset = "none",
    strength: float = 0.75,
    user_id: Optional[str] = None,
) -> list[dict]:
    """Download source image and apply img2img transformation."""
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.get(source_url)
        source_bytes = resp.content

    generator = gen_module.get_generator()

    if hasattr(generator, "img2img"):
        return await generator.img2img(
            image_bytes=source_bytes,
            prompt=prompt,
            style=style,
            strength=strength,
            user_id=user_id,
        )
    else:
        # Fallback for generators that don't support img2img: generate with prompt
        return await generator.generate(
            prompt=prompt,
            style=style,
            user_id=user_id,
        )


async def style_transfer(
    source_url: str,
    style: StylePreset = "none",
    prompt: Optional[str] = None,
    strength: float = 0.45,
    user_id: Optional[str] = None,
) -> dict:
    """
    Apply a style to an existing image while preserving its content.
    """
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.get(source_url)
        source_bytes = resp.content

    generator = gen_module.get_generator()

    if hasattr(generator, "style_transfer"):
        result = await generator.style_transfer(  # type: ignore[attr-defined]
            image_bytes=source_bytes,
            style=style,
            prompt=prompt,
            strength=strength,
            user_id=user_id,
        )
        if isinstance(result, list):
            return result[0]
        return result

    if hasattr(generator, "img2img"):
        results = await generator.img2img(  # type: ignore[attr-defined]
            image_bytes=source_bytes,
            prompt=_build_style_transfer_fallback_prompt(style, prompt),
            style="none",
            strength=strength,
            user_id=user_id,
        )
        return results[0]

    return await upload_image_bytes(source_bytes, operation="style_transfer", user_id=user_id)


# ─── Inpainting ───────────────────────────────────────────────────────────────

async def inpaint(
    original_url: str,
    mask_url: str,
    prompt: str,
    style: StylePreset = "none",
    user_id: Optional[str] = None,
) -> dict:
    """Download original + mask images and run inpainting."""
    async with httpx.AsyncClient(timeout=30) as client:
        orig_resp, mask_resp = await asyncio.gather(
            client.get(original_url),
            client.get(mask_url),
        )
        original_bytes = orig_resp.content
        mask_bytes = mask_resp.content

    generator = gen_module.get_generator()
    return await generator.inpaint(
        original_bytes=original_bytes,
        mask_bytes=mask_bytes,
        prompt=prompt,
        style=style,
        user_id=user_id,
    )


# asyncio for gather in inpaint
import asyncio  # noqa: E402  (moved to bottom to avoid circular issues)


def _build_style_transfer_fallback_prompt(style: StylePreset, prompt: Optional[str] = None) -> str:
    style_name = style.replace("_", " ")
    base_prompt = prompt.strip() if prompt else ""
    if not base_prompt:
        base_prompt = (
            "Restyle this exact image while preserving the original composition, subject, objects, scene layout, perspective, and meaning."
        )
    return (
        f"{base_prompt} Do not add, remove, or replace objects. "
        f"Keep the scene recognizable. Apply a {style_name} aesthetic."
    )
