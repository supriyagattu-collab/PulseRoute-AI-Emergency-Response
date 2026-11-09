"""
REST API router for Ambulances and status updates.
"""
import asyncio
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.ambulance import (
    AmbulanceResponse,
    AmbulanceUpdateStatus,
    AmbulanceUpdateLocation,
)
from app.services import ambulance_service
from app.websocket.manager import manager
from app.auth.dependencies import require_roles

router = APIRouter(prefix="/ambulances", tags=["Ambulances"])


@router.get(
    "",
    response_model=List[AmbulanceResponse],
    summary="List all Ambulances",
)
def list_ambulances(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    type: Optional[str] = Query(None, description="Filter by vehicle type: ALS, BLS"),
    status: Optional[str] = Query(None, description="Filter by status: AVAILABLE, BUSY, EN_ROUTE, ON_SCENE, TRANSPORTING, MAINTENANCE"),
    db: Session = Depends(get_db),
):
    """
    List all fleet ambulances with optional filtering by readiness and type.
    """
    return ambulance_service.list_ambulances(db, skip=skip, limit=limit, ambulance_type=type, status=status)


@router.get(
    "/nearest",
    summary="Find Nearest Available Ambulance",
)
def find_nearest_ambulance(
    lat: float = Query(..., ge=-90.0, le=90.0),
    lng: float = Query(..., ge=-180.0, le=180.0),
    type: Optional[str] = Query(None, description="Preferred unit type: ALS or BLS"),
    db: Session = Depends(get_db),
):
    """
    Locates the closest available vehicle among active fleet units.
    """
    nearest = ambulance_service.find_nearest_ambulance(db, patient_lat=lat, patient_lng=lng, required_type=type)
    if not nearest:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No available ambulances found in the fleet matching your requirements.",
        )
    return {
        "ambulance": AmbulanceResponse.model_validate(nearest["ambulance"]),
        "distance_km": nearest["distance_km"],
        "estimated_eta_minutes": nearest["estimated_eta_minutes"],
    }


@router.get(
    "/{ambulance_id}",
    response_model=AmbulanceResponse,
    summary="Retrieve an Ambulance by ID",
)
def get_ambulance(
    ambulance_id: int,
    db: Session = Depends(get_db),
):
    """
    Get detailed records for a single ambulance unit.
    """
    amb = ambulance_service.get_ambulance_by_id(db, ambulance_id)
    if not amb:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Ambulance with ID {ambulance_id} was not found.",
        )
    return amb


@router.patch(
    "/{ambulance_id}/status",
    response_model=AmbulanceResponse,
    summary="Update Demo Ambulance Status",
)
def update_ambulance_status(
    ambulance_id: int,
    payload: AmbulanceUpdateStatus,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_roles(["DRIVER", "DISPATCHER"])),
):
    """
    Update status of an ambulance.
    Protected: Only DRIVER, DISPATCHER, and ADMIN roles may change ambulance status.
    """
    updated = ambulance_service.update_ambulance_status(db, ambulance_id, payload)
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Ambulance with ID {ambulance_id} was not found.",
        )
    return updated


@router.patch(
    "/{ambulance_id}/location",
    response_model=AmbulanceResponse,
    summary="Update Demo Ambulance Coordinates & Speed",
)
async def update_ambulance_location(
    ambulance_id: int,
    payload: AmbulanceUpdateLocation,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_roles(["DRIVER", "DISPATCHER"])),
):
    """
    Update GPS location and instantaneous speed for an ambulance.
    Protected: Only DRIVER, DISPATCHER, and ADMIN roles may stream location updates.
    Broadcasts the new coordinates to all connected WebSocket clients.
    """
    updated = ambulance_service.update_ambulance_location(db, ambulance_id, payload)
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Ambulance with ID {ambulance_id} was not found.",
        )
    # Broadcast GPS update to all connected WebSocket clients (fire-and-forget)
    await manager.broadcast_ambulance_location(
        ambulance_id=updated.id,
        ambulance_code=updated.ambulance_id,
        lat=updated.latitude,
        lng=updated.longitude,
        speed_kmh=updated.speed_kmh,
        status=updated.status,
    )
    return updated
