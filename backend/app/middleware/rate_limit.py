"""
Simple in-memory rate limiter middleware (no Redis required).
Uses a sliding-window counter per IP address.

Configuration via environment:
  RATE_LIMIT_REQUESTS  – max requests per window (default 60)
  RATE_LIMIT_WINDOW    – window in seconds (default 60)

AI generation endpoints get a tighter limit automatically.
"""
from __future__ import annotations

import time
from collections import defaultdict, deque
from typing import Callable

from fastapi import Request, Response, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

import os

# Default limits
DEFAULT_LIMIT = int(os.getenv("RATE_LIMIT_REQUESTS", "60"))
DEFAULT_WINDOW = int(os.getenv("RATE_LIMIT_WINDOW", "60"))

# Tighter limit for AI endpoints (expensive calls)
AI_LIMIT = int(os.getenv("AI_RATE_LIMIT_REQUESTS", "15"))
AI_WINDOW = int(os.getenv("AI_RATE_LIMIT_WINDOW", "60"))

AI_PREFIXES = ("/api/generate", "/api/edit/inpaint", "/api/edit/outpaint",
               "/api/edit/remove-bg", "/api/edit/img2img", "/api/edit/style-transfer")


class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, limit: int = DEFAULT_LIMIT, window: int = DEFAULT_WINDOW):
        super().__init__(app)
        self._limit = limit
        self._window = window
        self._ai_limit = AI_LIMIT
        self._ai_window = AI_WINDOW
        # ip -> deque of timestamps
        self._counters: dict[str, deque] = defaultdict(deque)
        self._ai_counters: dict[str, deque] = defaultdict(deque)

    def _get_ip(self, request: Request) -> str:
        forwarded = request.headers.get("x-forwarded-for")
        if forwarded:
            return forwarded.split(",")[0].strip()
        return request.client.host if request.client else "unknown"

    def _is_allowed(
        self, counters: dict, ip: str, limit: int, window: int
    ) -> tuple[bool, int]:
        """Returns (allowed, retry_after_seconds)."""
        now = time.time()
        timestamps = counters[ip]

        # Evict expired
        while timestamps and timestamps[0] < now - window:
            timestamps.popleft()

        if len(timestamps) >= limit:
            retry_after = int(window - (now - timestamps[0])) + 1
            return False, retry_after

        timestamps.append(now)
        return True, 0

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Skip rate-limiting for non-API paths (docs, health)
        path = request.url.path
        if not path.startswith("/api"):
            return await call_next(request)

        ip = self._get_ip(request)

        # AI endpoint check (tighter window)
        if any(path.startswith(prefix) for prefix in AI_PREFIXES):
            allowed, retry = self._is_allowed(
                self._ai_counters, ip, self._ai_limit, self._ai_window
            )
            if not allowed:
                return JSONResponse(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    content={
                        "detail": f"AI rate limit exceeded. Retry after {retry}s.",
                        "retry_after": retry,
                    },
                    headers={"Retry-After": str(retry)},
                )

        # General API check
        allowed, retry = self._is_allowed(
            self._counters, ip, self._limit, self._window
        )
        if not allowed:
            return JSONResponse(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                content={
                    "detail": f"Rate limit exceeded. Retry after {retry}s.",
                    "retry_after": retry,
                },
                headers={"Retry-After": str(retry)},
            )

        return await call_next(request)