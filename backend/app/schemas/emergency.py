"""
Pydantic schemas for Emergency Reports.
"""
from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class EmergencyBase(BaseModel):
    patient_name: str = Field(..., min_length=1, max_length=150)
    contact_phone: str = Field(..., min_length=7, max_length=50)
    patient_age: Optional[int] = Field(None, ge=0, le=130)
    gender: Optional[str] = Field("UNKNOWN", max_length=20)
    emergency_type: str = Field(
        default="GENERAL",
        examples=["CARDIAC", "TRAUMA", "RESPIRATORY", "STROKE", "MATERNITY", "GENERAL"],
    )
    severity: str = Field(
        default="CRITICAL",
        examples=["CRITICAL", "SERIOUS", "MODERATE", "ROUTINE"],
    )
    consciousness: Optional[str] = Field(None, examples=["CONSCIOUS", "SEMICONSCIOUS", "UNRESPONSIVE"])
    breathing: Optional[str] = Field(None, examples=["NORMAL", "DIFFICULT", "APNEA"])
    incident_address: str = Field(..., min_length=3)
    latitude: float = Field(..., ge=-90.0, le=90.0)
    longitude: float = Field(..., ge=-180.0, le=180.0)
    symptoms: Optional[str] = None
    caller_name: Optional[str] = None
    creator_id: Optional[str] = None
    destination_facility_id: Optional[int] = None


class EmergencyCreate(EmergencyBase):
    incident_code: Optional[str] = None


class EmergencyUpdateStatus(BaseModel):
    status: str = Field(
        ...,
        examples=["REPORTED", "ASSIGNED", "EN_ROUTE", "ON_SCENE", "TRANSPORTING", "RESOLVED", "CANCELLED"],
    )
    notes: Optional[str] = Field(None, description="Reason or context for status transition")
    changed_by: Optional[str] = Field("SYSTEM", description="Actor who changed the status (DISPATCHER, DRIVER, SYSTEM, REPORTER)")


class EmergencyStatusHistoryResponse(BaseModel):
    id: int
    emergency_id: int
    from_status: Optional[str] = None
    to_status: str
    changed_by: Optional[str] = "SYSTEM"
    notes: Optional[str] = None
    changed_at: datetime

    model_config = ConfigDict(from_attributes=True)


class EmergencyResponse(EmergencyBase):
    id: int
    incident_code: str
    status: str
    reported_at: datetime
    resolved_at: Optional[datetime] = None
    status_history: List[EmergencyStatusHistoryResponse] = []

    model_config = ConfigDict(from_attributes=True)
