"""
Pydantic schemas for Ambulances.
"""
from typing import Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class AmbulanceBase(BaseModel):
    ambulance_id: str = Field(..., max_length=50, examples=["AMB001"])
    vehicle_number: str = Field(..., max_length=50, examples=["TS-09-EA-1081"])
    type: str = Field(default="BLS", examples=["ALS", "BLS"])
    status: str = Field(
        default="AVAILABLE",
        examples=["AVAILABLE", "BUSY", "EN_ROUTE", "ON_SCENE", "TRANSPORTING", "MAINTENANCE"],
    )
    latitude: float = Field(..., ge=-90.0, le=90.0)
    longitude: float = Field(..., ge=-180.0, le=180.0)
    driver_name: Optional[str] = None
    driver_contact: Optional[str] = None
    base_station: Optional[str] = None
    fuel_oxygen_level: str = "95%"
    equipment: Optional[str] = None
    speed_kmh: float = 0.0
    is_active: bool = True


class AmbulanceCreate(AmbulanceBase):
    pass


class AmbulanceUpdateStatus(BaseModel):
    status: str = Field(
        ...,
        examples=["AVAILABLE", "BUSY", "EN_ROUTE", "ON_SCENE", "TRANSPORTING", "MAINTENANCE"],
    )


class AmbulanceUpdateLocation(BaseModel):
    latitude: float = Field(..., ge=-90.0, le=90.0)
    longitude: float = Field(..., ge=-180.0, le=180.0)
    speed_kmh: Optional[float] = 0.0


class AmbulanceResponse(AmbulanceBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    distance_km: Optional[float] = None
    estimated_eta_minutes: Optional[int] = None

    model_config = ConfigDict(from_attributes=True)
