"""
REST API router for Emergency Reports with RBAC & Access Control (Milestone 9.2).
"""
import asyncio
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.emergency import (
    EmergencyCreate,
    EmergencyUpdateStatus,
    EmergencyResponse,
    EmergencyStatusHistoryResponse,
)
from app.services import emergency_service
from app.websocket.manager import manager
from app.auth.dependencies import (
    get_current_user,
    get_optional_current_user,
    check_emergency_access,
    validate_status_transition,
)
from app.auth.rate_limiter import rate_limit_sos

router = APIRouter(prefix="/emergencies", tags=["Emergency Reports"])


@router.post(
    "",
    response_model=EmergencyResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(rate_limit_sos)],
    summary="Create a new Emergency Report",
)
def create_emergency_report(
    payload: EmergencyCreate,
    db: Session = Depends(get_db),
    current_user: Optional[dict] = Depends(get_optional_current_user),
):
    """
    Ingest a new emergency incident with patient symptoms, severity, and GPS coordinates.
    Associates the reporting user ID if authenticated.
    """
    if current_user:
        payload.creator_id = current_user.get("sub")
        if not payload.caller_name:
            payload.caller_name = current_user.get("name") or current_user.get("sub")

    emergency = emergency_service.create_emergency(db, payload)
    return emergency


@router.get(
    "",
    response_model=List[EmergencyResponse],
    summary="List all Emergency Reports",
)
def list_emergency_reports(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    severity: Optional[str] = Query(None, description="Filter by severity: CRITICAL, SERIOUS, MODERATE, ROUTINE"),
    status: Optional[str] = Query(None, description="Filter by status: REPORTED, ASSIGNED, EN_ROUTE, ON_SCENE, TRANSPORTING, RESOLVED, CANCELLED"),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """
    Retrieve paginated emergency reports.
    - ADMIN and DISPATCHER: view all incidents.
    - PATIENT / REPORTER: restricted strictly to own reported emergencies.
    """
    all_reports = emergency_service.list_emergencies(db, skip=skip, limit=limit, severity=severity, status=status)
    user_role = str(current_user.get("role", "")).upper()

    if user_role in {"ADMIN", "DISPATCHER"}:
        return all_reports

    if user_role in {"PATIENT", "REPORTER"}:
        user_id = str(current_user.get("sub", ""))
        user_name = str(current_user.get("name", "")).strip().lower()
        return [
            e for e in all_reports
            if getattr(e, "creator_id", None) == user_id
            or e.caller_name == user_id
            or (user_name and e.patient_name.strip().lower() == user_name)
        ]

    return all_reports


@router.get(
    "/{emergency_id}",
    response_model=EmergencyResponse,
    summary="Retrieve an Emergency Report by ID",
)
def get_emergency_report(
    emergency_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """
    Get detailed records for a single emergency.
    Enforces RBAC: patients cannot view records belonging to other patients (403 Forbidden).
    """
    emergency = emergency_service.get_emergency_by_id(db, emergency_id)
    if not emergency:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Emergency report with ID {emergency_id} was not found.",
        )
    check_emergency_access(current_user, emergency)
    return emergency


@router.patch(
    "/{emergency_id}/status",
    response_model=EmergencyResponse,
    summary="Update Emergency Report Status",
)
async def update_emergency_status(
    emergency_id: int,
    payload: EmergencyUpdateStatus,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """
    Transition emergency status with RBAC authorization and state-machine validation.
    """
    emergency = emergency_service.get_emergency_by_id(db, emergency_id)
    if not emergency:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Emergency report with ID {emergency_id} was not found.",
        )

    # Validate state transition & permissions
    validate_status_transition(emergency.status, payload.status, current_user, emergency)

    # Actor recording
    payload.changed_by = current_user.get("role", payload.changed_by or "SYSTEM")

    updated = emergency_service.update_emergency_status(db, emergency_id, payload)
    
    # Broadcast status change to connected WebSocket clients
    await manager.broadcast_emergency_status(
        emergency_id=updated.id,
        incident_code=updated.incident_code,
        old_status=payload.status,
        new_status=updated.status,
        changed_by=payload.changed_by,
        notes=payload.notes or f"Status updated to {updated.status}.",
    )
    return updated


@router.get(
    "/{emergency_id}/history",
    response_model=List[EmergencyStatusHistoryResponse],
    summary="Retrieve Emergency Status Transition History",
)
def get_emergency_status_history(
    emergency_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """
    Retrieve chronological audit history for an incident (Protected by RBAC).
    """
    emergency = emergency_service.get_emergency_by_id(db, emergency_id)
    if not emergency:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Emergency report with ID {emergency_id} was not found.",
        )
    check_emergency_access(current_user, emergency)
    return emergency_service.get_emergency_status_history(db, emergency_id)
