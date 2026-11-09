"""
Service layer for Ambulance Assignments.
Links ambulances to emergencies and coordinates status transitions.
"""
from datetime import datetime
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.models.assignment import AmbulanceAssignment
from app.models.ambulance import Ambulance
from app.models.emergency import EmergencyReport, EmergencyStatusHistory
from app.schemas.assignment import AssignmentCreate
from app.services.geo import haversine_distance_km, estimate_eta_minutes


def create_assignment(db: Session, assign_in: AssignmentCreate) -> AmbulanceAssignment:
    # Validate emergency and ambulance exist
    emergency = db.query(EmergencyReport).filter(EmergencyReport.id == assign_in.emergency_id).first()
    if not emergency:
        raise ValueError(f"Emergency report with ID {assign_in.emergency_id} not found.")

    ambulance = db.query(Ambulance).filter(Ambulance.id == assign_in.ambulance_id).first()
    if not ambulance:
        raise ValueError(f"Ambulance with ID {assign_in.ambulance_id} not found.")

    # Calculate distance and ETA
    dist = haversine_distance_km(emergency.latitude, emergency.longitude, ambulance.latitude, ambulance.longitude)
    eta = estimate_eta_minutes(dist, emergency.severity)

    assignment = AmbulanceAssignment(
        emergency_id=assign_in.emergency_id,
        ambulance_id=assign_in.ambulance_id,
        status="DISPATCHED",
        estimated_eta_minutes=assign_in.estimated_eta_minutes or eta,
        notes=assign_in.notes or f"Dispatched {ambulance.ambulance_id} to incident {emergency.incident_code} (distance: {dist} km).",
    )
    db.add(assignment)

    # Update ambulance status to EN_ROUTE or BUSY
    ambulance.status = "EN_ROUTE"
    # Update emergency status to ASSIGNED
    old_status = emergency.status
    emergency.status = "ASSIGNED"

    history = EmergencyStatusHistory(
        emergency_id=emergency.id,
        from_status=old_status,
        to_status="ASSIGNED",
        changed_by="DISPATCHER",
        notes=f"Assigned unit {ambulance.ambulance_id} ({ambulance.type}). ETA: {assignment.estimated_eta_minutes} mins.",
    )
    db.add(history)

    db.commit()
    db.refresh(assignment)
    return assignment


def list_assignments(db: Session, skip: int = 0, limit: int = 50) -> List[AmbulanceAssignment]:
    return db.query(AmbulanceAssignment).order_by(desc(AmbulanceAssignment.assigned_at)).offset(skip).limit(limit).all()


def get_assignment_by_id(db: Session, assignment_id: int) -> Optional[AmbulanceAssignment]:
    return db.query(AmbulanceAssignment).filter(AmbulanceAssignment.id == assignment_id).first()


def get_assignments_by_emergency(db: Session, emergency_id: int) -> List[AmbulanceAssignment]:
    return (
        db.query(AmbulanceAssignment)
        .filter(AmbulanceAssignment.emergency_id == emergency_id)
        .order_by(desc(AmbulanceAssignment.assigned_at))
        .all()
    )
