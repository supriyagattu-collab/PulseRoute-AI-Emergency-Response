"""
SQLAlchemy ORM model for Ambulance Assignments.
Represents dispatch linking an Ambulance to an EmergencyReport.
"""
from datetime import datetime
from typing import Optional
from sqlalchemy import String, Integer, Text, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base


class AmbulanceAssignment(Base):
    __tablename__ = "ambulance_assignments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    emergency_id: Mapped[int] = mapped_column(Integer, ForeignKey("emergency_reports.id"), nullable=False, index=True)
    ambulance_id: Mapped[int] = mapped_column(Integer, ForeignKey("ambulances.id"), nullable=False, index=True)

    status: Mapped[str] = mapped_column(
        String(50), nullable=False, default="DISPATCHED"
    )  # DISPATCHED, EN_ROUTE, ON_SCENE, TRANSPORTING, COMPLETED, CANCELLED

    estimated_eta_minutes: Mapped[int] = mapped_column(Integer, default=5)
    assigned_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    emergency = relationship("EmergencyReport", back_populates="assignments")
    ambulance = relationship("Ambulance", back_populates="assignments")
