from contextlib import asynccontextmanager
from typing import AsyncGenerator
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.config import settings
from app.middleware.logging import LoggingMiddleware, setup_logging
from app.middleware.rate_limit import RateLimitMiddleware
from app.models.database import create_all_tables, verify_database_connection
from app.routers import auth, collections, download, edit, gallery, generate, prompt, upload

@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator:
    setup_logging(debug=settings.DEBUG)
    import logging
    log = logging.getLogger("ai_studio")
    log.info("Starting %s [%s]", settings.APP_NAME, settings.APP_ENV)
    log.info("CORS origins: %s", settings.cors_origins)
    log.info("AI provider: %s", settings.active_ai_provider)
    try:
        log.info("BG removal: %s", settings.bg_removal_provider)
    except RuntimeError:
        log.warning("BG removal: NOT CONFIGURED")
    try:
        await verify_database_connection()
        log.info("Database connected successfully")
    except RuntimeError as exc:
        log.error(str(exc))
        raise
    if settings.APP_ENV in ("development", "test"):
        await create_all_tables()
    yield

app = FastAPI(
    title=settings.APP_NAME,
    description="AI Image Generation & Editing Studio API",
    version="1.0.0",
    docs_url="/docs" if not settings.is_production else None,
    redoc_url="/redoc" if not settings.is_production else None,
    lifespan=lifespan,
)

app.add_middleware(CORSMiddleware, allow_origins=settings.cors_origins,
    allow_credentials=True, allow_methods=["*"], allow_headers=["*"],
    expose_headers=["X-Request-ID", "X-Response-Time"])
app.add_middleware(RateLimitMiddleware)
app.add_middleware(LoggingMiddleware)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    import logging, traceback
    logging.getLogger("ai_studio").error("Unhandled: %s %s: %s", request.method, request.url.path, exc, exc_info=True)
    if settings.DEBUG:
        return JSONResponse(status_code=500, content={"detail": str(exc), "traceback": traceback.format_exc()})
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})

app.include_router(auth.router)
app.include_router(generate.router)
app.include_router(edit.router)
app.include_router(upload.router)
app.include_router(gallery.router)
app.include_router(collections.router)
app.include_router(download.router)
app.include_router(prompt.router)

@app.get("/health", tags=["health"])
async def health_check() -> dict:
    return {"status": "ok", "app": settings.APP_NAME, "env": settings.APP_ENV, "ai_provider": settings.active_ai_provider}

@app.get("/", include_in_schema=False)
async def root() -> dict:
    return {"message": f"Welcome to {settings.APP_NAME} API", "docs": "/docs"}
