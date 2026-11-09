"""
SQLAlchemy ORM model for Ambulances.
Supports seeding five demo units AMB001 - AMB005 from pulseroute_ambulances_demo.csv.
"""
from datetime import datetime
from typing import Optional
from sqlalchemy import String, Integer, Float, Boolean, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base


class Ambulance(Base):
    __tablename__ = "ambulances"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    ambulance_id: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    vehicle_number: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    type: Mapped[str] = mapped_column(String(20), nullable=False, default="BLS")  # ALS, BLS
    status: Mapped[str] = mapped_column(
        String(50), nullable=False, default="AVAILABLE"
    )  # AVAILABLE, BUSY, EN_ROUTE, ON_SCENE, TRANSPORTING, MAINTENANCE

    latitude: Mapped[float] = mapped_column(Float, nullable=False)
    longitude: Mapped[float] = mapped_column(Float, nullable=False)

    driver_name: Mapped[Optional[str]] = mapped_column(String(150), nullable=True)
    driver_contact: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    base_station: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    fuel_oxygen_level: Mapped[str] = mapped_column(String(50), default="95%")
    equipment: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    speed_kmh: Mapped[float] = mapped_column(Float, default=0.0)

    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[Optional[datetime]] = mapped_column(DateTime, onupdate=func.now())

    # Relationships
    assignments = relationship("AmbulanceAssignment", back_populates="ambulance")
