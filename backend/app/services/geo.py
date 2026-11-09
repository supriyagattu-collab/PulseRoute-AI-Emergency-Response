"""
Geospatial calculation utilities for distance, transit estimation, and road-network routing.
"""
import math
import urllib.request
import json
from typing import Tuple, List, Optional



def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate the great circle distance in kilometers between two points
    on the earth (specified in decimal degrees).
    """
    if not (-90.0 <= lat1 <= 90.0 and -180.0 <= lon1 <= 180.0):
        return 999.0
    if not (-90.0 <= lat2 <= 90.0 and -180.0 <= lon2 <= 180.0):
        return 999.0

    # Earth radius in kilometers
    r = 6371.0

    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = (
        math.sin(delta_phi / 2.0) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2
    )
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return round(r * c, 2)


def estimate_eta_minutes(distance_km: float, priority: str = "CRITICAL") -> int:
    """
    Estimate vehicle transit time in minutes based on distance and siren priority.
    """
    speed_kmh = 45.0 if priority == "CRITICAL" else 35.0
    hours = distance_km / speed_kmh
    # Add 2 minutes dispatch and mobilization latency
    return max(2, round(hours * 60.0 + 2))


def is_valid_telangana_coordinate(lat: float, lon: float) -> bool:
    """
    Sanity check that coordinates fall roughly within Telangana bounding box.
    Lat ~ 15.8 to 19.9, Lon ~ 77.2 to 81.3
    """
    return 15.0 <= lat <= 20.5 and 76.5 <= lon <= 82.0


def fetch_road_route(
    waypoints: List[Tuple[float, float]],
    osrm_url: str = "https://router.project-osrm.org",
    timeout: float = 3.5,
) -> dict:
    """
    Calculate driving road network route using OSRM with graceful Haversine fallback.
    waypoints: list of (latitude, longitude) tuples.
    """
    if len(waypoints) < 2:
        return {
            "coordinates": [[lat, lng] for lat, lng in waypoints],
            "distance_km": 0.0,
            "duration_minutes": 0,
            "is_road_network": False,
            "provider": "Invalid Waypoints",
            "error": "At least two waypoints required.",
        }

    # Format OSRM coordinates: lon1,lat1;lon2,lat2
    coords_param = ";".join(f"{round(lng, 6)},{round(lat, 6)}" for lat, lng in waypoints)
    url = f"{osrm_url.rstrip('/')}/route/v1/driving/{coords_param}?overview=full&geometries=geojson"

    try:
        req = urllib.request.Request(
            url,
            headers={"User-Agent": "PulseRoute-Emergency-System/1.0"},
        )
        with urllib.request.urlopen(req, timeout=timeout) as response:
            if response.status == 200:
                data = json.loads(response.read().decode("utf-8"))
                if data.get("code") == "Ok" and data.get("routes"):
                    primary = data["routes"][0]
                    # GeoJSON is [lon, lat], convert to Leaflet [lat, lon]
                    geojson_coords = primary["geometry"]["coordinates"]
                    route_lat_lngs = [[c[1], c[0]] for c in geojson_coords]
                    dist_km = round(primary.get("distance", 0.0) / 1000.0, 2)
                    dur_mins = max(1, round(primary.get("duration", 0.0) / 60.0))
                    return {
                        "coordinates": route_lat_lngs,
                        "distance_km": dist_km,
                        "duration_minutes": dur_mins,
                        "is_road_network": True,
                        "provider": "OSRM Road Network",
                        "error": None,
                    }
    except Exception as exc:
        pass  # Fall through gracefully to Haversine fallback

    # Haversine Fallback Calculation
    total_km = 0.0
    for i in range(len(waypoints) - 1):
        p1 = waypoints[i]
        p2 = waypoints[i + 1]
        total_km += haversine_distance_km(p1[0], p1[1], p2[0], p2[1])

    eta = estimate_eta_minutes(total_km)
    return {
        "coordinates": [[round(lat, 6), round(lng, 6)] for lat, lng in waypoints],
        "distance_km": round(total_km, 2),
        "duration_minutes": eta,
        "is_road_network": False,
        "provider": "Haversine Direct Geodesic (Fallback)",
        "error": "External OSRM service unavailable; using standard geodesic fallback.",
    }
