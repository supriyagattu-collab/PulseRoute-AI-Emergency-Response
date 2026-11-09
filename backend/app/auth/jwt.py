"""
PulseRoute Authentication and JWT Token Management (Milestone 9.1 & 10.1).

Provides:
- JWT token generation and decoding using PyJWT and configurable secret.
- Short-lived access token expiry (15 mins target).
- Secure refresh-token rotation, revocation, and reuse detection in SQLite/PostgreSQL.
- WebSocket handshake authentication and Role-Based Access Control (RBAC).
"""
import logging
from datetime import datetime, timedelta, timezone
from typing import Optional, Tuple, Union
import jwt
from fastapi import WebSocket, status, HTTPException
from sqlalchemy.orm import Session
from app.config import settings
from app.auth.security import generate_secure_token, hash_token
from app.models.user import User, RefreshToken

logger = logging.getLogger("pulseroute.auth")


def create_access_token(
    data: dict,
    expires_delta: Optional[timedelta] = None,
) -> str:
    """
    Encode payload dictionary into a signed HS256 JWT token.
    Appends standard 'exp' and 'iat' claims in UTC.
    """
    to_encode = data.copy()
    now_utc = datetime.now(timezone.utc)
    if expires_delta:
        expire = now_utc + expires_delta
    else:
        expire = now_utc + timedelta(minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode.update({
        "exp": expire,
        "iat": now_utc,
    })
    encoded_jwt = jwt.encode(
        to_encode,
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM,
    )
    return encoded_jwt


def decode_access_token(token: str) -> dict:
    """
    Verify signature and expiry of a JWT token, returning the payload dict.
    Raises jwt.ExpiredSignatureError, jwt.InvalidTokenError on failure.
    """
    return jwt.decode(
        token,
        settings.JWT_SECRET_KEY,
        algorithms=[settings.JWT_ALGORITHM],
    )


def create_refresh_token(user_id: str, db: Session) -> str:
    """
    Generate a cryptographically secure refresh token, store its SHA-256 hash
    in the database, and return the plaintext token to client.
    """
    raw_token = generate_secure_token(48)
    token_hash_str = hash_token(raw_token)
    now_utc = datetime.now(timezone.utc)
    expires_at = now_utc + timedelta(days=settings.JWT_REFRESH_TOKEN_EXPIRE_DAYS)

    record = RefreshToken(
        token_hash=token_hash_str,
        user_id=user_id,
        expires_at=expires_at,
        created_at=now_utc,
        revoked=False,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return raw_token


def rotate_refresh_token(old_token: str, db: Session) -> Tuple[str, str, User]:
    """
    Implements Refresh Token Rotation with Token Reuse Detection.
    
    If an already revoked/replaced token is presented, that indicates token theft!
    All refresh tokens for this user are immediately revoked, and HTTP 401 is raised.
    
    Returns:
      (new_access_token, new_refresh_token, user_record)
    """
    old_hash = hash_token(old_token)
    record = db.query(RefreshToken).filter(RefreshToken.token_hash == old_hash).first()

    if not record:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 1. Reuse Detection: Token was already revoked or replaced!
    if record.revoked or record.replaced_by is not None:
        # Revoke all tokens for this compromised user
        revoke_all_user_tokens(record.user_id, db)
        logger.warning(
            "SECURITY ALERT: Refresh token reuse detected for user_id=%s. All sessions revoked.",
            record.user_id,
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token reuse detected or token revoked. All sessions invalidated. Please log in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 2. Expiry check
    now_utc = datetime.now(timezone.utc)
    # Handle both timezone-aware and naive datetimes from SQLite
    expires_at = record.expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)

    if expires_at <= now_utc:
        record.revoked = True
        record.revoked_at = now_utc
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token has expired. Please log in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 3. Lookup User
    user = db.query(User).filter(User.user_id == record.user_id).first()
    if not user or not user.is_active or user.status != "ACTIVE":
        record.revoked = True
        record.revoked_at = now_utc
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive or disabled.",
        )

    # 4. Generate new refresh token and link replacement
    new_raw_token = generate_secure_token(48)
    new_hash_str = hash_token(new_raw_token)
    new_expires = now_utc + timedelta(days=settings.JWT_REFRESH_TOKEN_EXPIRE_DAYS)

    # Invalidate old token
    record.revoked = True
    record.revoked_at = now_utc
    record.replaced_by = new_hash_str

    # Create new record
    new_record = RefreshToken(
        token_hash=new_hash_str,
        user_id=user.user_id,
        expires_at=new_expires,
        created_at=now_utc,
        revoked=False,
    )
    db.add(new_record)
    db.commit()

    # 5. Generate fresh access token
    new_access_token = create_access_token({
        "sub": user.user_id,
        "email": user.email,
        "role": user.role.upper(),
        "name": user.full_name,
    })

    return new_access_token, new_raw_token, user


def revoke_refresh_token(token: str, db: Session) -> bool:
    """
    Revoke a single refresh token (used during user logout).
    """
    token_hash_str = hash_token(token)
    record = db.query(RefreshToken).filter(RefreshToken.token_hash == token_hash_str).first()
    if record and not record.revoked:
        record.revoked = True
        record.revoked_at = datetime.now(timezone.utc)
        db.commit()
        return True
    return False


def revoke_all_user_tokens(user_id: str, db: Session) -> int:
    """
    Revoke all active refresh tokens for a user (e.g. password reset or reuse detection).
    """
    now_utc = datetime.now(timezone.utc)
    count = (
        db.query(RefreshToken)
        .filter(RefreshToken.user_id == user_id, RefreshToken.revoked == False)
        .update({"revoked": True, "revoked_at": now_utc})
    )
    db.commit()
    return count


def authenticate_websocket(
    websocket: WebSocket,
    token: Optional[str] = None,
) -> Tuple[bool, Union[dict, str], int]:
    """
    Authenticate an incoming WebSocket handshake against configured JWT secret
    and role-based permissions.

    Token can be provided via:
      1. Query param: `?token=<jwt_token>` (Standard for browser WebSocket API)
      2. Authorization Header: `Authorization: Bearer <jwt_token>`

    Returns:
      (True, payload_dict, 0) on success
      (False, error_reason_str, close_code_int) on failure
    """
    # 1. Extract token from query params or headers
    auth_token = token or websocket.query_params.get("token")
    if not auth_token:
        header_auth = websocket.headers.get("authorization") or websocket.headers.get("Authorization")
        if header_auth and header_auth.lower().startswith("bearer "):
            auth_token = header_auth.split(" ", 1)[1].strip()

    if not auth_token:
        logger.warning("WS Handshake rejected: Missing authentication token")
        return (
            False,
            "Missing authentication token. Pass ?token=<jwt> or Authorization header.",
            status.WS_1008_POLICY_VIOLATION,
        )

    # 2. Decode and validate token signature & expiry
    try:
        payload = decode_access_token(auth_token)
    except jwt.ExpiredSignatureError:
        logger.warning("WS Handshake rejected: Token expired")
        return (
            False,
            "Authentication token has expired. Please re-authenticate.",
            status.WS_1008_POLICY_VIOLATION,
        )
    except jwt.InvalidTokenError as err:
        logger.warning("WS Handshake rejected: Invalid token: %s", err)
        return (
            False,
            f"Invalid authentication token: {str(err)}",
            status.WS_1008_POLICY_VIOLATION,
        )

    # 3. Role-Based Access Control (RBAC) validation
    role = str(payload.get("role", "")).upper()
    allowed_roles = [r.upper() for r in settings.WS_ALLOWED_ROLES]

    if not role or role not in allowed_roles:
        logger.warning(
            "WS Handshake rejected: Role '%s' unauthorized (Allowed: %s)",
            role,
            allowed_roles,
        )
        return (
            False,
            f"Role '{role}' is not authorized to access live emergency telemetry.",
            status.WS_1008_POLICY_VIOLATION,
        )

    return (True, payload, 0)
