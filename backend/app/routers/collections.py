"""
Collections router — full CRUD beyond the gallery router stubs.
GET    /api/collections                  – list user collections
POST   /api/collections                  – create collection
GET    /api/collections/{id}             – get collection + its images
PUT    /api/collections/{id}             – rename / update description
DELETE /api/collections/{id}             – delete collection
POST   /api/collections/{id}/add         – add images
DELETE /api/collections/{id}/remove      – remove images
GET    /api/collections/{id}/download    – batch ZIP download
"""
from __future__ import annotations

import io
import zipfile
from typing import List, Optional

import httpx
from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import and_, func, select
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
    ImageListResponse,
    ImageOut,
    MessageResponse,
)
from app.services.image_processor import convert_format

router = APIRouter(prefix="/api/collections", tags=["collections"])


# ─── List ─────────────────────────────────────────────────────────────────────

@router.get("", response_model=List[CollectionOut], summary="List all collections")
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
        count = (
            await db.execute(
                select(func.count()).where(ImageCollection.collection_id == col.id)
            )
        ).scalar_one()

        # Pick first image as cover if none set
        cover_url = col.cover_image_url
        if not cover_url:
            first_link = (
                await db.execute(
                    select(ImageCollection)
                    .where(ImageCollection.collection_id == col.id)
                    .order_by(ImageCollection.added_at.asc())
                    .limit(1)
                )
            ).scalar_one_or_none()
            if first_link:
                first_img = (
                    await db.execute(
                        select(ImageModel).where(ImageModel.id == first_link.image_id)
                    )
                ).scalar_one_or_none()
                cover_url = first_img.thumbnail_url if first_img else None

        out = CollectionOut.model_validate(col)
        out.image_count = count
        out.cover_image_url = cover_url
        result.append(out)

    return result


# ─── Create ───────────────────────────────────────────────────────────────────

@router.post(
    "",
    response_model=CollectionOut,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new collection",
)
async def create_collection(
    payload: CollectionCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> CollectionOut:
    existing = (
        await db.execute(
            select(Collection).where(
                and_(
                    Collection.user_id == current_user.id,
                    Collection.name == payload.name,
                )
            )
        )
    ).scalar_one_or_none()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A collection with this name already exists",
        )

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


# ─── Detail ───────────────────────────────────────────────────────────────────

@router.get(
    "/{collection_id}",
    response_model=dict,
    summary="Get collection details with paginated images",
)
async def get_collection(
    collection_id: str,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    col = await _get_owned_collection(db, collection_id, current_user.id)

    total = (
        await db.execute(
            select(func.count()).where(ImageCollection.collection_id == collection_id)
        )
    ).scalar_one()

    offset = (page - 1) * page_size
    q = (
        select(ImageModel)
        .join(ImageCollection, ImageCollection.image_id == ImageModel.id)
        .where(ImageCollection.collection_id == collection_id)
        .order_by(ImageCollection.added_at.desc())
        .offset(offset)
        .limit(page_size)
    )
    images = (await db.execute(q)).scalars().all()

    return {
        "collection": CollectionOut.model_validate(col),
        "images": [ImageOut.model_validate(img) for img in images],
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size,
    }


# ─── Update ───────────────────────────────────────────────────────────────────

@router.put(
    "/{collection_id}",
    response_model=CollectionOut,
    summary="Rename or update collection description",
)
async def update_collection(
    collection_id: str,
    payload: CollectionCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> CollectionOut:
    col = await _get_owned_collection(db, collection_id, current_user.id)

    # Check name conflict (different collection same name)
    name_conflict = (
        await db.execute(
            select(Collection).where(
                and_(
                    Collection.user_id == current_user.id,
                    Collection.name == payload.name,
                    Collection.id != collection_id,
                )
            )
        )
    ).scalar_one_or_none()

    if name_conflict:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Another collection with this name already exists",
        )

    col.name = payload.name
    if payload.description is not None:
        col.description = payload.description

    await db.flush()
    await db.refresh(col)

    count = (
        await db.execute(
            select(func.count()).where(ImageCollection.collection_id == col.id)
        )
    ).scalar_one()

    out = CollectionOut.model_validate(col)
    out.image_count = count
    return out


# ─── Delete ───────────────────────────────────────────────────────────────────

@router.delete(
    "/{collection_id}",
    response_model=MessageResponse,
    summary="Delete a collection (images are NOT deleted)",
)
async def delete_collection(
    collection_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> MessageResponse:
    col = await _get_owned_collection(db, collection_id, current_user.id)
    await db.delete(col)
    return MessageResponse(message="Collection deleted successfully")


# ─── Add images ───────────────────────────────────────────────────────────────

@router.post(
    "/{collection_id}/add",
    response_model=MessageResponse,
    summary="Add images to collection",
)
async def add_images(
    collection_id: str,
    payload: AddImagesToCollection,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> MessageResponse:
    await _get_owned_collection(db, collection_id, current_user.id)

    added = 0
    for img_id in payload.image_ids:
        owns = (
            await db.execute(
                select(ImageModel).where(
                    and_(
                        ImageModel.id == img_id,
                        ImageModel.user_id == current_user.id,
                    )
                )
            )
        ).scalar_one_or_none()
        if not owns:
            continue

        already = (
            await db.execute(
                select(ImageCollection).where(
                    and_(
                        ImageCollection.image_id == img_id,
                        ImageCollection.collection_id == collection_id,
                    )
                )
            )
        ).scalar_one_or_none()
        if already:
            continue

        db.add(ImageCollection(image_id=img_id, collection_id=collection_id))
        added += 1

    await db.flush()
    return MessageResponse(message=f"Added {added} image(s) to collection")


# ─── Remove images ────────────────────────────────────────────────────────────

@router.delete(
    "/{collection_id}/remove",
    response_model=MessageResponse,
    summary="Remove images from collection",
)
async def remove_images(
    collection_id: str,
    payload: AddImagesToCollection,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> MessageResponse:
    await _get_owned_collection(db, collection_id, current_user.id)

    removed = 0
    for img_id in payload.image_ids:
        link = (
            await db.execute(
                select(ImageCollection).where(
                    and_(
                        ImageCollection.image_id == img_id,
                        ImageCollection.collection_id == collection_id,
                    )
                )
            )
        ).scalar_one_or_none()
        if link:
            await db.delete(link)
            removed += 1

    await db.flush()
    return MessageResponse(message=f"Removed {removed} image(s) from collection")


# ─── ZIP download ─────────────────────────────────────────────────────────────

@router.get(
    "/{collection_id}/download",
    summary="Download all collection images as ZIP",
)
async def download_collection(
    collection_id: str,
    format: str = Query("png", pattern="^(png|jpeg|webp)$"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Response:
    col = await _get_owned_collection(db, collection_id, current_user.id)

    q = (
        select(ImageModel)
        .join(ImageCollection, ImageCollection.image_id == ImageModel.id)
        .where(ImageCollection.collection_id == collection_id)
        .order_by(ImageCollection.added_at.asc())
    )
    images = (await db.execute(q)).scalars().all()

    if not images:
        raise HTTPException(status_code=404, detail="Collection is empty")

    zip_buf = io.BytesIO()
    async with httpx.AsyncClient(timeout=60) as client:
        with zipfile.ZipFile(zip_buf, "w", zipfile.ZIP_DEFLATED) as zf:
            for idx, img in enumerate(images, start=1):
                try:
                    resp = await client.get(img.image_url)
                    if resp.status_code != 200:
                        continue
                    converted = convert_format(resp.content, target_format=format)
                    filename = f"{idx:03d}_{img.id[:8]}.{format}"
                    zf.writestr(filename, converted)
                except Exception:
                    continue

    safe = col.name.replace(" ", "_")[:40]
    return Response(
        content=zip_buf.getvalue(),
        media_type="application/zip",
        headers={"Content-Disposition": f'attachment; filename="{safe}.zip"'},
    )


# ─── Helpers ──────────────────────────────────────────────────────────────────

async def _get_owned_collection(
    db: AsyncSession, collection_id: str, user_id: str
) -> Collection:
    col = (
        await db.execute(
            select(Collection).where(
                and_(
                    Collection.id == collection_id,
                    Collection.user_id == user_id,
                )
            )
        )
    ).scalar_one_or_none()
    if not col:
        raise HTTPException(status_code=404, detail="Collection not found")
    return col