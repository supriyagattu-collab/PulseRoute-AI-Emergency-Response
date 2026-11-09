"""Authentication and Security package for PulseRoute (Milestone 9.1 & 9.2)."""
from app.auth.jwt import (
    create_access_token,
    decode_access_token,
    authenticate_websocket,
)
from app.auth.dependencies import (
    get_current_user,
    get_optional_current_user,
    require_roles,
    check_emergency_access,
    validate_status_transition,
    VALID_STATUS_TRANSITIONS,
)

__all__ = [
    "create_access_token",
    "decode_access_token",
    "authenticate_websocket",
    "get_current_user",
    "get_optional_current_user",
    "require_roles",
    "check_emergency_access",
    "validate_status_transition",
    "VALID_STATUS_TRANSITIONS",
]
