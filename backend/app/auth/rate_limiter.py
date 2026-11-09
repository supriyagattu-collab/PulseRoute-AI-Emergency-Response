"""
Rate Limiter for PulseRoute Sensitive Endpoints (Milestone 10.1).

Provides:
- Thread-safe sliding window rate limiting per IP / key.
- Production-ready interface extensible for Redis distributed caching.
- HTTP 429 Too Many Requests response with standard Retry-After and X-RateLimit headers.
- Dispatcher/Admin call center exemption for public SOS rate limiting.
"""
import time
import threading
from collections import defaultdict, deque
from typing import Dict, Deque
from fastapi import Request, HTTPException, status
from app.config import settings


class InMemorySlidingWindowLimiter:
    """
    Thread-safe in-memory sliding window rate limiter.
    Note: For multi-instance horizontal scaling, connect a Redis backend.
    """
    def __init__(self):
        self._lock = threading.Lock()
        # Storage: key -> deque of timestamps (seconds)
        self._hits: Dict[str, Deque[float]] = defaultdict(deque)

    def is_rate_limited(self, key: str, max_requests: int, window_seconds: int) -> tuple[bool, int, int]:
        """
        Check if request exceeds rate limit.
        Returns: (is_limited, remaining, retry_after)
        """
        now = time.time()
        window_start = now - window_seconds

        with self._lock:
            timestamps = self._hits[key]
            # Prune timestamps older than window
            while timestamps and timestamps[0] <= window_start:
                timestamps.popleft()

            current_count = len(timestamps)
            if current_count >= max_requests:
                earliest = timestamps[0]
                retry_after = max(1, int(earliest + window_seconds - now))
                return True, 0, retry_after

            # Record this hit
            timestamps.append(now)
            remaining = max_requests - len(timestamps)
            return False, remaining, 0

    def reset(self):
        """Reset all rate limiter state (useful for test isolation)."""
        with self._lock:
            self._hits.clear()


limiter = InMemorySlidingWindowLimiter()


def get_client_ip(request: Request) -> str:
    """
    Extract client IP, taking X-Forwarded-For into account if behind reverse proxy.
    """
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    if request.client:
        return request.client.host
    return "127.0.0.1"


def rate_limit_sos(request: Request):
    """
    FastAPI dependency for SOS emergency creation:
    Limits to settings.RATE_LIMIT_SOS_PER_MINUTE (default: 5) requests/minute/IP
    for public/citizen reports. Authorized ADMIN and DISPATCHER roles are exempt.
    """
    if not settings.RATE_LIMIT_ENABLED:
        return

    # Check if request is authenticated as ADMIN or DISPATCHER
    auth_header = request.headers.get("authorization") or request.headers.get("Authorization")
    if auth_header and auth_header.lower().startswith("bearer "):
        try:
            from app.auth.jwt import decode_access_token
            token = auth_header.split(" ", 1)[1].strip()
            payload = decode_access_token(token)
            if str(payload.get("role", "")).upper() in {"ADMIN", "DISPATCHER"}:
                return  # Exempt dispatch call-center operators
        except Exception:
            pass

    client_ip = get_client_ip(request)
    key = f"sos:{client_ip}"
    max_reqs = settings.RATE_LIMIT_SOS_PER_MINUTE
    window = 60

    is_limited, remaining, retry_after = limiter.is_rate_limited(key, max_reqs, window)
    if is_limited:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Rate limit exceeded: maximum {max_reqs} SOS requests per minute allowed.",
            headers={
                "Retry-After": str(retry_after),
                "X-RateLimit-Limit": str(max_reqs),
                "X-RateLimit-Remaining": "0",
            },
        )


def rate_limit_auth(request: Request):
    """
    FastAPI dependency for login/token authentication attempts:
    Limits to settings.RATE_LIMIT_AUTH_PER_MINUTE (default: 10) requests/minute/IP.
    """
    if not settings.RATE_LIMIT_ENABLED:
        return

    client_ip = get_client_ip(request)
    key = f"auth:{client_ip}"
    max_reqs = settings.RATE_LIMIT_AUTH_PER_MINUTE
    window = 60

    is_limited, remaining, retry_after = limiter.is_rate_limited(key, max_reqs, window)
    if is_limited:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Rate limit exceeded: maximum {max_reqs} authentication attempts per minute allowed.",
            headers={
                "Retry-After": str(retry_after),
                "X-RateLimit-Limit": str(max_reqs),
                "X-RateLimit-Remaining": "0",
            },
        )
