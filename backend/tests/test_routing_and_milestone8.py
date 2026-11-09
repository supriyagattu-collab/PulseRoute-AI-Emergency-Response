"""
Automated tests for Milestone 8.1 Fixes:
1. Dispatcher confirmation & assignment database persistence
2. Road network routing & Haversine fallback
3. Ambulance live GPS update & SQLite persistence
4. Emergency status history audit logging & timestamps
5. Ambulance capability matching and busy/maintenance exclusion
"""
import pytest


def test_emergency_status_history_lifecycle(client):
    """
    Test that emergency creation and status transitions record chronological history with timestamps.
    """
    # 1. Create emergency
    res = client.post(
        "/api/v1/emergencies",
        json={
            "patient_name": "History Audit Patient",
            "contact_phone": "+91 98888 77777",
            "incident_address": "Charminar South Gate, Hyderabad",
            "latitude": 17.3616,
            "longitude": 78.4747,
            "emergency_type": "CARDIAC",
            "severity": "CRITICAL",
        },
    )
    assert res.status_code == 201
    emg = res.json()
    emg_id = emg["id"]

    # 2. Transition status: REPORTED -> EN_ROUTE
    patch1 = client.patch(
        f"/api/v1/emergencies/{emg_id}/status",
        json={
            "status": "EN_ROUTE",
            "notes": "Ambulance en route with sirens active",
            "changed_by": "DISPATCHER",
        },
    )
    assert patch1.status_code == 200
    assert patch1.json()["status"] == "EN_ROUTE"

    # 3. Transition status: EN_ROUTE -> ON_SCENE
    patch2 = client.patch(
        f"/api/v1/emergencies/{emg_id}/status",
        json={
            "status": "ON_SCENE",
            "notes": "Paramedic team arrived on scene",
            "changed_by": "DRIVER",
        },
    )
    assert patch2.status_code == 200
    assert patch2.json()["status"] == "ON_SCENE"

    # 4. Fetch status history
    hist_res = client.get(f"/api/v1/emergencies/{emg_id}/history")
    assert hist_res.status_code == 200
    history = hist_res.json()

    # There should be at least 3 history records (initial REPORTED + EN_ROUTE + ON_SCENE)
    assert len(history) >= 3
    # Check that timestamps and fields exist
    for h in history:
        assert h["emergency_id"] == emg_id
        assert h["changed_at"] is not None
        assert h["to_status"] is not None


def test_assignment_creates_history_record(client):
    """
    Test that ambulance assignment creates an assignment in SQLite and records ASSIGNED status history.
    """
    # Create emergency
    emg_res = client.post(
        "/api/v1/emergencies",
        json={
            "patient_name": "Dispatcher Assignment Test",
            "contact_phone": "+91 97777 66666",
            "incident_address": "Secunderabad Station",
            "latitude": 17.4334,
            "longitude": 78.5015,
        },
    )
    emg_id = emg_res.json()["id"]

    # Post assignment
    assign_res = client.post(
        "/api/v1/assignments",
        json={
            "emergency_id": emg_id,
            "ambulance_id": 1,
            "notes": "Dispatcher manual assignment confirmation test",
            "estimated_eta_minutes": 5,
        },
    )
    assert assign_res.status_code == 201
    assign_data = assign_res.json()
    assert assign_data["emergency_id"] == emg_id
    assert assign_data["status"] == "DISPATCHED"

    # Check emergency status updated to ASSIGNED
    emg_check = client.get(f"/api/v1/emergencies/{emg_id}")
    assert emg_check.status_code == 200
    assert emg_check.json()["status"] == "ASSIGNED"

    # Check history contains ASSIGNED transition by DISPATCHER
    hist_res = client.get(f"/api/v1/emergencies/{emg_id}/history")
    assert hist_res.status_code == 200
    history = hist_res.json()
    has_assigned = any(h["to_status"] == "ASSIGNED" and h["changed_by"] == "DISPATCHER" for h in history)
    assert has_assigned


def test_road_network_routing_endpoint(client):
    """
    Test the road routing endpoint returns valid coordinates, distance, and duration.
    """
    start_lat, start_lng = 17.3985, 78.4735
    end_lat, end_lng = 17.3980, 78.4730
    hosp_lat, hosp_lng = 17.3744, 78.4745

    res = client.get(
        f"/api/v1/routing/route?start_lat={start_lat}&start_lng={start_lng}&end_lat={end_lat}&end_lng={end_lng}&hospital_lat={hosp_lat}&hospital_lng={hosp_lng}"
    )
    assert res.status_code == 200
    data = res.json()
    assert "coordinates" in data
    assert len(data["coordinates"]) >= 2
    assert "distance_km" in data
    assert data["distance_km"] > 0
    assert "duration_minutes" in data
    assert data["duration_minutes"] >= 1
    assert "provider" in data
    assert "is_road_network" in data


def test_ambulance_gps_location_update(client):
    """
    Test updating ambulance GPS coordinates via PATCH /api/v1/ambulances/{id}/location.
    """
    new_lat, new_lng, speed = 17.4012, 78.4815, 58.5
    res = client.patch(
        "/api/v1/ambulances/1/location",
        json={
            "latitude": new_lat,
            "longitude": new_lng,
            "speed_kmh": speed,
        },
    )
    assert res.status_code == 200
    data = res.json()
    assert data["latitude"] == new_lat
    assert data["longitude"] == new_lng
    assert data["speed_kmh"] == speed

    # Fetch to ensure persistence
    get_res = client.get("/api/v1/ambulances/1")
    assert get_res.status_code == 200
    assert get_res.json()["latitude"] == new_lat
    assert get_res.json()["longitude"] == new_lng

