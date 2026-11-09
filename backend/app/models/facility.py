"""
SQLAlchemy ORM model for Healthcare Facilities.
Supports imports from pulseroute_health_facilities.csv.
"""
from datetime import datetime
from typing import Optional, List
from sqlalchemy import String, Integer, Float, Boolean, Text, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base


class HealthcareFacility(Base):
    __tablename__ = "healthcare_facilities"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    object_id: Mapped[Optional[int]] = mapped_column(Integer, nullable=True, index=True)
    facility_name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    facility_type: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    nin_id: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)

    state: Mapped[Optional[str]] = mapped_column(String(100), default="Telangana")
    district: Mapped[Optional[str]] = mapped_column(String(100), nullable=True, index=True)
    mandal: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    municipality: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    address: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    pincode: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)

    latitude: Mapped[float] = mapped_column(Float, nullable=False)
    longitude: Mapped[float] = mapped_column(Float, nullable=False)

    department: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    services: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    # Simulated capacity & capabilities (Demo / Prototype Mode)
    total_icu_beds: Mapped[int] = mapped_column(Integer, default=20)
    available_icu_beds: Mapped[int] = mapped_column(Integer, default=5)
    total_general_beds: Mapped[int] = mapped_column(Integer, default=100)
    available_general_beds: Mapped[int] = mapped_column(Integer, default=25)

    emergency_phone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True, default="040-24600121")
    trauma_level: Mapped[str] = mapped_column(String(100), default="Level 2 Trauma Center")
    has_cath_lab: Mapped[bool] = mapped_column(Boolean, default=False)
    has_ct_scan: Mapped[bool] = mapped_column(Boolean, default=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[Optional[datetime]] = mapped_column(DateTime, onupdate=func.now())

    # Relationships
    emergencies = relationship("EmergencyReport", back_populates="destination_facility")
