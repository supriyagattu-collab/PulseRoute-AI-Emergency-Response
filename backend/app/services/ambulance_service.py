"""
Service layer for Ambulances and status/location updates.
"""
from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.ambulance import Ambulance
from app.schemas.ambulance import AmbulanceCreate, AmbulanceUpdateStatus, AmbulanceUpdateLocation
from app.services.geo import haversine_distance_km, estimate_eta_minutes


def get_ambulance_by_id(db: Session, ambulance_id: int) -> Optional[Ambulance]:
    return db.query(Ambulance).filter(Ambulance.id == ambulance_id).first()


def get_ambulance_by_code(db: Session, code: str) -> Optional[Ambulance]:
    return db.query(Ambulance).filter(Ambulance.ambulance_id == code.upper()).first()


def list_ambulances(
    db: Session,
    skip: int = 0,
    limit: int = 50,
    ambulance_type: Optional[str] = None,
    status: Optional[str] = None,
) -> List[Ambulance]:
    query = db.query(Ambulance)
    if ambulance_type:
        query = query.filter(Ambulance.type == ambulance_type.upper())
    if status:
        query = query.filter(Ambulance.status == status.upper())
    return query.offset(skip).limit(limit).all()


def update_ambulance_status(
    db: Session, ambulance_id: int, status_in: AmbulanceUpdateStatus
) -> Optional[Ambulance]:
    amb = get_ambulance_by_id(db, ambulance_id)
    if not amb:
        return None
    amb.status = status_in.status.upper()
    db.commit()
    db.refresh(amb)
    return amb


def update_ambulance_location(
    db: Session, ambulance_id: int, loc_in: AmbulanceUpdateLocation
) -> Optional[Ambulance]:
    amb = get_ambulance_by_id(db, ambulance_id)
    if not amb:
        return None
    amb.latitude = loc_in.latitude
    amb.longitude = loc_in.longitude
    if loc_in.speed_kmh is not None:
        amb.speed_kmh = loc_in.speed_kmh
    db.commit()
    db.refresh(amb)
    return amb


def find_nearest_ambulance(
    db: Session,
    patient_lat: float,
    patient_lng: float,
    required_type: Optional[str] = None,
) -> Optional[dict]:
    """
    Finds the closest available ambulance among active fleet units.
    Never returns BUSY, MAINTENANCE, or otherwise non-AVAILABLE units.
    """
    # Base query strictly enforces AVAILABLE and active units
    base_query = db.query(Ambulance).filter(
        Ambulance.status == "AVAILABLE",
        Ambulance.is_active.is_(True),
    )

    candidates = []
    if required_type and required_type.upper() != "ANY":
        # 1. First attempt: match required capability (ALS / BLS) among available units
        candidates = base_query.filter(Ambulance.type == required_type.upper()).all()

    if not candidates:
        # 2. Fallback: find ANY AVAILABLE ambulance regardless of vehicle type
        candidates = base_query.all()

    # 3. If no available ambulance exists at all (all busy/maintenance), return None
    if not candidates:
        return None

    scored = []
    for amb in candidates:
        dist = haversine_distance_km(patient_lat, patient_lng, amb.latitude, amb.longitude)
        eta = estimate_eta_minutes(dist)
        scored.append({"ambulance": amb, "distance_km": dist, "estimated_eta_minutes": eta})

    scored.sort(key=lambda x: x["distance_km"])
    return scored[0]
