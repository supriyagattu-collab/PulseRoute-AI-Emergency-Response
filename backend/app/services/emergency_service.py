"""
Service layer for Emergency Reports lifecycle.
"""
import uuid
from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.models.emergency import EmergencyReport, EmergencyStatusHistory
from app.schemas.emergency import EmergencyCreate, EmergencyUpdateStatus


def generate_incident_code(db: Session) -> str:
    """
    Generate readable unique incident code like EMG-1001.
    """
    count = db.query(EmergencyReport).count()
    return f"EMG-{1001 + count}"


def create_emergency(db: Session, emergency_in: EmergencyCreate) -> EmergencyReport:
    incident_code = emergency_in.incident_code or generate_incident_code(db)
    
    # Ensure incident_code is unique
    existing = db.query(EmergencyReport).filter(EmergencyReport.incident_code == incident_code).first()
    if existing:
        incident_code = f"EMG-{uuid.uuid4().hex[:6].upper()}"

    db_obj = EmergencyReport(
        incident_code=incident_code,
        patient_name=emergency_in.patient_name,
        contact_phone=emergency_in.contact_phone,
        patient_age=emergency_in.patient_age,
        gender=emergency_in.gender,
        emergency_type=emergency_in.emergency_type,
        severity=emergency_in.severity,
        status="REPORTED",
        consciousness=emergency_in.consciousness,
        breathing=emergency_in.breathing,
        incident_address=emergency_in.incident_address,
        latitude=emergency_in.latitude,
        longitude=emergency_in.longitude,
        symptoms=emergency_in.symptoms,
        caller_name=emergency_in.caller_name,
        creator_id=emergency_in.creator_id,
        destination_facility_id=emergency_in.destination_facility_id,
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)

    # Record initial status in EmergencyStatusHistory
    initial_history = EmergencyStatusHistory(
        emergency_id=db_obj.id,
        from_status=None,
        to_status="REPORTED",
        changed_by=db_obj.caller_name or "SYSTEM",
        notes=f"Emergency incident reported ({db_obj.emergency_type} - {db_obj.severity}).",
    )
    db.add(initial_history)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def get_emergency_by_id(db: Session, emergency_id: int) -> Optional[EmergencyReport]:
    return db.query(EmergencyReport).filter(EmergencyReport.id == emergency_id).first()


def get_emergency_by_code(db: Session, incident_code: str) -> Optional[EmergencyReport]:
    return db.query(EmergencyReport).filter(EmergencyReport.incident_code == incident_code).first()


def list_emergencies(
    db: Session,
    skip: int = 0,
    limit: int = 50,
    severity: Optional[str] = None,
    status: Optional[str] = None,
) -> List[EmergencyReport]:
    query = db.query(EmergencyReport)
    if severity:
        query = query.filter(EmergencyReport.severity == severity.upper())
    if status:
        query = query.filter(EmergencyReport.status == status.upper())
    return query.order_by(desc(EmergencyReport.reported_at)).offset(skip).limit(limit).all()


def update_emergency_status(
    db: Session, emergency_id: int, status_update: EmergencyUpdateStatus
) -> Optional[EmergencyReport]:
    emergency = get_emergency_by_id(db, emergency_id)
    if not emergency:
        return None
    old_status = emergency.status
    new_status = status_update.status.upper()
    emergency.status = new_status
    if emergency.status in ["RESOLVED", "CANCELLED"] and not emergency.resolved_at:
        emergency.resolved_at = datetime.now(timezone.utc)

    # Record history transition
    history = EmergencyStatusHistory(
        emergency_id=emergency.id,
        from_status=old_status,
        to_status=new_status,
        changed_by=status_update.changed_by or "SYSTEM",
        notes=status_update.notes or f"Status changed from {old_status} to {new_status}.",
    )
    db.add(history)
    db.commit()
    db.refresh(emergency)
    return emergency


def get_emergency_status_history(db: Session, emergency_id: int) -> List[EmergencyStatusHistory]:
    return (
        db.query(EmergencyStatusHistory)
        .filter(EmergencyStatusHistory.emergency_id == emergency_id)
        .order_by(desc(EmergencyStatusHistory.changed_at))
        .all()
    )
