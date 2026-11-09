"""
REST API router for Healthcare Facilities.
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.facility import FacilityResponse, FacilityUpdateCapacity
from app.services import facility_service
from app.auth.dependencies import require_roles

router = APIRouter(prefix="/facilities", tags=["Healthcare Facilities"])


@router.get(
    "",
    response_model=List[FacilityResponse],
    summary="List Healthcare Facilities",
)
def list_facilities(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=250),
    type: Optional[str] = Query(None, description="Filter by facility type (e.g. Teaching Hospital, UPHC, PHC)"),
    district: Optional[str] = Query(None, description="Filter by district (e.g. Hyderabad, Rangareddy)"),
    db: Session = Depends(get_db),
):
    """
    List facilities from the imported healthcare dataset.
    """
    return facility_service.list_facilities(db, skip=skip, limit=limit, facility_type=type, district=district)


@router.get(
    "/recommendations",
    response_model=List[FacilityResponse],
    summary="Get Top Ranked Hospital Recommendations",
)
def get_recommendations(
    patient_lat: float = Query(..., ge=-90.0, le=90.0, description="Patient GPS latitude"),
    patient_lng: float = Query(..., ge=-180.0, le=180.0, description="Patient GPS longitude"),
    emergency_type: str = Query("GENERAL", description="Emergency condition: CARDIAC, ACCIDENT, STROKE, MATERNITY, GENERAL"),
    limit: int = Query(5, ge=1, le=25, description="Number of top hospitals to return (default: 5)"),
    db: Session = Depends(get_db),
):
    """
    Milestone 7: Transparent weighted AI hospital recommendation and ranking engine.
    Ranks top healthcare facilities based on clinical specialty match, Haversine distance,
    bed capacity, and 24/7 emergency service readiness.
    """
    return facility_service.get_top_hospital_recommendations(
        db,
        patient_lat=patient_lat,
        patient_lng=patient_lng,
        emergency_type=emergency_type,
        limit=limit,
    )


@router.get(
    "/search",
    response_model=List[FacilityResponse],
    summary="Search & Rank Healthcare Facilities",
)
def search_facilities(
    q: Optional[str] = Query(None, description="Search term for name, address, or mandal"),
    district: Optional[str] = Query(None, description="District name"),
    type: Optional[str] = Query(None, description="Facility type"),
    patient_lat: Optional[float] = Query(None, ge=-90.0, le=90.0, description="Patient GPS latitude"),
    patient_lng: Optional[float] = Query(None, ge=-180.0, le=180.0, description="Patient GPS longitude"),
    condition: Optional[str] = Query(None, description="Emergency condition (e.g. CARDIAC, TRAUMA, MATERNITY)"),
    limit: int = Query(25, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """
    Search facilities with dynamic Haversine distance and multi-criteria AI triage recommendation ranking.
    """
    return facility_service.search_facilities(
        db,
        q=q,
        district=district,
        facility_type=type,
        patient_lat=patient_lat,
        patient_lng=patient_lng,
        condition=condition,
        limit=limit,
    )


@router.get(
    "/{facility_id}",
    response_model=FacilityResponse,
    summary="Retrieve a Healthcare Facility by ID",
)
def get_facility(
    facility_id: int,
    db: Session = Depends(get_db),
):
    """
    Get detailed records for a single healthcare facility.
    """
    fac = facility_service.get_facility_by_id(db, facility_id)
    if not fac:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Facility with ID {facility_id} was not found.",
        )
    return fac


@router.patch(
    "/{facility_id}/capacity",
    response_model=FacilityResponse,
    summary="Update Facility Bed Capacity",
)
def update_facility_capacity(
    facility_id: int,
    payload: FacilityUpdateCapacity,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_roles(["HOSPITAL"])),
):
    """
    Update ICU and general bed capacity numbers.
    Protected: Only HOSPITAL and ADMIN roles may modify facility capacity.
    """
    updated = facility_service.update_facility_capacity(db, facility_id, payload)
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Facility with ID {facility_id} was not found.",
        )
    return updated
