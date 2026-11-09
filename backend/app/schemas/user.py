"""
Pydantic Schemas for User Authentication and Account Management (Milestone 10.1).
"""
import re
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, field_validator


class UserRegister(BaseModel):
    email: str = Field(..., description="User email address", examples=["citizen@example.com"])
    password: str = Field(..., min_length=8, description="User password (min 8 chars, 1 number, 1 uppercase, 1 lowercase)")
    full_name: str = Field(..., min_length=2, max_length=150, description="Full name")
    phone: Optional[str] = Field(None, max_length=50, description="Contact phone number")
    role: Optional[str] = Field("PATIENT", description="Self-registration role (only PATIENT allowed)")

    @field_validator("email")
    def validate_email_format(cls, v: str) -> str:
        clean = v.strip().lower()
        # Basic RFC 5322 compliant regex check
        pattern = r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$"
        if not re.match(pattern, clean):
            raise ValueError("Invalid email address format.")
        return clean

    @field_validator("password")
    def validate_password_strength(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long.")
        if not re.search(r"\d", v):
            raise ValueError("Password must contain at least one digit.")
        if not re.search(r"[a-z]", v):
            raise ValueError("Password must contain at least one lowercase letter.")
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain at least one uppercase letter.")
        return v

    @field_validator("role")
    def validate_self_reg_role(cls, v: Optional[str]) -> str:
        if not v:
            return "PATIENT"
        clean = v.strip().upper()
        # Ordinary users can only register as PATIENT or REPORTER
        if clean not in {"PATIENT", "REPORTER"}:
            raise ValueError(
                f"Unauthorized self-registration role '{clean}'. "
                "Self-registration is restricted to PATIENT role only. "
                "Privileged roles (ADMIN, DISPATCHER, DRIVER, HOSPITAL) must be assigned by an administrator."
            )
        return clean


class UserLogin(BaseModel):
    email: str = Field(..., description="User email address")
    password: str = Field(..., description="User password")

    @field_validator("email")
    def clean_email(cls, v: str) -> str:
        return v.strip().lower()


class UserResponse(BaseModel):
    user_id: str
    email: str
    full_name: str
    role: str
    status: str
    is_active: bool
    phone: Optional[str] = None
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class RoleUpdateRequest(BaseModel):
    role: str = Field(..., description="Target role: ADMIN, DISPATCHER, DRIVER, HOSPITAL, PATIENT")

    @field_validator("role")
    def validate_role(cls, v: str) -> str:
        clean = v.strip().upper()
        valid_roles = {"ADMIN", "DISPATCHER", "DRIVER", "HOSPITAL", "PATIENT", "REPORTER"}
        if clean not in valid_roles:
            raise ValueError(f"Invalid role '{clean}'. Allowed roles: {sorted(list(valid_roles))}")
        return clean


class TokenRequest(BaseModel):
    user_id: Optional[str] = Field(None, description="Unique user identifier", examples=["user-adm-01"])
    email: Optional[str] = Field(None, description="User email address", examples=["admin@example.com"])
    password: Optional[str] = Field(None, description="User password for credential authentication")
    role: Optional[str] = Field(None, description="User role: ADMIN, DRIVER, HOSPITAL, DISPATCHER, REPORTER")
    name: Optional[str] = Field(None, description="Full name of user")


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    user_id: str
    expires_in_minutes: int
    refresh_token: Optional[str] = None
    csrf_token: Optional[str] = None
    user: Optional[UserResponse] = None


class RefreshTokenRequest(BaseModel):
    refresh_token: Optional[str] = Field(None, description="Refresh token string (if not using HttpOnly cookie)")

