"""
Image generation service.
Supports: OpenAI DALL-E 3 (primary) and Stability AI (fallback).
Returns list of Cloudinary URLs after upload.
"""
from __future__ import annotations

import asyncio
import base64
import io
from typing import List, Optional

import httpx
from openai import AsyncOpenAI
from PIL import Image

from app.config import settings
from app.models.schemas import (
    ASPECT_RATIO_SIZES,
    AspectRatio,
    Quality,
    StylePreset,
)
from app.services.storage import upload_image_bytes, upload_image_from_url

# Style prompt injections
STYLE_PROMPTS: dict[str, str] = {
    "photorealistic": "photorealistic, ultra detailed, 8k, professional photography, sharp focus",
    "digital_art": "digital art, concept art, artstation, trending, highly detailed",
    "oil_painting": "oil painting, classical, textured brushstrokes, museum quality, masterpiece",
    "watercolor": "watercolor painting, soft edges, flowing colors, delicate washes, artistic",
    "anime": "anime style, manga, japanese animation, vibrant colors, cel shaded",
    "3d_render": "3D render, octane render, ray tracing, photorealistic 3D, cinema 4D",
    "pixel_art": "pixel art, 16-bit, retro game style, pixelated, sprite art",
    "comic_book": "comic book style, bold outlines, halftone dots, graphic novel, ink drawing",
    "minimalist": "minimalist, clean lines, simple shapes, negative space, modern design",
    "cinematic": "cinematic, film photography, movie still, dramatic lighting, anamorphic lens",
    "sketch": "pencil sketch, hand drawn, graphite, cross-hatching, concept sketch",
    "pop_art": "pop art, Andy Warhol inspired, bold colors, flat design, screen print",
    "art_nouveau": "art nouveau, ornate, flowing lines, natural forms, decorative, Mucha style",
    "cyberpunk": "cyberpunk, neon lights, futuristic dystopia, rain-soaked streets, synthwave",
    "fantasy": "fantasy art, magical, ethereal, detailed illustration, epic, D&D inspired",
    "none": "",
}

QUALITY_MAP: dict[str, str] = {
    "draft": "standard",
    "standard": "standard",
    "hd": "hd",
    "ultra": "hd",
}


def _build_prompt(prompt: str, style: StylePreset, negative_prompt: Optional[str] = None) -> str:
    """Inject style tags into the prompt."""
    style_suffix = STYLE_PROMPTS.get(style, "")
    full_prompt = f"{prompt}, {style_suffix}".strip(", ") if style_suffix else prompt
    return full_prompt


def _get_dalle_size(aspect_ratio: AspectRatio) -> str:
    """DALL-E 3 only supports 1024x1024, 1792x1024, 1024x1792."""
    mapping = {
        "1:1":  "1024x1024",
        "16:9": "1792x1024",
        "9:16": "1024x1792",
        "4:3":  "1792x1024",  # closest
        "3:2":  "1792x1024",
        "2:3":  "1024x1792",
    }
    return mapping.get(aspect_ratio, "1024x1024")


def _normalize_openai_inpaint_inputs(
    original_bytes: bytes,
    mask_bytes: bytes,
    target_size: int = 1024,
) -> tuple[bytes, bytes]:
    """
    Prepare inpaint inputs for OpenAI edits endpoint:
    - original in RGBA
    - mask in RGBA (white=inpaint, black=keep)
    - same dimensions
    - square 1024x1024 PNG
    """
    original = Image.open(io.BytesIO(original_bytes)).convert("RGBA")
    mask = Image.open(io.BytesIO(mask_bytes)).convert("L")

    # Align mask to original dimensions before any further transforms.
    if mask.size != original.size:
        mask = mask.resize(original.size, Image.NEAREST)

    orig_w, orig_h = original.size
    square_side = max(orig_w, orig_h)
    offset_x = (square_side - orig_w) // 2
    offset_y = (square_side - orig_h) // 2

    # Pad to square (transparent for image, black for mask/no-edit area).
    original_square = Image.new("RGBA", (square_side, square_side), (0, 0, 0, 0))
    original_square.paste(original, (offset_x, offset_y))

    mask_square = Image.new("L", (square_side, square_side), 0)
    mask_square.paste(mask, (offset_x, offset_y))

    # Normalize size to DALL-E edit target.
    if square_side != target_size:
        original_square = original_square.resize((target_size, target_size), Image.LANCZOS)
        mask_square = mask_square.resize((target_size, target_size), Image.NEAREST)

    mask_rgba = mask_square.convert("RGBA")

    orig_buf = io.BytesIO()
    original_square.save(orig_buf, format="PNG", optimize=True)

    mask_buf = io.BytesIO()
    mask_rgba.save(mask_buf, format="PNG", optimize=True)

    return orig_buf.getvalue(), mask_buf.getvalue()


# ─── OpenAI DALL-E ────────────────────────────────────────────────────────────

class OpenAIImageGenerator:
    def __init__(self):
        if not settings.OPENAI_API_KEY:
            raise RuntimeError("OPENAI_API_KEY not configured")
        self.client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

    async def generate(
        self,
        prompt: str,
        style: StylePreset = "none",
        aspect_ratio: AspectRatio = "1:1",
        quality: Quality = "standard",
        n: int = 1,
        seed: Optional[int] = None,
        negative_prompt: Optional[str] = None,
        user_id: Optional[str] = None,
    ) -> list[dict]:
        """
        Generate images with DALL-E 3.
        Returns list of upload result dicts.
        """
        full_prompt = _build_prompt(prompt, style, negative_prompt)
        size = _get_dalle_size(aspect_ratio)
        dalle_quality = QUALITY_MAP.get(quality, "standard")

        # DALL-E 3 max n=1 per call; run multiple concurrently for batch
        async def _single_generate() -> dict:
            resp = await self.client.images.generate(
                model="dall-e-3",
                prompt=full_prompt,
                size=size,  # type: ignore
                quality=dalle_quality,  # type: ignore
                response_format="url",
                n=1,
            )
            image_data = resp.data[0]
            # Upload to Cloudinary from the temporary OpenAI URL
            result = await upload_image_from_url(
                image_data.url,
                operation="generate",
                user_id=user_id,
                format="png",
            )
            result["seed"] = str(seed) if seed else None
            result["revised_prompt"] = image_data.revised_prompt
            return result

        # Run n generations concurrently
        tasks = [_single_generate() for _ in range(n)]
        results = await asyncio.gather(*tasks, return_exceptions=False)
        return list(results)

    async def generate_variation(
        self,
        image_bytes: bytes,
        prompt: Optional[str],
        style: StylePreset = "none",
        n: int = 4,
        user_id: Optional[str] = None,
    ) -> list[dict]:
        """Generate variations using DALL-E 2 (variations endpoint)."""
        # DALL-E 2 supports variations; convert to PNG bytes
        image_file = io.BytesIO(image_bytes)
        image_file.name = "source.png"

        resp = await self.client.images.create_variation(
            model="dall-e-2",
            image=image_file,
            n=min(n, 10),
            size="1024x1024",
            response_format="url",
        )

        tasks = [
            upload_image_from_url(d.url, operation="generate", user_id=user_id)
            for d in resp.data
        ]
        results = await asyncio.gather(*tasks)
        return list(results)

    async def inpaint(
        self,
        original_bytes: bytes,
        mask_bytes: bytes,
        prompt: str,
        style: StylePreset = "none",
        user_id: Optional[str] = None,
    ) -> dict:
        """Use DALL-E 2 edit endpoint for inpainting."""
        full_prompt = _build_prompt(prompt, style)
        original_bytes, mask_bytes = _normalize_openai_inpaint_inputs(
            original_bytes=original_bytes,
            mask_bytes=mask_bytes,
            target_size=1024,
        )

        image_file = io.BytesIO(original_bytes)
        image_file.name = "original.png"
        mask_file = io.BytesIO(mask_bytes)
        mask_file.name = "mask.png"

        resp = await self.client.images.edit(
            model="dall-e-2",
            image=image_file,
            mask=mask_file,
            prompt=full_prompt,
            n=1,
            size="1024x1024",
            response_format="url",
        )

        result = await upload_image_from_url(
            resp.data[0].url,
            operation="inpaint",
            user_id=user_id,
            format="png",
        )
        return result


# ─── Stability AI ─────────────────────────────────────────────────────────────

class StabilityImageGenerator:
    def __init__(self):
        if not settings.STABILITY_API_KEY:
            raise RuntimeError("STABILITY_API_KEY not configured")
        self.api_key = settings.STABILITY_API_KEY
        self.host = settings.STABILITY_API_HOST

    def _headers(self) -> dict:
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Accept": "application/json",
        }

    def _get_size(self, aspect_ratio: AspectRatio) -> tuple[int, int]:
        return ASPECT_RATIO_SIZES.get(aspect_ratio, (1024, 1024))

    def _get_steps(self, quality: Quality) -> int:
        return {"draft": 20, "standard": 30, "hd": 40, "ultra": 50}.get(quality, 30)

    async def generate(
        self,
        prompt: str,
        style: StylePreset = "none",
        aspect_ratio: AspectRatio = "1:1",
        quality: Quality = "standard",
        n: int = 1,
        seed: Optional[int] = None,
        negative_prompt: Optional[str] = None,
        user_id: Optional[str] = None,
    ) -> list[dict]:
        full_prompt = _build_prompt(prompt, style)
        width, height = self._get_size(aspect_ratio)
        steps = self._get_steps(quality)

        payload = {
            "text_prompts": [{"text": full_prompt, "weight": 1.0}],
            "width": width,
            "height": height,
            "steps": steps,
            "samples": n,
            "cfg_scale": 7.0,
        }
        if negative_prompt:
            payload["text_prompts"].append({"text": negative_prompt, "weight": -1.0})
        if seed is not None:
            payload["seed"] = seed

        url = f"{self.host}/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image"

        async with httpx.AsyncClient(timeout=120) as client:
            resp = await client.post(url, json=payload, headers=self._headers())
            resp.raise_for_status()
            data = resp.json()

        results = []
        for artifact in data.get("artifacts", []):
            img_bytes = base64.b64decode(artifact["base64"])
            upload = await upload_image_bytes(
                img_bytes,
                operation="generate",
                user_id=user_id,
                format="png",
            )
            upload["seed"] = str(artifact.get("seed"))
            upload["revised_prompt"] = None
            results.append(upload)

        return results

    async def img2img(
        self,
        image_bytes: bytes,
        prompt: str,
        style: StylePreset = "none",
        strength: float = 0.75,
        user_id: Optional[str] = None,
    ) -> list[dict]:
        full_prompt = _build_prompt(prompt, style)

        url = f"{self.host}/v1/generation/stable-diffusion-xl-1024-v1-0/image-to-image"

        async with httpx.AsyncClient(timeout=180) as client:
            resp = await client.post(
                url,
                headers={**self._headers(), "Accept": "application/json"},
                data={
                    "text_prompts[0][text]": full_prompt,
                    "text_prompts[0][weight]": "1",
                    "image_strength": str(1.0 - strength),
                    "init_image_mode": "IMAGE_STRENGTH",
                    "samples": "1",
                    "steps": "30",
                },
                files={"init_image": ("image.png", image_bytes, "image/png")},
            )
            resp.raise_for_status()
            data = resp.json()

        results = []
        for artifact in data.get("artifacts", []):
            img_bytes = base64.b64decode(artifact["base64"])
            upload = await upload_image_bytes(img_bytes, operation="img2img", user_id=user_id)
            results.append(upload)
        return results

    async def inpaint(
        self,
        original_bytes: bytes,
        mask_bytes: bytes,
        prompt: str,
        style: StylePreset = "none",
        user_id: Optional[str] = None,
    ) -> dict:
        full_prompt = _build_prompt(prompt, style)
        url = f"{self.host}/v1/generation/stable-inpainting-512-v2-0/image-to-image/masking"

        async with httpx.AsyncClient(timeout=180) as client:
            resp = await client.post(
                url,
                headers={**self._headers(), "Accept": "application/json"},
                data={
                    "text_prompts[0][text]": full_prompt,
                    "text_prompts[0][weight]": "1",
                    "mask_source": "MASK_IMAGE_WHITE",
                    "samples": "1",
                    "steps": "30",
                },
                files={
                    "init_image": ("original.png", original_bytes, "image/png"),
                    "mask_image": ("mask.png", mask_bytes, "image/png"),
                },
            )
            resp.raise_for_status()
            data = resp.json()

        artifact = data["artifacts"][0]
        img_bytes = base64.b64decode(artifact["base64"])
        return await upload_image_bytes(img_bytes, operation="inpaint", user_id=user_id)


# ─── Factory ──────────────────────────────────────────────────────────────────

def get_generator() -> OpenAIImageGenerator | StabilityImageGenerator:
    """Return the configured generator based on available API keys."""
    provider = settings.active_ai_provider
    if provider == "openai":
        return OpenAIImageGenerator()
    return StabilityImageGenerator()