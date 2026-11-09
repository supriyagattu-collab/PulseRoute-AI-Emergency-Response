"""
REST API router for Authentication, Security, and RBAC (Milestone 9.1 & 10.1).

Features:
- Secure user registration (PATIENT only; blocks self-assignment of privileged roles)
- Credential authentication with bcrypt password verification
- Refresh token rotation with reuse detection
- HttpOnly cookie session management with Double-Submit CSRF protection
- Administrative role management
- Demo token endpoint strictly gated by DEMO_MODE setting
"""
import uuid
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Request, Response, status
from sqlalchemy.orm import Session
from app.config import settings
from app.db.session import get_db
from app.models.user import User
from app.schemas.user import (
    UserRegister,
    UserLogin,
    UserResponse,
    RoleUpdateRequest,
    TokenRequest,
    TokenResponse,
    RefreshTokenRequest,
)
from app.auth.security import (
    hash_password,
    verify_password,
    generate_csrf_token,
    validate_csrf_token,
)
from app.auth.jwt import (
    create_access_token,
    create_refresh_token,
    rotate_refresh_token,
    revoke_refresh_token,
)
from app.auth.dependencies import get_current_user, require_roles
from app.auth.rate_limiter import rate_limit_auth

router = APIRouter(prefix="/auth", tags=["Authentication & Security"])

DEMO_USERS_MAP = {
    "admin": {
        "user_id": "user-adm-01",
        "email": "admin@example.com",
        "role": "ADMIN",
        "name": "Vikramaditya Rao (Central Admin)",
    },
    "dispatcher": {
        "user_id": "user-dsp-01",
        "email": "dispatcher@example.com",
        "role": "DISPATCHER",
        "name": "Central Dispatch Lead",
    },
    "driver": {
        "user_id": "user-drv-01",
        "email": "driver@example.com",
        "role": "DRIVER",
        "name": "Rajesh Kumar (ALS Driver)",
    },
    "hospital": {
        "user_id": "user-hsp-01",
        "email": "hospital@example.com",
        "role": "HOSPITAL",
        "name": "Dr. Ananya Iyer (Trauma Command)",
    },
    "reporter": {
        "user_id": "user-rep-01",
        "email": "reporter@example.com",
        "role": "REPORTER",
        "name": "Priya Sharma (Citizen Reporter)",
    },
    "patient": {
        "user_id": "user-rep-01",
        "email": "reporter@example.com",
        "role": "PATIENT",
        "name": "Priya Sharma (Citizen Reporter)",
    },
}


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new citizen/patient account",
)
def register_user(payload: UserRegister, db: Session = Depends(get_db)):
    """
    Public registration endpoint.
    Strictly restricted to PATIENT role; privileged roles (ADMIN, DISPATCHER, DRIVER, HOSPITAL)
    cannot be self-assigned and must be provisioned by an administrator.
    """
    # Enforce role restriction: only PATIENT/REPORTER allowed for self-registration
    desired_role = (payload.role or "PATIENT").upper()
    if desired_role not in {"PATIENT", "REPORTER"}:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access forbidden: self-registration for role '{desired_role}' is not allowed. "
                   f"Only administrative staff can provision privileged accounts.",
        )

    # Check for duplicate email
    existing_user = db.query(User).filter(User.email == payload.email.lower()).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists.",
        )

    # Hash password with bcrypt
    hashed_pwd = hash_password(payload.password)
    user_id = f"user-{uuid.uuid4().hex[:8]}"

    new_user = User(
        user_id=user_id,
        email=payload.email.lower(),
        hashed_password=hashed_pwd,
        full_name=payload.full_name,
        phone=payload.phone,
        role=desired_role,
        status="ACTIVE",
        is_active=True,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


@router.post(
    "/login",
    response_model=TokenResponse,
    dependencies=[Depends(rate_limit_auth)],
    summary="Authenticate with credentials and obtain JWT tokens & cookies",
)
def login(
    payload: UserLogin,
    response: Response,
    db: Session = Depends(get_db),
):
    """
    Authenticates user credentials using bcrypt.
    On success:
      - Issues short-lived JWT access token (15 minutes).
      - Issues secure refresh token (7 days) with database tracking.
      - Sets HttpOnly, Secure (in production), SameSite cookies.
      - Generates CSRF token for state-changing browser requests.
    """
    user = db.query(User).filter(User.email == payload.email.lower()).first()

    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active or user.status != "ACTIVE":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is disabled or suspended. Please contact system administrator.",
        )

    # Issue access token
    access_token = create_access_token({
        "sub": user.user_id,
        "email": user.email,
        "role": user.role.upper(),
        "name": user.full_name,
    })

    # Issue and record refresh token
    refresh_token = create_refresh_token(user.user_id, db)
    csrf_token = generate_csrf_token()

    # Set secure browser cookies
    response.set_cookie(
        key="pulseroute_access_token",
        value=access_token,
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite=settings.COOKIE_SAMESITE,
        path="/",
    )
    response.set_cookie(
        key="pulseroute_refresh_token",
        value=refresh_token,
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite=settings.COOKIE_SAMESITE,
        path="/api/v1/auth",
    )
    response.set_cookie(
        key="pulseroute_csrf_token",
        value=csrf_token,
        httponly=False,  # Readable by frontend JS to attach X-CSRF-Token header
        secure=settings.COOKIE_SECURE,
        samesite=settings.COOKIE_SAMESITE,
        path="/",
    )

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        role=user.role.upper(),
        user_id=user.user_id,
        expires_in_minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES,
        refresh_token=refresh_token,
        csrf_token=csrf_token,
        user=UserResponse.model_validate(user),
    )


@router.post(
    "/refresh",
    response_model=TokenResponse,
    summary="Rotate refresh token and issue new access token",
)
def refresh_token_endpoint(
    request: Request,
    response: Response,
    payload: Optional[RefreshTokenRequest] = None,
    db: Session = Depends(get_db),
):
    """
    Rotates refresh token and issues fresh access token.
    Supports either JSON body or HttpOnly cookie.
    When using cookies, enforces Double Submit CSRF token validation.
    """
    # 1. Extract refresh token
    raw_token = payload.refresh_token if (payload and payload.refresh_token) else None
    using_cookie = False

    if not raw_token:
        cookie_token = request.cookies.get("pulseroute_refresh_token")
        if cookie_token:
            raw_token = cookie_token
            using_cookie = True

    if not raw_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing refresh token in request body or cookie.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 2. CSRF validation if authenticated via cookie
    if using_cookie and settings.CSRF_PROTECTION_ENABLED:
        csrf_header = request.headers.get("x-csrf-token")
        csrf_cookie = request.cookies.get("pulseroute_csrf_token")
        if not validate_csrf_token(csrf_header, csrf_cookie):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="CSRF validation failed: missing or invalid X-CSRF-Token header.",
            )

    # 3. Rotate token (detects reuse & revokes compromised tokens automatically)
    new_access_token, new_refresh_token, user = rotate_refresh_token(raw_token, db)
    new_csrf = generate_csrf_token()

    # 4. Set updated cookies
    response.set_cookie(
        key="pulseroute_access_token",
        value=new_access_token,
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite=settings.COOKIE_SAMESITE,
        path="/",
    )
    response.set_cookie(
        key="pulseroute_refresh_token",
        value=new_refresh_token,
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite=settings.COOKIE_SAMESITE,
        path="/api/v1/auth",
    )
    response.set_cookie(
        key="pulseroute_csrf_token",
        value=new_csrf,
        httponly=False,
        secure=settings.COOKIE_SECURE,
        samesite=settings.COOKIE_SAMESITE,
        path="/",
    )

    return TokenResponse(
        access_token=new_access_token,
        token_type="bearer",
        role=user.role.upper(),
        user_id=user.user_id,
        expires_in_minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES,
        refresh_token=new_refresh_token,
        csrf_token=new_csrf,
        user=UserResponse.model_validate(user),
    )


@router.post(
    "/logout",
    summary="Revoke refresh token and clear authentication cookies",
)
def logout(
    request: Request,
    response: Response,
    payload: Optional[RefreshTokenRequest] = None,
    db: Session = Depends(get_db),
):
    """
    Revokes the active refresh token in the database and clears authentication cookies.
    """
    raw_token = payload.refresh_token if (payload and payload.refresh_token) else None
    if not raw_token:
        raw_token = request.cookies.get("pulseroute_refresh_token")

    if raw_token:
        revoke_refresh_token(raw_token, db)

    # Clear authentication cookies
    response.delete_cookie(key="pulseroute_access_token", path="/")
    response.delete_cookie(key="pulseroute_refresh_token", path="/api/v1/auth")
    response.delete_cookie(key="pulseroute_csrf_token", path="/")

    return {"message": "Logged out successfully. All sessions revoked."}


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get current authenticated user profile",
)
def get_current_user_profile(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Returns the database user record for the currently authenticated JWT bearer.
    """
    user_id = current_user.get("sub")
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        # Fallback to email search if user was created under demo map
        email = current_user.get("email")
        user = db.query(User).filter(User.email == email).first()

    if not user:
        # Construct synthetic user object for demo users if not in DB
        return UserResponse(
            user_id=user_id or "user-00",
            email=current_user.get("email", "unknown@example.com"),
            full_name=current_user.get("name", "Authenticated User"),
            role=current_user.get("role", "PATIENT"),
            status="ACTIVE",
            is_active=True,
        )

    return user


@router.patch(
    "/users/{user_id}/role",
    response_model=UserResponse,
    summary="Assign or update a user's role (Admin only)",
)
def update_user_role(
    user_id: str,
    payload: RoleUpdateRequest,
    current_user: dict = Depends(require_roles(["ADMIN"])),
    db: Session = Depends(get_db),
):
    """
    Administrative endpoint to update user roles (e.g. promoting a user to DRIVER,
    DISPATCHER, or HOSPITAL). Restricted strictly to ADMIN role.
    """
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID '{user_id}' not found.",
        )

    user.role = payload.role.upper()
    db.commit()
    db.refresh(user)
    return user


@router.post(
    "/token",
    response_model=TokenResponse,
    dependencies=[Depends(rate_limit_auth)],
    summary="Issue signed JWT access token",
)
def issue_token(
    payload: TokenRequest,
    db: Session = Depends(get_db),
):
    """
    Issue JWT token.
    - When password is provided: validates credentials against the database, rejects
      invalid passwords, and strictly enforces role from database (prevents self-assignment).
    - When password is not provided:
        * In production (DEMO_MODE=False): strictly REJECTS with 401 Unauthorized.
        * In development (DEMO_MODE=True): issues token for backward compatibility.
    """
    # 1. Real credential authentication path
    if payload.password:
        email = (payload.email or "").strip().lower()
        user = db.query(User).filter(User.email == email).first()
        if not user or not verify_password(payload.password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials: username/email or password incorrect.",
                headers={"WWW-Authenticate": "Bearer"},
            )

        if not user.is_active or user.status != "ACTIVE":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account is disabled or suspended.",
            )

        # Check self-assignment attack: if caller supplied role differs from DB role
        if payload.role and payload.role.upper() != user.role.upper():
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access forbidden: cannot self-assign role '{payload.role}'. Your authorized role is '{user.role}'.",
            )

        token_data = {
            "sub": user.user_id,
            "email": user.email,
            "role": user.role.upper(),
            "name": user.full_name,
        }
        token = create_access_token(token_data)
        refresh_tok = create_refresh_token(user.user_id, db)
        return TokenResponse(
            access_token=token,
            token_type="bearer",
            role=user.role.upper(),
            user_id=user.user_id,
            expires_in_minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES,
            refresh_token=refresh_tok,
            user=UserResponse.model_validate(user),
        )

    # 2. Credential-less token request
    if not settings.DEMO_MODE:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Production authentication error: valid user password credentials are required.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Demo/dev backwards compatibility
    role = (payload.role or "REPORTER").upper()
    user_id = payload.user_id or f"user-{role.lower()}-01"
    email = payload.email or f"{role.lower()}@example.com"
    name = payload.name or f"Demo {role.title()}"

    token_data = {
        "sub": user_id,
        "email": email,
        "role": role,
        "name": name,
    }
    token = create_access_token(token_data)
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        role=role,
        user_id=user_id,
        expires_in_minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES,
    )


@router.get(
    "/demo-token",
    response_model=TokenResponse,
    summary="Retrieve pre-signed JWT token for demo role (Disabled in Production)",
)
def get_demo_token(
    role: str = Query("admin", description="Demo role: admin, dispatcher, driver, hospital, reporter")
):
    """
    Helper for demo & development: generates a signed JWT token for the requested role.
    Strictly disabled in production (returns HTTP 403 when DEMO_MODE=False).
    """
    if not settings.DEMO_MODE:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Demo mode is disabled in production environments. Please authenticate via /api/v1/auth/login.",
        )

    role_key = role.lower().strip()
    user_info = DEMO_USERS_MAP.get(role_key)
    if not user_info:
        user_info = {
            "user_id": f"user-{role_key}-01",
            "email": f"{role_key}@example.com",
            "role": role.upper(),
            "name": f"Demo {role.title()}",
        }

    token = create_access_token({
        "sub": user_info["user_id"],
        "email": user_info["email"],
        "role": user_info["role"],
        "name": user_info["name"],
    })

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        role=user_info["role"],
        user_id=user_info["user_id"],
        expires_in_minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES,
    )
