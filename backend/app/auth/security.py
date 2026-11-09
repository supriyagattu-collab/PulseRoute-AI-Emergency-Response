"""
Security, Password Hashing, and CSRF Utilities for PulseRoute (Milestone 10.1).
"""
import hashlib
import hmac
import secrets
import bcrypt


def hash_password(password: str) -> str:
    """
    Hash a plaintext password using bcrypt with auto-generated salt (work factor 12).
    """
    salt = bcrypt.gensalt(rounds=12)
    hashed_bytes = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed_bytes.decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a plaintext password against a bcrypt hash.
    Safe against timing attacks.
    """
    try:
        return bcrypt.checkpw(
            plain_password.encode("utf-8"),
            hashed_password.encode("utf-8")
        )
    except Exception:
        return False


def generate_secure_token(nbytes: int = 32) -> str:
    """
    Generate cryptographically secure random token URL-safe string.
    """
    return secrets.token_urlsafe(nbytes)


def hash_token(token: str) -> str:
    """
    Compute SHA-256 hash of a token for secure database storage.
    Prevents plaintext token leakage if the database is compromised.
    """
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def generate_csrf_token() -> str:
    """
    Generate a cryptographically secure CSRF token.
    """
    return secrets.token_hex(32)


def validate_csrf_token(header_token: str | None, cookie_token: str | None) -> bool:
    """
    Validate CSRF token using Double Submit Cookie pattern.
    Requires constant-time comparison to prevent timing side-channel attacks.
    """
    if not header_token or not cookie_token:
        return False
    return hmac.compare_digest(header_token.strip(), cookie_token.strip())

