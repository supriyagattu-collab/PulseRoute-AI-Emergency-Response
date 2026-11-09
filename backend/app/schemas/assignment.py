"""
Pydantic schemas for Ambulance Assignments.
"""
from typing import Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field
from app.schemas.ambulance import AmbulanceResponse
from app.schemas.emergency import EmergencyResponse


class AssignmentBase(BaseModel):
    emergency_id: int
    ambulance_id: int
    status: str = Field(
        default="DISPATCHED",
        examples=["DISPATCHED", "EN_ROUTE", "ON_SCENE", "TRANSPORTING", "COMPLETED", "CANCELLED"],
    )
    estimated_eta_minutes: int = Field(default=5, ge=0)
    notes: Optional[str] = None


class AssignmentCreate(AssignmentBase):
    pass


class AssignmentResponse(AssignmentBase):
    id: int
    assigned_at: datetime
    completed_at: Optional[datetime] = None
    emergency: Optional[EmergencyResponse] = None
    ambulance: Optional[AmbulanceResponse] = None

    model_config = ConfigDict(from_attributes=True)
