"""
SQLAlchemy ORM model for Emergency Reports.
"""
from datetime import datetime
from typing import Optional
from sqlalchemy import String, Integer, Float, Text, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base


class EmergencyReport(Base):
    __tablename__ = "emergency_reports"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    incident_code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)

    patient_name: Mapped[str] = mapped_column(String(150), nullable=False)
    contact_phone: Mapped[str] = mapped_column(String(50), nullable=False)
    patient_age: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    gender: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)

    emergency_type: Mapped[str] = mapped_column(String(50), nullable=False, default="GENERAL")
    severity: Mapped[str] = mapped_column(String(50), nullable=False, default="CRITICAL")
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="REPORTED")

    consciousness: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    breathing: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)

    incident_address: Mapped[str] = mapped_column(Text, nullable=False)
    latitude: Mapped[float] = mapped_column(Float, nullable=False)
    longitude: Mapped[float] = mapped_column(Float, nullable=False)

    symptoms: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    caller_name: Mapped[Optional[str]] = mapped_column(String(150), nullable=True)
    creator_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True, index=True)

    destination_facility_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("healthcare_facilities.id"), nullable=True
    )

    reported_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    resolved_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    # Relationships
    destination_facility = relationship("HealthcareFacility", back_populates="emergencies")
    assignments = relationship("AmbulanceAssignment", back_populates="emergency", cascade="all, delete-orphan")
    status_history = relationship(
        "EmergencyStatusHistory",
        back_populates="emergency",
        cascade="all, delete-orphan",
        order_by="desc(EmergencyStatusHistory.changed_at)",
    )


class EmergencyStatusHistory(Base):
    __tablename__ = "emergency_status_history"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    emergency_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("emergency_reports.id", ondelete="CASCADE"), nullable=False, index=True
    )
    from_status: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    to_status: Mapped[str] = mapped_column(String(50), nullable=False)
    changed_by: Mapped[Optional[str]] = mapped_column(String(100), nullable=True, default="SYSTEM")
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    changed_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)

    # Relationships
    emergency = relationship("EmergencyReport", back_populates="status_history")

