"""
Pydantic v2 schemas for all request bodies and response models.
"""
from __future__ import annotations

from datetime import datetime
from typing import List, Literal, Optional
from pydantic import BaseModel, EmailStr, Field, field_validator


# ─── Auth ─────────────────────────────────────────────────────────────────────

class UserRegister(BaseModel):
    username: str = Field(
        ...,
        min_length=3,
        max_length=50,
        pattern=r"^[a-zA-Z0-9_ ]+$",
    )
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)

    @field_validator("username")
    @classmethod
    def normalize_username(cls, value: str) -> str:
        return value.strip()


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: str
    username: str
    email: str
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class TokenData(BaseModel):
    user_id: Optional[str] = None


# ─── Image Generation ─────────────────────────────────────────────────────────

AspectRatio = Literal["1:1", "16:9", "9:16", "4:3", "3:2", "2:3"]
Quality = Literal["draft", "standard", "hd", "ultra"]
StylePreset = Literal[
    "photorealistic", "digital_art", "oil_painting", "watercolor",
    "anime", "3d_render", "pixel_art", "comic_book", "minimalist",
    "cinematic", "sketch", "pop_art", "art_nouveau", "cyberpunk",
    "fantasy", "none",
]

ASPECT_RATIO_SIZES: dict[str, tuple[int, int]] = {
    "1:1":  (1024, 1024),
    "16:9": (1792, 1024),
    "9:16": (1024, 1792),
    "4:3":  (1365, 1024),
    "3:2":  (1536, 1024),
    "2:3":  (1024, 1536),
}


class GenerateRequest(BaseModel):
    prompt: str = Field(..., min_length=1, max_length=4000)
    negative_prompt: Optional[str] = Field(None, max_length=1000)
    style: StylePreset = "none"
    aspect_ratio: AspectRatio = "1:1"
    quality: Quality = "standard"
    batch: int = Field(1, ge=1, le=4)
    seed: Optional[int] = None


class GenerateBatchRequest(GenerateRequest):
    batch: int = Field(4, ge=1, le=8)


class Img2ImgRequest(BaseModel):
    source_image_url: str = Field(..., description="Cloudinary URL of reference image")
    prompt: str = Field(..., min_length=1, max_length=4000)
    negative_prompt: Optional[str] = None
    style: StylePreset = "none"
    strength: float = Field(0.75, ge=0.0, le=1.0)
    aspect_ratio: AspectRatio = "1:1"
    quality: Quality = "standard"


class VariationRequest(BaseModel):
    source_image_url: str
    prompt: Optional[str] = None
    negative_prompt: Optional[str] = None
    style: StylePreset = "none"
    count: int = Field(4, ge=1, le=8)


# ─── Image Editing ────────────────────────────────────────────────────────────

class InpaintRequest(BaseModel):
    original_image_url: str = Field(..., description="Cloudinary URL of original image")
    mask_image_url: str = Field(..., description="Cloudinary URL of mask (white=inpaint area)")
    prompt: str = Field(..., min_length=1, max_length=4000)
    negative_prompt: Optional[str] = None
    style: StylePreset = "none"


class OutpaintRequest(BaseModel):
    original_image_url: str
    prompt: Optional[str] = None
    directions: List[Literal["left", "right", "top", "bottom"]] = Field(
        ..., min_length=1
    )
    pixels: int = Field(256, ge=64, le=1024)


class RemoveBgRequest(BaseModel):
    image_url: str = Field(..., description="Cloudinary URL of source image")
    replacement_type: Literal["transparent", "color", "prompt"] = "transparent"
    replacement_color: Optional[str] = Field(None, description="Hex color, e.g. #ffffff")
    replacement_prompt: Optional[str] = Field(None, description="AI-generated background prompt")


class StyleTransferRequest(BaseModel):
    source_image_url: str
    style: StylePreset
    prompt: Optional[str] = None
    strength: float = Field(0.6, ge=0.0, le=1.0)


# ─── Upload ───────────────────────────────────────────────────────────────────

class UploadResponse(BaseModel):
    image_url: str
    thumbnail_url: Optional[str]
    cloudinary_public_id: str
    width: int
    height: int
    format: str
    file_size: int


# ─── Gallery ─────────────────────────────────────────────────────────────────

class ImageOut(BaseModel):
    id: str
    image_url: str
    thumbnail_url: Optional[str]
    prompt: Optional[str]
    negative_prompt: Optional[str]
    style: Optional[str]
    aspect_ratio: Optional[str]
    quality: Optional[str]
    seed: Optional[str]
    provider: Optional[str]
    operation: Optional[str]
    width: Optional[int]
    height: Optional[int]
    file_size: Optional[int]
    format: Optional[str]
    is_favorite: bool
    tags: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}


class ImageListResponse(BaseModel):
    items: List[ImageOut]
    total: int
    page: int
    page_size: int
    total_pages: int


class FavoriteResponse(BaseModel):
    id: str
    is_favorite: bool


class TagsRequest(BaseModel):
    tags: List[str] = Field(..., min_length=1)


# ─── Collections ──────────────────────────────────────────────────────────────

class CollectionCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None


class CollectionOut(BaseModel):
    id: str
    name: str
    description: Optional[str]
    cover_image_url: Optional[str]
    created_at: datetime
    image_count: int = 0

    model_config = {"from_attributes": True}


class AddImagesToCollection(BaseModel):
    image_ids: List[str] = Field(..., min_length=1)


# ─── Prompt ───────────────────────────────────────────────────────────────────

class PromptEnhanceRequest(BaseModel):
    prompt: str = Field(..., min_length=1, max_length=1000)
    style: Optional[StylePreset] = None

    @field_validator("style", mode="before")
    @classmethod
    def normalize_style(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return None
        if isinstance(value, str):
            normalized = value.strip().lower().replace("-", "_").replace(" ", "_")
            return normalized
        return value


class PromptEnhanceResponse(BaseModel):
    original: str
    enhanced: str
    style_applied: Optional[str]


class PromptTemplate(BaseModel):
    id: str
    name: str
    category: str
    template: str
    example: str
    tags: List[str]


class RandomPromptResponse(BaseModel):
    prompt: str
    suggested_style: StylePreset
    suggested_aspect_ratio: AspectRatio


# ─── Generic responses ────────────────────────────────────────────────────────

class MessageResponse(BaseModel):
    message: str


class ErrorResponse(BaseModel):
    detail: str
    code: Optional[str] = None


class GeneratedImageOut(BaseModel):
    """Single generated image with full metadata."""
    id: str
    image_url: str
    thumbnail_url: Optional[str]
    prompt: str
    negative_prompt: Optional[str]
    style: Optional[str]
    aspect_ratio: str
    quality: str
    seed: Optional[str]
    provider: str
    operation: str
    width: int
    height: int
    created_at: datetime

    model_config = {"from_attributes": True}


class GenerationResponse(BaseModel):
    """Response for batch or single generation."""
    images: List[GeneratedImageOut]
    prompt_used: str
    generation_time_seconds: float