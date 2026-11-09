"""
Seed initial demo users into database for local development and testing (Milestone 10.1).
"""
import logging
from sqlalchemy.orm import Session
from app.models.user import User
from app.auth.security import hash_password
from app.config import settings

logger = logging.getLogger("pulseroute.auth.seed")

DEFAULT_DEMO_PASSWORD = "DemoPassword123!"

DEMO_USERS_SEEDS = [
    {
        "user_id": "user-adm-01",
        "email": "admin@example.com",
        "role": "ADMIN",
        "full_name": "Vikramaditya Rao (Central Admin)",
        "phone": "+91 98490 11001",
        "status": "ACTIVE",
        "is_active": True,
    },
    {
        "user_id": "user-dsp-01",
        "email": "dispatcher@example.com",
        "role": "DISPATCHER",
        "full_name": "Central Dispatch Lead",
        "phone": "+91 98490 11002",
        "status": "ACTIVE",
        "is_active": True,
    },
    {
        "user_id": "user-drv-01",
        "email": "driver@example.com",
        "role": "DRIVER",
        "full_name": "Rajesh Kumar (ALS Driver)",
        "phone": "+91 98490 11003",
        "status": "ACTIVE",
        "is_active": True,
    },
    {
        "user_id": "user-hsp-01",
        "email": "hospital@example.com",
        "role": "HOSPITAL",
        "full_name": "Dr. Ananya Iyer (Trauma Command)",
        "phone": "+91 98490 11004",
        "status": "ACTIVE",
        "is_active": True,
    },
    {
        "user_id": "user-rep-01",
        "email": "reporter@example.com",
        "role": "PATIENT",
        "full_name": "Priya Sharma (Citizen Reporter)",
        "phone": "+91 98490 11005",
        "status": "ACTIVE",
        "is_active": True,
    },
]


def seed_demo_users(db: Session) -> None:
    """
    Ensure standard demo accounts exist in database with bcrypt-hashed passwords.
    """
    hashed = hash_password(DEFAULT_DEMO_PASSWORD)
    for udata in DEMO_USERS_SEEDS:
        existing = db.query(User).filter(
            (User.email == udata["email"]) | (User.user_id == udata["user_id"])
        ).first()
        if not existing:
            user = User(
                user_id=udata["user_id"],
                email=udata["email"],
                hashed_password=hashed,
                full_name=udata["full_name"],
                phone=udata["phone"],
                role=udata["role"],
                status=udata["status"],
                is_active=udata["is_active"],
            )
            db.add(user)
    try:
        db.commit()
    except Exception as e:
        db.rollback()
        logger.warning("Could not auto-seed demo users: %s", e)

