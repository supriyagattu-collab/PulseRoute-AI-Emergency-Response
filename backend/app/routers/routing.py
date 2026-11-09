"""
REST API router for Road Network Route Calculations (OSRM with Haversine Fallback).
"""
from typing import List, Optional
from fastapi import APIRouter, Query, status
from pydantic import BaseModel, Field
from app.services.geo import fetch_road_route, haversine_distance_km, estimate_eta_minutes

router = APIRouter(prefix="/routing", tags=["Road Routing & Navigation"])


class RouteResponse(BaseModel):
    coordinates: List[List[float]] = Field(..., description="List of [latitude, longitude] pairs for polyline rendering")
    distance_km: float
    duration_minutes: int
    is_road_network: bool
    provider: str
    error: Optional[str] = None


@router.get(
    "/route",
    response_model=RouteResponse,
    summary="Calculate Road Network Route",
)
def get_road_route(
    start_lat: float = Query(..., ge=-90.0, le=90.0, description="Start latitude (e.g. Ambulance)"),
    start_lng: float = Query(..., ge=-180.0, le=180.0, description="Start longitude"),
    end_lat: float = Query(..., ge=-90.0, le=90.0, description="Destination latitude (e.g. Patient)"),
    end_lng: float = Query(..., ge=-180.0, le=180.0, description="Destination longitude"),
    hospital_lat: Optional[float] = Query(None, ge=-90.0, le=90.0, description="Optional Hospital latitude"),
    hospital_lng: Optional[float] = Query(None, ge=-180.0, le=180.0, description="Optional Hospital longitude"),
):
    """
    Computes driving road network route using OSRM.
    If external OSRM service is unreachable or errors, falls back to geodesic Haversine distance.
    """
    waypoints = [(start_lat, start_lng), (end_lat, end_lng)]
    if hospital_lat is not None and hospital_lng is not None:
        waypoints.append((hospital_lat, hospital_lng))

    result = fetch_road_route(waypoints)
    return result

