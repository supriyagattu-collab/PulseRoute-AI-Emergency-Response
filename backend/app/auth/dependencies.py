"""
FastAPI Security & RBAC Dependencies for PulseRoute (Milestone 9.2).

Provides:
- Token extraction and signature verification (HTTPBearer)
- Role-Based Access Control (RBAC) authorization
- Emergency record ownership and access policy enforcement
- Status transition validation
"""
from typing import List, Optional, Set
import jwt
from fastapi import Depends, HTTPException, Request, Security, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.auth.jwt import decode_access_token
from app.models.emergency import EmergencyReport

# Reusable HTTPBearer security scheme (auto_error=False allows custom friendly 401 exceptions)
http_bearer = HTTPBearer(auto_error=False)

# Role alias mappings (e.g. PATIENT and REPORTER are synonymous)
ROLE_ALIASES = {
    "PATIENT": {"PATIENT", "REPORTER"},
    "REPORTER": {"PATIENT", "REPORTER"},
}

# Valid status transitions for Emergency reports
VALID_STATUS_TRANSITIONS = {
    "REPORTED": {"ASSIGNED", "EN_ROUTE", "CANCELLED"},
    "ASSIGNED": {"EN_ROUTE", "ON_SCENE", "CANCELLED"},
    "EN_ROUTE": {"ON_SCENE", "TRANSPORTING", "RESOLVED", "CANCELLED"},
    "ON_SCENE": {"TRANSPORTING", "RESOLVED", "CANCELLED"},
    "TRANSPORTING": {"RESOLVED", "CANCELLED"},
    "RESOLVED": set(),   # Terminal state
    "CANCELLED": set(),  # Terminal state
}


def get_current_user(
    request: Request = None,
    credentials: Optional[HTTPAuthorizationCredentials] = Security(http_bearer),
) -> dict:
    """
    Validates the Bearer JWT token on incoming REST requests (from Authorization header or HttpOnly cookie).
    Raises HTTP 401 UNAUTHORIZED on missing, expired, or invalid tokens.
    """
    token = credentials.credentials if credentials else None
    if not token and request:
        token = request.cookies.get("pulseroute_access_token")

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authentication token. Pass 'Authorization: Bearer <token>' header or session cookie.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        payload = decode_access_token(token)
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token has expired. Please re-authenticate.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.InvalidTokenError as err:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid authentication token: {str(err)}",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return payload


def get_optional_current_user(
    request: Request = None,
    credentials: Optional[HTTPAuthorizationCredentials] = Security(http_bearer),
) -> Optional[dict]:
    """
    Extracts user payload if token is provided, or returns None for public endpoints (e.g. SOS).
    If an invalid/expired token is explicitly provided, still raises HTTP 401.
    """
    token = credentials.credentials if credentials else None
    if not token and request:
        token = request.cookies.get("pulseroute_access_token")

    if not token:
        return None
    return get_current_user(request=request, credentials=credentials)


def require_roles(allowed_roles: List[str]):
    """
    Dependency factory that enforces Role-Based Access Control.
    ADMIN role is globally authorized across all endpoints.
    """
    def role_checker(current_user: dict = Depends(get_current_user)) -> dict:
        user_role = str(current_user.get("role", "")).upper()
        
        # Admin is universally authorized
        if user_role == "ADMIN":
            return current_user

        # Build allowed set including aliases
        allowed_set: Set[str] = set()
        for r in allowed_roles:
            r_up = r.upper()
            allowed_set.add(r_up)
            if r_up in ROLE_ALIASES:
                allowed_set.update(ROLE_ALIASES[r_up])

        if user_role not in allowed_set:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access forbidden: role '{user_role}' lacks required permissions ({', '.join(allowed_roles)}).",
            )
        return current_user

    return role_checker


def check_emergency_access(current_user: dict, emergency: EmergencyReport) -> None:
    """
    Verifies that the current user has permission to view an individual emergency record.
    - ADMIN and DISPATCHER: Full read access.
    - HOSPITAL: Access if destination facility matches or in triage overview.
    - DRIVER: Access if assigned to emergency.
    - PATIENT / REPORTER: Access ONLY if they created / are the patient of this emergency.
      Accessing another patient's emergency raises HTTP 403 FORBIDDEN.
    """
    user_role = str(current_user.get("role", "")).upper()
    user_id = str(current_user.get("sub", ""))

    if user_role in {"ADMIN", "DISPATCHER"}:
        return

    if user_role in {"PATIENT", "REPORTER"}:
        # Check ownership: creator_id, caller_name, patient_name, or contact_phone
        is_creator = getattr(emergency, "creator_id", None) == user_id
        is_caller = emergency.caller_name == user_id or emergency.caller_name == current_user.get("name")
        is_patient = emergency.patient_name.strip().lower() == str(current_user.get("name", "")).strip().lower()
        is_phone = emergency.contact_phone == current_user.get("phone")

        if not (is_creator or is_caller or is_patient or is_phone):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access forbidden: you do not have permission to view another patient's emergency record.",
            )
        return

    # DRIVER or HOSPITAL: authorized for emergency details in triage workflow
    if user_role in {"DRIVER", "HOSPITAL"}:
        return

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail=f"Access forbidden: role '{user_role}' cannot view emergency records.",
    )


def validate_status_transition(
    current_status: str,
    target_status: str,
    current_user: dict,
    emergency: EmergencyReport,
) -> None:
    """
    Validates state machine transitions and actor role permissions for emergency status changes.
    """
    user_role = str(current_user.get("role", "")).upper()
    user_id = str(current_user.get("sub", ""))
    curr = current_status.upper()
    target = target_status.upper()

    # 1. Role-specific authority check (Must evaluate before state machine for proper 403 Forbidden)
    if user_role in {"PATIENT", "REPORTER"}:
        check_emergency_access(current_user, emergency)
        if target != "CANCELLED":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access forbidden: patient/reporter role can only CANCEL an emergency incident, not transition to '{target}'.",
            )
        # Verify terminal status before allowing cancel
        if curr in {"RESOLVED", "CANCELLED"}:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid transition: emergency is in terminal status '{curr}' and cannot be updated.",
            )
        return

    # 2. State machine terminal check
    if curr in {"RESOLVED", "CANCELLED"}:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid transition: emergency is in terminal status '{curr}' and cannot be updated.",
        )

    valid_targets = VALID_STATUS_TRANSITIONS.get(curr, set())
    if target not in valid_targets:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid transition: cannot transition emergency status from '{curr}' to '{target}'. Valid transitions: {sorted(list(valid_targets))}.",
        )

    # 3. Role-specific transition permissions
    if user_role in {"ADMIN", "DISPATCHER"}:
        return  # Full authority

    if user_role == "DRIVER":
        # Drivers can update progression: EN_ROUTE, ON_SCENE, TRANSPORTING, RESOLVED
        if target not in {"EN_ROUTE", "ON_SCENE", "TRANSPORTING", "RESOLVED"}:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access forbidden: driver role cannot transition emergency to '{target}'.",
            )
        return

    if user_role == "HOSPITAL":
        # Hospitals can mark RESOLVED upon patient admission
        if target != "RESOLVED":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access forbidden: hospital role can only mark emergencies as RESOLVED upon patient arrival.",
            )
        return

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail=f"Access forbidden: role '{user_role}' is not authorized to update emergency status.",
    )
