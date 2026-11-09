"""
Database session management with dual support for PostgreSQL and SQLite fallback.
Enforces strict production invariant: no silent fallback to SQLite in production mode.
Masks database credentials in logs.
"""
import logging
from pathlib import Path
from typing import Generator
from sqlalchemy import create_engine, text
from sqlalchemy.engine import make_url
from sqlalchemy.orm import sessionmaker, Session
from app.config import settings

logger = logging.getLogger(__name__)

# Determine canonical SQLite fallback path relative to backend root
BACKEND_DIR = Path(__file__).resolve().parent.parent.parent
canonical_sqlite_file = BACKEND_DIR / "pulseroute.db"
canonical_sqlite_url = f"sqlite:///{canonical_sqlite_file.as_posix()}"

# Determine active database engine
primary_url = settings.DATABASE_URL
url_obj = make_url(primary_url)
safe_primary_url = url_obj.render_as_string(hide_password=True)

is_production = (settings.ENVIRONMENT or "").lower() == "production" or not settings.DEMO_MODE

if primary_url.startswith("sqlite"):
    connect_args = {"check_same_thread": False}
    engine = create_engine(primary_url, connect_args=connect_args, echo=False)
    active_url = primary_url
    logger.info("Using SQLite database: %s", safe_primary_url)
else:
    # Attempt connecting to PostgreSQL
    try:
        test_engine = create_engine(
            primary_url,
            pool_size=10,
            max_overflow=20,
            pool_recycle=1800,
            pool_pre_ping=True,
            connect_args={"connect_timeout": 3},
            echo=False,
        )
        with test_engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        engine = test_engine
        active_url = primary_url
        logger.info("Successfully connected to PostgreSQL database at %s", safe_primary_url)
    except Exception as exc:
        if is_production:
            logger.critical(
                "CRITICAL: Failed to connect to PostgreSQL database in production (%s): %s",
                safe_primary_url,
                exc,
            )
            raise RuntimeError(
                f"Production Database Connection Failure: Could not connect to PostgreSQL at {safe_primary_url}. "
                "Silent fallback to SQLite is strictly forbidden in production mode. "
                f"Root cause: {exc}"
            )

        fallback_url = canonical_sqlite_url if settings.SQLITE_FALLBACK_URL == "sqlite:///./pulseroute.db" else settings.SQLITE_FALLBACK_URL
        safe_fallback = make_url(fallback_url).render_as_string(hide_password=True)
        logger.warning(
            "Could not connect to PostgreSQL (%s). Falling back to local SQLite database (%s) for prototyping. Error: %s",
            safe_primary_url,
            safe_fallback,
            exc,
        )
        engine = create_engine(
            fallback_url,
            connect_args={"check_same_thread": False},
            echo=False,
        )
        active_url = fallback_url

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> Generator[Session, None, None]:
    """
    FastAPI dependency yielding a database session per request.
    Ensures the session is cleanly closed upon request completion.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
