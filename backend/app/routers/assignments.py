"""
REST API router for Ambulance Assignments with RBAC & Security (Milestone 9.2).
"""
import asyncio
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.assignment import AssignmentCreate, AssignmentResponse
from app.services import assignment_service
from app.websocket.manager import manager
from app.auth.dependencies import require_roles

router = APIRouter(prefix="/assignments", tags=["Ambulance Assignments"])


@router.post(
    "",
    response_model=AssignmentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create an Ambulance Assignment",
)
async def create_ambulance_assignment(
    payload: AssignmentCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_roles(["DISPATCHER"])),
):
    """
    Dispatch an ambulance to an active emergency report.
    Protected: Only DISPATCHER and ADMIN roles may create dispatch assignments.
    """
    try:
        assignment = assignment_service.create_assignment(db, payload)
        # Broadcast new assignment to all connected WebSocket clients
        await manager.broadcast_assignment_created(
            assignment_id=assignment.id,
            emergency_id=assignment.emergency_id,
            incident_code=getattr(assignment.emergency, "incident_code", f"EMG-{assignment.emergency_id}"),
            ambulance_id=assignment.ambulance_id,
            ambulance_code=getattr(assignment.ambulance, "ambulance_id", f"AMB-{assignment.ambulance_id}"),
            estimated_eta_minutes=assignment.estimated_eta_minutes or 0,
        )
        return assignment
    except ValueError as val_err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(val_err),
        )


@router.get(
    "",
    response_model=List[AssignmentResponse],
    summary="List all Ambulance Assignments",
)
def list_ambulance_assignments(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_roles(["DISPATCHER", "DRIVER", "HOSPITAL"])),
):
    """
    List historical and current ambulance dispatch assignments.
    """
    return assignment_service.list_assignments(db, skip=skip, limit=limit)


@router.get(
    "/{assignment_id}",
    response_model=AssignmentResponse,
    summary="Retrieve an Assignment by ID",
)
def get_assignment(
    assignment_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_roles(["DISPATCHER", "DRIVER", "HOSPITAL"])),
):
    """
    Get assignment details.
    """
    assign = assignment_service.get_assignment_by_id(db, assignment_id)
    if not assign:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Assignment with ID {assignment_id} was not found.",
        )
    return assign


@router.get(
    "/emergency/{emergency_id}",
    response_model=List[AssignmentResponse],
    summary="Retrieve Assignments for a Specific Emergency",
)
def get_assignments_for_emergency(
    emergency_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_roles(["DISPATCHER", "DRIVER", "HOSPITAL"])),
):
    """
    List all dispatch assignments linked to an emergency report.
    """
    return assignment_service.get_assignments_by_emergency(db, emergency_id)
