from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List, Optional


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    # ── App ──────────────────────────────────────────────────────────────────
    APP_NAME: str = "AI Image Studio"
    APP_ENV: str = "development"
    DEBUG: bool = True

    # ── Security ─────────────────────────────────────────────────────────────
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # ── Database ─────────────────────────────────────────────────────────────
    DATABASE_URL: str  # must start with postgresql+asyncpg://

    # ── Cloudinary ───────────────────────────────────────────────────────────
    CLOUDINARY_CLOUD_NAME: str
    CLOUDINARY_API_KEY: str
    CLOUDINARY_API_SECRET: str

    # ── AI providers ─────────────────────────────────────────────────────────
    OPENAI_API_KEY: Optional[str] = None
    STABILITY_API_KEY: Optional[str] = None
    STABILITY_API_HOST: str = "https://api.stability.ai"

    # ── Background Removal ───────────────────────────────────────────────────
    REMOVE_BG_API_KEY: Optional[str] = None
    CLIPDROP_API_KEY: Optional[str] = None

    # ── CORS ─────────────────────────────────────────────────────────────────
    ALLOWED_ORIGINS: str 

    @property
    def cors_origins(self) -> List[str]:
        
        origins: List[str] = []
        for origin in self.ALLOWED_ORIGINS.split(","):
            normalized = origin.strip().rstrip("/")
            if normalized:
                origins.append(normalized)
        return origins

    @property
    def is_production(self) -> bool:
        return self.APP_ENV == "production"

    @property
    def active_ai_provider(self) -> str:
        """Return which AI provider is configured (openai takes priority)."""
        if self.OPENAI_API_KEY:
            return "openai"
        if self.STABILITY_API_KEY:
            return "stability"
        raise RuntimeError(
            "No AI provider configured. Set OPENAI_API_KEY or STABILITY_API_KEY in .env"
        )

    @property
    def bg_removal_provider(self) -> str:
        """Return which background removal provider is configured."""
        if self.REMOVE_BG_API_KEY:
            return "removebg"
        if self.CLIPDROP_API_KEY:
            return "clipdrop"
        raise RuntimeError(
            "No background removal API configured. Set REMOVE_BG_API_KEY or CLIPDROP_API_KEY in .env"
        )


# Singleton – import this everywhere
settings = Settings()
