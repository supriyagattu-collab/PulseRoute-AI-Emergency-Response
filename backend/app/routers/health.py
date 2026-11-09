"""
Health check and system status router.
"""
from datetime import datetime, timezone
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.db.session import get_db, active_url
from app.config import settings

router = APIRouter(prefix="/health", tags=["Health & Status"])


@router.get("", summary="System Health Check & Diagnostic Status")
def health_check(db: Session = Depends(get_db)):
    """
    Returns API health status, active database dialect, and prototype safety disclaimers.
    """
    db_status = "connected"
    db_dialect = "unknown"
    try:
        db.execute(text("SELECT 1"))
        db_dialect = db.bind.dialect.name
    except Exception as exc:
        db_status = f"unhealthy: {exc}"

    return {
        "status": "healthy" if db_status == "connected" else "degraded",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "project": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "database": {
            "status": db_status,
            "dialect": db_dialect,
            "is_postgres": db_dialect == "postgresql",
        },
        "simulation": {
            "demo_mode": settings.DEMO_MODE,
            "connected_to_real_emergency_services": settings.IS_REAL_EMERGENCY_SERVICE,
            "notice": "College project prototype. Not connected to real 108/112 emergency dispatch."
        }
    }
