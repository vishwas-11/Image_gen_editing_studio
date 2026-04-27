"""
Prompt engineering service.
- AI-powered prompt enhancement (OpenAI GPT)
- Pre-built JSON templates
- Random prompt generator
"""
from __future__ import annotations

import random
from typing import List, Optional

from openai import AsyncOpenAI

from app.config import settings
from app.models.schemas import (
    PromptTemplate,
    RandomPromptResponse,
    StylePreset,
    AspectRatio,
)

# ─── Prompt Templates ─────────────────────────────────────────────────────────

PROMPT_TEMPLATES: list[dict] = [
    {
        "id": "product_photo",
        "name": "Product Photography",
        "category": "commercial",
        "template": "Professional product photo of {subject}, studio lighting, white background, 8k resolution, commercial photography",
        "example": "Professional product photo of a luxury wristwatch, studio lighting, white background, 8k resolution, commercial photography",
        "tags": ["product", "commercial", "studio"],
    },
    {
        "id": "portrait",
        "name": "Portrait",
        "category": "people",
        "template": "{subject}, portrait photography, bokeh background, natural lighting, sharp focus, 85mm lens",
        "example": "Young woman smiling, portrait photography, bokeh background, natural lighting, sharp focus, 85mm lens",
        "tags": ["portrait", "people", "photography"],
    },
    {
        "id": "landscape",
        "name": "Landscape",
        "category": "nature",
        "template": "Epic landscape of {subject}, golden hour lighting, dramatic sky, ultra wide angle, 8k, photorealistic",
        "example": "Epic landscape of misty mountains at sunrise, golden hour lighting, dramatic sky, ultra wide angle, 8k, photorealistic",
        "tags": ["landscape", "nature", "photography"],
    },
    {
        "id": "abstract_art",
        "name": "Abstract Art",
        "category": "art",
        "template": "Abstract art representing {concept}, vibrant colors, dynamic composition, contemporary art, mixed media",
        "example": "Abstract art representing emotions, vibrant colors, dynamic composition, contemporary art, mixed media",
        "tags": ["abstract", "art", "creative"],
    },
    {
        "id": "logo_concept",
        "name": "Logo Concept",
        "category": "design",
        "template": "Minimalist logo design for {brand}, vector style, clean lines, professional, white background",
        "example": "Minimalist logo design for a tech startup, vector style, clean lines, professional, white background",
        "tags": ["logo", "design", "minimalist"],
    },
    {
        "id": "ux_mockup",
        "name": "UI/UX Mockup",
        "category": "design",
        "template": "UI/UX design mockup for {app_type}, modern dark theme, clean interface, mobile app, Figma style",
        "example": "UI/UX design mockup for a fitness tracking app, modern dark theme, clean interface, mobile app, Figma style",
        "tags": ["ui", "ux", "design", "mockup"],
    },
    {
        "id": "architecture",
        "name": "Architecture",
        "category": "architecture",
        "template": "Architectural visualization of {building}, photorealistic render, natural lighting, 3D architectural render",
        "example": "Architectural visualization of a modern glass house by a lake, photorealistic render, natural lighting, 3D architectural render",
        "tags": ["architecture", "3d", "render"],
    },
    {
        "id": "food_photo",
        "name": "Food Photography",
        "category": "food",
        "template": "Professional food photography of {dish}, overhead shot, natural lighting, styled plate, restaurant quality",
        "example": "Professional food photography of spaghetti carbonara, overhead shot, natural lighting, styled plate, restaurant quality",
        "tags": ["food", "photography", "commercial"],
    },
    {
        "id": "fashion",
        "name": "Fashion",
        "category": "fashion",
        "template": "Fashion photography of {subject}, editorial style, high-end fashion magazine, dramatic lighting, vogue",
        "example": "Fashion photography of a model in a red evening gown, editorial style, high-end fashion magazine, dramatic lighting, vogue",
        "tags": ["fashion", "editorial", "photography"],
    },
    {
        "id": "interior_design",
        "name": "Interior Design",
        "category": "interior",
        "template": "Interior design render of {room}, {style} style, natural lighting, architectural visualization, photorealistic",
        "example": "Interior design render of a living room, Scandinavian style, natural lighting, architectural visualization, photorealistic",
        "tags": ["interior", "design", "architecture"],
    },
]

# ─── Random prompt components ─────────────────────────────────────────────────

SUBJECTS = [
    "a futuristic city skyline at sunset",
    "an ancient forest with glowing mushrooms",
    "a cozy coffee shop in autumn rain",
    "a lone astronaut on an alien planet",
    "a majestic dragon perched on a mountain",
    "a vintage bookshop in Paris",
    "an underwater coral reef city",
    "a steam-powered flying machine",
    "a mystical library floating in clouds",
    "a neon-lit cyberpunk marketplace",
    "a serene Japanese zen garden in snow",
    "a medieval castle at golden hour",
    "an art deco hotel lobby",
    "a time traveler's workshop",
    "a magical forest with floating lanterns",
]

MOODS = ["dramatic", "ethereal", "cozy", "epic", "mysterious", "vibrant", "serene", "dystopian", "whimsical"]
LIGHTING = ["golden hour", "blue hour", "dramatic shadows", "soft diffused light", "neon glow", "candlelight", "moonlight"]
DETAILS = ["ultra detailed", "8k resolution", "sharp focus", "professional quality", "award-winning", "masterpiece"]

STYLE_TO_ASPECT: dict[str, AspectRatio] = {
    "photorealistic": "16:9",
    "digital_art": "1:1",
    "cinematic": "16:9",
    "anime": "9:16",
    "minimalist": "1:1",
    "cyberpunk": "16:9",
    "fantasy": "1:1",
    "none": "1:1",
}


# ─── Service functions ────────────────────────────────────────────────────────

async def enhance_prompt(
    prompt: str,
    style: Optional[StylePreset] = None,
) -> str:
    """
    Use OpenAI GPT to enhance a basic prompt into a detailed generation prompt.
    Falls back to rule-based enhancement if OpenAI is not configured.
    """
    if settings.OPENAI_API_KEY:
        client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        style_hint = f" The image should be in {style.replace('_', ' ')} style." if style and style != "none" else ""

        system = (
            "You are an expert AI image generation prompt engineer. "
            "Your task is to enhance a basic prompt into a detailed, "
            "high-quality image generation prompt. "
            "Keep it under 200 words. "
            "Include: subject details, lighting, atmosphere, camera/perspective, quality tags. "
            "Return ONLY the enhanced prompt, no explanation."
        )
        user_msg = f"Enhance this prompt for AI image generation:{style_hint}\n\n{prompt}"

        resp = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": user_msg},
            ],
            max_tokens=300,
            temperature=0.7,
        )
        return resp.choices[0].message.content.strip()

    # Rule-based fallback
    additions = ["highly detailed", "professional quality", "sharp focus", "8k resolution"]
    if style and style != "none":
        style_str = style.replace("_", " ")
        additions.append(f"{style_str} style")
    return f"{prompt}, {', '.join(additions)}"


def get_prompt_templates() -> List[PromptTemplate]:
    return [PromptTemplate(**t) for t in PROMPT_TEMPLATES]


def generate_random_prompt() -> RandomPromptResponse:
    """Generate a creative random prompt."""
    subject = random.choice(SUBJECTS)
    mood = random.choice(MOODS)
    lighting = random.choice(LIGHTING)
    detail = random.choice(DETAILS)
    style_name = random.choice([
        "photorealistic", "digital_art", "cinematic", "fantasy",
        "cyberpunk", "oil_painting", "watercolor", "anime",
    ])
    style: StylePreset = style_name  # type: ignore

    prompt = f"{subject}, {mood} mood, {lighting}, {detail}"
    aspect: AspectRatio = STYLE_TO_ASPECT.get(style, "1:1")

    return RandomPromptResponse(
        prompt=prompt,
        suggested_style=style,
        suggested_aspect_ratio=aspect,
    )