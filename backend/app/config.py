"""
Configuration settings for PulseRoute Backend (Milestone 10.1 Security Hardening).
Loads environment variables via pydantic-settings with sensible defaults and production safeguards.
"""
from typing import List, Union
from pydantic import field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

DEFAULT_DEV_JWT_SECRET = "pulseroute-development-jwt-secret-key-32chars-minimum-replace-in-prod"


class Settings(BaseSettings):
    PROJECT_NAME: str = "PulseRoute Emergency Response API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = "development"  # "development", "staging", "production"
    DEBUG: bool = True

    # Database Configuration
    DATABASE_URL: str = "postgresql+psycopg2://postgres:postgres@localhost:5432/pulseroute"
    # Fallback SQLite DB when PostgreSQL is unavailable
    SQLITE_FALLBACK_URL: str = "sqlite:///./pulseroute.db"

    @field_validator("DATABASE_URL", mode="before")
    def normalize_database_url(cls, v: str) -> str:
        if isinstance(v, str) and v.startswith("postgresql://"):
            return v.replace("postgresql://", "postgresql+psycopg2://", 1)
        return v

    # CORS configuration
    CORS_ORIGINS: Union[str, List[str]] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:4173",
        "http://127.0.0.1:4173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ]

    @field_validator("CORS_ORIGINS", mode="before")
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, list):
            return v
        return ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:4173"]

    # Academic & Safety Disclaimer
    DEMO_MODE: bool = True
    IS_REAL_EMERGENCY_SERVICE: bool = False

    # JWT Security Configuration (Milestone 10.1: Short-lived access token + Refresh tokens)
    JWT_SECRET_KEY: str = DEFAULT_DEV_JWT_SECRET
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 15  # Production target: 15 minutes
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = 7     # 7 days with rotation

    # Cookie & CSRF Security
    COOKIE_SECURE: bool = False  # Set True in production (HTTPS)
    COOKIE_SAMESITE: str = "lax"  # "lax", "strict", "none"
    CSRF_PROTECTION_ENABLED: bool = True

    # Rate Limiting Configuration
    RATE_LIMIT_ENABLED: bool = True
    RATE_LIMIT_SOS_PER_MINUTE: int = 5
    RATE_LIMIT_AUTH_PER_MINUTE: int = 10

    # WebSocket Allowed Roles
    WS_ALLOWED_ROLES: Union[str, List[str]] = [
        "ADMIN",
        "DISPATCHER",
        "OPERATOR",
        "DRIVER",
        "HOSPITAL",
    ]

    @field_validator("WS_ALLOWED_ROLES", mode="before")
    def assemble_ws_allowed_roles(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip().upper() for i in v.split(",") if i.strip()]
        elif isinstance(v, list):
            return [str(i).strip().upper() for i in v]
        return ["ADMIN", "DISPATCHER", "OPERATOR", "DRIVER", "HOSPITAL"]

    @model_validator(mode="after")
    def validate_production_security(self) -> "Settings":
        """
        Enforce strict production invariants:
        - Must not use development default secret key in production.
        - Must disable demo mode in production.
        - Debug mode must be disabled in production.
        """
        env = (self.ENVIRONMENT or "").lower()
        if env == "production":
            if self.JWT_SECRET_KEY == DEFAULT_DEV_JWT_SECRET:
                raise ValueError(
                    "CRITICAL SECURITY CONFIGURATION ERROR: In production environment, "
                    "JWT_SECRET_KEY must not use the default development secret! "
                    "Set a secure JWT_SECRET_KEY via environment variables (min 32 chars)."
                )
            if len(self.JWT_SECRET_KEY) < 32:
                raise ValueError(
                    "CRITICAL SECURITY ERROR: JWT_SECRET_KEY must be at least 32 characters long."
                )
            # Enforce production flags
            self.DEMO_MODE = False
            self.DEBUG = False
            self.COOKIE_SECURE = True
        return self

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )


settings = Settings()
