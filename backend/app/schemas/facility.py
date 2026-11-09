"""
Pydantic schemas for Healthcare Facilities.
"""
from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class FacilityBase(BaseModel):
    facility_name: str = Field(..., max_length=255)
    facility_type: str = Field(..., max_length=100)
    nin_id: Optional[str] = None
    state: Optional[str] = "Telangana"
    district: Optional[str] = None
    mandal: Optional[str] = None
    municipality: Optional[str] = None
    address: Optional[str] = None
    pincode: Optional[str] = None
    latitude: float = Field(..., ge=-90.0, le=90.0)
    longitude: float = Field(..., ge=-180.0, le=180.0)
    department: Optional[str] = None
    services: Optional[str] = None
    total_icu_beds: int = Field(default=20, ge=0)
    available_icu_beds: int = Field(default=5, ge=0)
    total_general_beds: int = Field(default=100, ge=0)
    available_general_beds: int = Field(default=25, ge=0)
    emergency_phone: Optional[str] = None
    trauma_level: str = "Level 2 Trauma Center"
    has_cath_lab: bool = False
    has_ct_scan: bool = True


class FacilityCreate(FacilityBase):
    object_id: Optional[int] = None


class FacilityUpdateCapacity(BaseModel):
    available_icu_beds: Optional[int] = Field(None, ge=0)
    available_general_beds: Optional[int] = Field(None, ge=0)


class FacilityResponse(FacilityBase):
    id: int
    object_id: Optional[int] = None
    created_at: Optional[datetime] = None
    distance_km: Optional[float] = None
    estimated_eta_minutes: Optional[int] = None
    match_score: Optional[int] = None
    matched_specialty: Optional[str] = None
    specialties: Optional[List[str]] = None
    match_reasons: Optional[List[str]] = None
    missing_information: Optional[List[str]] = None
    traffic_status: Optional[str] = None
    score_breakdown: Optional[Dict[str, Any]] = None

    model_config = ConfigDict(from_attributes=True)
