"""
SQLAlchemy async ORM models + engine setup.
Tables: users, images, prompt_history, collections, image_collections
"""
from __future__ import annotations

import asyncio
import uuid
from datetime import datetime
from pathlib import Path

from alembic import command
from alembic.config import Config
from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
    func,
    text,
)
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase, relationship

from app.config import settings

# ─── Engine & session factory ────────────────────────────────────────────────

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
    autocommit=False,
)


# ─── Base ─────────────────────────────────────────────────────────────────────

class Base(DeclarativeBase):
    pass


# ─── Helpers ──────────────────────────────────────────────────────────────────

def _uuid() -> str:
    return str(uuid.uuid4())


# ─── Tables ───────────────────────────────────────────────────────────────────

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=False), primary_key=True, default=_uuid)
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # relationships
    images = relationship("Image", back_populates="user", cascade="all, delete-orphan")
    prompt_history = relationship("PromptHistory", back_populates="user", cascade="all, delete-orphan")
    collections = relationship("Collection", back_populates="user", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<User id={self.id} username={self.username}>"


class Image(Base):
    __tablename__ = "images"

    id = Column(UUID(as_uuid=False), primary_key=True, default=_uuid)
    user_id = Column(UUID(as_uuid=False), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    # Cloudinary URLs (never local paths)
    image_url = Column(String(1024), nullable=False)
    thumbnail_url = Column(String(1024), nullable=True)
    cloudinary_public_id = Column(String(512), nullable=True)

    # Generation metadata
    prompt = Column(Text, nullable=True)
    negative_prompt = Column(Text, nullable=True)
    style = Column(String(100), nullable=True)
    aspect_ratio = Column(String(20), nullable=True, default="1:1")
    quality = Column(String(20), nullable=True, default="standard")
    seed = Column(String(50), nullable=True)
    provider = Column(String(50), nullable=True)          # openai | stability
    operation = Column(String(50), nullable=True)         # generate | inpaint | remove_bg | img2img | outpaint
    model_used = Column(String(100), nullable=True)

    # File info
    width = Column(Integer, nullable=True)
    height = Column(Integer, nullable=True)
    file_size = Column(Integer, nullable=True)           # bytes
    format = Column(String(10), nullable=True)           # png | jpeg | webp

    # User management
    is_favorite = Column(Boolean, default=False, nullable=False)
    tags = Column(Text, nullable=True)                   # comma-separated

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # relationships
    user = relationship("User", back_populates="images")
    collection_links = relationship(
        "ImageCollection", back_populates="image", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Image id={self.id} operation={self.operation}>"


class PromptHistory(Base):
    __tablename__ = "prompt_history"

    id = Column(UUID(as_uuid=False), primary_key=True, default=_uuid)
    user_id = Column(UUID(as_uuid=False), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    prompt = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)

    user = relationship("User", back_populates="prompt_history")

    def __repr__(self) -> str:
        return f"<PromptHistory id={self.id} user_id={self.user_id}>"


class Collection(Base):
    __tablename__ = "collections"

    id = Column(UUID(as_uuid=False), primary_key=True, default=_uuid)
    user_id = Column(UUID(as_uuid=False), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    cover_image_url = Column(String(1024), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    __table_args__ = (
        UniqueConstraint("user_id", "name", name="uq_collection_user_name"),
    )

    # relationships
    user = relationship("User", back_populates="collections")
    image_links = relationship(
        "ImageCollection", back_populates="collection", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Collection id={self.id} name={self.name}>"


class ImageCollection(Base):
    """Many-to-many: images ↔ collections."""
    __tablename__ = "image_collections"

    id = Column(UUID(as_uuid=False), primary_key=True, default=_uuid)
    image_id = Column(UUID(as_uuid=False), ForeignKey("images.id", ondelete="CASCADE"), nullable=False)
    collection_id = Column(UUID(as_uuid=False), ForeignKey("collections.id", ondelete="CASCADE"), nullable=False)
    added_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    __table_args__ = (
        UniqueConstraint("image_id", "collection_id", name="uq_image_collection"),
    )

    # relationships
    image = relationship("Image", back_populates="collection_links")
    collection = relationship("Collection", back_populates="image_links")


# ─── DB lifecycle helpers ─────────────────────────────────────────────────────

async def create_all_tables() -> None:
    """Create all tables (use only in dev; use Alembic in production)."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def run_database_migrations() -> None:
    """Apply Alembic migrations to the current database."""
    backend_dir = Path(__file__).resolve().parents[2]
    alembic_ini = backend_dir / "alembic.ini"
    alembic_dir = backend_dir / "alembic"

    def _upgrade() -> None:
        config = Config(str(alembic_ini))
        config.set_main_option("script_location", str(alembic_dir))
        config.set_main_option("sqlalchemy.url", settings.DATABASE_URL)
        command.upgrade(config, "head")

    await asyncio.to_thread(_upgrade)


async def verify_database_connection() -> None:
    """Check DB connectivity with a lightweight query."""
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
    except SQLAlchemyError as exc:
        raise RuntimeError(f"Database connection failed: {exc}") from exc


async def drop_all_tables() -> None:
    """Drop all tables (dev / test teardown only)."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


async def get_db() -> AsyncSession:  # type: ignore[return]
    """FastAPI dependency: yields an async DB session."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
