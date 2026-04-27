"""
Gallery router.
GET    /api/gallery                    – list (search, filter, paginate)
GET    /api/gallery/{id}               – image detail
DELETE /api/gallery/{id}               – delete image
POST   /api/gallery/{id}/favorite      – toggle favorite
POST   /api/gallery/{id}/tags          – set tags
GET    /api/gallery/{id}/download      – download (format conversion)
GET    /api/collections                – list user collections
POST   /api/collections                – create collection
POST   /api/collections/{id}/add       – add images to collection
GET    /api/collections/{id}/download  – batch download as ZIP
GET    /api/history                    – generation history with prompts
"""
from __future__ import annotations

import io
import zipfile
from typing import List, Optional

import httpx
from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import and_, delete, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_current_user
from app.models.database import (
    Collection,
    Image as ImageModel,
    ImageCollection,
    User,
    get_db,
)
from app.models.schemas import (
    AddImagesToCollection,
    CollectionCreate,
    CollectionOut,
    FavoriteResponse,
    ImageListResponse,
    ImageOut,
    MessageResponse,
    TagsRequest,
)
from app.services.image_processor import convert_format
from app.services.storage import delete_image

router = APIRouter(prefix="/api", tags=["gallery"])


# ─── Gallery list ─────────────────────────────────────────────────────────────

@router.get("/gallery", response_model=ImageListResponse, summary="List gallery images")
async def list_gallery(
    search: Optional[str] = Query(None, description="Search in prompt / tags"),
    style: Optional[str] = Query(None),
    operation: Optional[str] = Query(None),
    is_favorite: Optional[bool] = Query(None),
    aspect_ratio: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ImageListResponse:
    filters = [ImageModel.user_id == current_user.id]

    if search:
        filters.append(
            or_(
                ImageModel.prompt.ilike(f"%{search}%"),
                ImageModel.tags.ilike(f"%{search}%"),
                ImageModel.negative_prompt.ilike(f"%{search}%"),
            )
        )
    if style:
        filters.append(ImageModel.style == style)
    if operation:
        filters.append(ImageModel.operation == operation)
    if is_favorite is not None:
        filters.append(ImageModel.is_favorite == is_favorite)
    if aspect_ratio:
        filters.append(ImageModel.aspect_ratio == aspect_ratio)

    # Count
    count_q = select(func.count()).where(and_(*filters))
    total = (await db.execute(count_q)).scalar_one()

    # Fetch page
    offset = (page - 1) * page_size
    q = (
        select(ImageModel)
        .where(and_(*filters))
        .order_by(ImageModel.created_at.desc())
        .offset(offset)
        .limit(page_size)
    )
    rows = (await db.execute(q)).scalars().all()

    return ImageListResponse(
        items=[ImageOut.model_validate(r) for r in rows],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=(total + page_size - 1) // page_size,
    )


# ─── Image detail ─────────────────────────────────────────────────────────────

@router.get("/gallery/{image_id}", response_model=ImageOut, summary="Get image details")
async def get_image(
    image_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ImageOut:
    img = await _get_owned_image(db, image_id, current_user.id)
    return ImageOut.model_validate(img)


# ─── Delete ───────────────────────────────────────────────────────────────────

@router.delete(
    "/gallery/{image_id}",
    response_model=MessageResponse,
    summary="Delete an image",
)
async def delete_gallery_image(
    image_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> MessageResponse:
    img = await _get_owned_image(db, image_id, current_user.id)

    # Remove from Cloudinary
    if img.cloudinary_public_id:
        await delete_image(img.cloudinary_public_id)

    await db.delete(img)
    return MessageResponse(message="Image deleted successfully")


# ─── Favorite toggle ──────────────────────────────────────────────────────────

@router.post(
    "/gallery/{image_id}/favorite",
    response_model=FavoriteResponse,
    summary="Toggle image favorite status",
)
async def toggle_favorite(
    image_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> FavoriteResponse:
    img = await _get_owned_image(db, image_id, current_user.id)
    img.is_favorite = not img.is_favorite
    await db.flush()
    return FavoriteResponse(id=img.id, is_favorite=img.is_favorite)


# ─── Tags ─────────────────────────────────────────────────────────────────────

@router.post(
    "/gallery/{image_id}/tags",
    response_model=ImageOut,
    summary="Set tags on an image",
)
async def set_tags(
    image_id: str,
    payload: TagsRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ImageOut:
    img = await _get_owned_image(db, image_id, current_user.id)
    img.tags = ",".join(t.strip().lower() for t in payload.tags if t.strip())
    await db.flush()
    return ImageOut.model_validate(img)


# ─── Download ─────────────────────────────────────────────────────────────────

@router.get("/gallery/{image_id}/download", summary="Download image in chosen format")
async def download_image(
    image_id: str,
    format: str = Query("png", pattern="^(png|jpeg|webp)$"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Response:
    img = await _get_owned_image(db, image_id, current_user.id)

    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.get(img.image_url)
        if resp.status_code != 200:
            raise HTTPException(status_code=502, detail="Could not fetch image from storage")
        image_bytes = resp.content

    converted = convert_format(image_bytes, target_format=format)

    mime_map = {"png": "image/png", "jpeg": "image/jpeg", "webp": "image/webp"}
    return Response(
        content=converted,
        media_type=mime_map[format],
        headers={"Content-Disposition": f'attachment; filename="image_{image_id[:8]}.{format}"'},
    )


# ─── History ─────────────────────────────────────────────────────────────────

@router.get("/history", response_model=ImageListResponse, summary="Generation history")
async def generation_history(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ImageListResponse:
    return await list_gallery(
        search=None,
        style=None,
        operation=None,
        is_favorite=None,
        aspect_ratio=None,
        page=page,
        page_size=page_size,
        current_user=current_user,
        db=db,
    )


# ─── Collections ─────────────────────────────────────────────────────────────

@router.get("/collections", response_model=List[CollectionOut], summary="List collections")
async def list_collections(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[CollectionOut]:
    q = (
        select(Collection)
        .where(Collection.user_id == current_user.id)
        .order_by(Collection.created_at.desc())
    )
    collections = (await db.execute(q)).scalars().all()

    result = []
    for col in collections:
        count_q = select(func.count()).where(ImageCollection.collection_id == col.id)
        count = (await db.execute(count_q)).scalar_one()
        col_out = CollectionOut.model_validate(col)
        col_out.image_count = count
        result.append(col_out)
    return result


@router.post(
    "/collections",
    response_model=CollectionOut,
    status_code=status.HTTP_201_CREATED,
    summary="Create a collection",
)
async def create_collection(
    payload: CollectionCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> CollectionOut:
    existing = await db.execute(
        select(Collection).where(
            and_(
                Collection.user_id == current_user.id,
                Collection.name == payload.name,
            )
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Collection with this name already exists")

    col = Collection(
        user_id=current_user.id,
        name=payload.name,
        description=payload.description,
    )
    db.add(col)
    await db.flush()
    await db.refresh(col)

    out = CollectionOut.model_validate(col)
    out.image_count = 0
    return out


@router.post(
    "/collections/{collection_id}/add",
    response_model=MessageResponse,
    summary="Add images to a collection",
)
async def add_to_collection(
    collection_id: str,
    payload: AddImagesToCollection,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> MessageResponse:
    col = await _get_owned_collection(db, collection_id, current_user.id)

    added = 0
    for img_id in payload.image_ids:
        # Check image belongs to user
        img_q = await db.execute(
            select(ImageModel).where(
                and_(ImageModel.id == img_id, ImageModel.user_id == current_user.id)
            )
        )
        if not img_q.scalar_one_or_none():
            continue

        # Check not already in collection
        exists = await db.execute(
            select(ImageCollection).where(
                and_(
                    ImageCollection.image_id == img_id,
                    ImageCollection.collection_id == collection_id,
                )
            )
        )
        if exists.scalar_one_or_none():
            continue

        link = ImageCollection(image_id=img_id, collection_id=collection_id)
        db.add(link)
        added += 1

    await db.flush()
    return MessageResponse(message=f"Added {added} image(s) to collection")


@router.get(
    "/collections/{collection_id}/download",
    summary="Download all collection images as ZIP",
)
async def download_collection_zip(
    collection_id: str,
    format: str = Query("png", pattern="^(png|jpeg|webp)$"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Response:
    col = await _get_owned_collection(db, collection_id, current_user.id)

    # Get all images in collection
    q = (
        select(ImageModel)
        .join(ImageCollection, ImageCollection.image_id == ImageModel.id)
        .where(ImageCollection.collection_id == collection_id)
    )
    images = (await db.execute(q)).scalars().all()

    if not images:
        raise HTTPException(status_code=404, detail="Collection is empty")

    zip_buffer = io.BytesIO()
    async with httpx.AsyncClient(timeout=60) as client:
        with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zf:
            for idx, img in enumerate(images):
                try:
                    resp = await client.get(img.image_url)
                    if resp.status_code != 200:
                        continue
                    converted = convert_format(resp.content, target_format=format)
                    filename = f"image_{idx + 1:03d}_{img.id[:8]}.{format}"
                    zf.writestr(filename, converted)
                except Exception:
                    continue

    zip_bytes = zip_buffer.getvalue()
    safe_name = col.name.replace(" ", "_")[:40]

    return Response(
        content=zip_bytes,
        media_type="application/zip",
        headers={
            "Content-Disposition": f'attachment; filename="{safe_name}_collection.zip"'
        },
    )


# ─── Helpers ──────────────────────────────────────────────────────────────────

async def _get_owned_image(db: AsyncSession, image_id: str, user_id: str) -> ImageModel:
    q = await db.execute(
        select(ImageModel).where(
            and_(ImageModel.id == image_id, ImageModel.user_id == user_id)
        )
    )
    img = q.scalar_one_or_none()
    if not img:
        raise HTTPException(status_code=404, detail="Image not found")
    return img


async def _get_owned_collection(
    db: AsyncSession, collection_id: str, user_id: str
) -> Collection:
    q = await db.execute(
        select(Collection).where(
            and_(Collection.id == collection_id, Collection.user_id == user_id)
        )
    )
    col = q.scalar_one_or_none()
    if not col:
        raise HTTPException(status_code=404, detail="Collection not found")
    return col