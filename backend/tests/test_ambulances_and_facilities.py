"""
Tests for Ambulances, Facilities, and Assignments APIs.
"""


def test_list_ambulances(client):
    response = client.get("/api/v1/ambulances")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1
    assert data[0]["ambulance_id"] == "AMB001"


def test_update_ambulance_status(client):
    response = client.patch("/api/v1/ambulances/1/status", json={"status": "BUSY"})
    assert response.status_code == 200
    assert response.json()["status"] == "BUSY"


def test_find_nearest_ambulance(client):
    response = client.get("/api/v1/ambulances/nearest?lat=17.3850&lng=78.4867")
    assert response.status_code == 200
    data = response.json()
    assert "ambulance" in data
    assert "distance_km" in data
    assert "estimated_eta_minutes" in data


def test_search_facilities(client):
    # Search for Osmania
    response = client.get("/api/v1/facilities/search?q=Osmania&patient_lat=17.3980&patient_lng=78.4730&condition=CARDIAC")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1
    assert "Osmania" in data[0]["facility_name"]
    assert data[0]["distance_km"] is not None
    assert data[0]["match_score"] is not None


def test_create_and_list_assignment(client):
    # Create emergency first
    emg_res = client.post(
        "/api/v1/emergencies",
        json={
            "patient_name": "Test Assignment Patient",
            "contact_phone": "+91 99999 88888",
            "incident_address": "Banjara Hills Road 1",
            "latitude": 17.4150,
            "longitude": 78.4410,
        },
    )
    emg_id = emg_res.json()["id"]

    # Assign ambulance 1 to emergency
    assign_res = client.post(
        "/api/v1/assignments",
        json={
            "emergency_id": emg_id,
            "ambulance_id": 1,
            "notes": "Fastest ALS dispatch",
        },
    )
    assert assign_res.status_code == 201
    assign_data = assign_res.json()
    assert assign_data["emergency_id"] == emg_id
    assert assign_data["ambulance_id"] == 1
    assert assign_data["status"] == "DISPATCHED"

    # Verify emergency status is now ASSIGNED
    emg_check = client.get(f"/api/v1/emergencies/{emg_id}")
    assert emg_check.json()["status"] == "ASSIGNED"


def test_milestone7_top5_hospital_recommendations_endpoint(client):
    """
    Milestone 7: Test dedicated /api/v1/facilities/recommendations endpoint returns top 5 hospitals.
    """
    # Coordinates for Nampally / Hyderabad Metro
    lat, lng = 17.3980, 78.4730
    res = client.get(f"/api/v1/facilities/recommendations?patient_lat={lat}&patient_lng={lng}&emergency_type=CARDIAC&limit=5")
    assert res.status_code == 200
    hospitals = res.json()
    assert len(hospitals) == 5, f"Expected 5 recommendations, got {len(hospitals)}"
    
    # Verify ranking order (descending by match_score)
    scores = [h["match_score"] for h in hospitals]
    assert scores == sorted(scores, reverse=True), f"Scores not sorted descending: {scores}"

    # Verify best-ranked hospital has the top score
    best = hospitals[0]
    assert best["match_score"] >= scores[-1]
    assert best["distance_km"] is not None
    assert best["estimated_eta_minutes"] is not None
    assert best["matched_specialty"] == "Cardiology"


def test_milestone7_specialty_matching_all_5_conditions(client):
    """
    Milestone 7: Verify specialty matching for:
      - Cardiac -> Cardiology
      - Accident -> Emergency/Trauma
      - Stroke -> Neurology
      - Maternity -> Obstetrics/Gynecology
      - General -> General Medicine
    """
    lat, lng = 17.3980, 78.4730
    conditions = [
        ("CARDIAC", "Cardiology"),
        ("ACCIDENT", "Emergency/Trauma"),
        ("STROKE", "Neurology"),
        ("MATERNITY", "Obstetrics/Gynecology"),
        ("GENERAL", "General Medicine"),
    ]

    for cond, expected_specialty in conditions:
        res = client.get(f"/api/v1/facilities/recommendations?patient_lat={lat}&patient_lng={lng}&emergency_type={cond}&limit=5")
        assert res.status_code == 200
        data = res.json()
        assert len(data) >= 1
        top_hosp = data[0]
        assert top_hosp["matched_specialty"] == expected_specialty, f"Expected {expected_specialty} for {cond}, got {top_hosp['matched_specialty']}"
        assert "score_breakdown" in top_hosp
        assert top_hosp["score_breakdown"]["specialty_score"] > 0
        assert len(top_hosp["match_reasons"]) > 0


def test_milestone7_transparent_scoring_and_missing_info(client):
    """
    Milestone 7: Verify transparent score breakdown, missing info markings, and traffic status.
    """
    lat, lng = 17.3980, 78.4730
    res = client.get(f"/api/v1/facilities/recommendations?patient_lat={lat}&patient_lng={lng}&emergency_type=MATERNITY&limit=5")
    assert res.status_code == 200
    hospitals = res.json()
    assert len(hospitals) >= 1

    top = hospitals[0]
    breakdown = top["score_breakdown"]
    assert "specialty_score" in breakdown
    assert "distance_score" in breakdown
    assert "bed_score" in breakdown
    assert "readiness_score" in breakdown
    assert "total_score" in breakdown
    assert breakdown["total_score"] == top["match_score"]

    # Verify missing information list is present and marked
    assert "missing_information" in top
    assert len(top["missing_information"]) >= 1
    assert any("traffic" in info.lower() for info in top["missing_information"])
    assert "traffic_status" in top


def test_ambulance_availability_never_returns_busy_or_maintenance(client):
    """
    Milestone 8.1 FIX 2: Ensure find_nearest_ambulance never returns BUSY or MAINTENANCE units.
    When all units are BUSY or MAINTENANCE, return 404 (None).
    """
    # 1. Fetch all ambulances
    list_res = client.get("/api/v1/ambulances")
    assert list_res.status_code == 200
    ambs = list_res.json()

    # Save original statuses to restore at end of test
    orig_statuses = {a["id"]: a["status"] for a in ambs}

    try:
        # Mark all ambulances as BUSY
        for a in ambs:
            client.patch(f"/api/v1/ambulances/{a['id']}/status", json={"status": "BUSY"})

        # Query nearest - should return 404 because NO ambulance is available
        res_busy = client.get("/api/v1/ambulances/nearest?lat=17.3850&lng=78.4867")
        assert res_busy.status_code == 404
        assert "No available ambulances found" in res_busy.json()["detail"]

        # Mark all ambulances as MAINTENANCE
        for a in ambs:
            client.patch(f"/api/v1/ambulances/{a['id']}/status", json={"status": "MAINTENANCE"})

        # Query nearest - should return 404
        res_maint = client.get("/api/v1/ambulances/nearest?lat=17.3850&lng=78.4867")
        assert res_maint.status_code == 404
        assert "No available ambulances found" in res_maint.json()["detail"]

        # Now mark only a BLS unit (e.g. id=2) as AVAILABLE, and request ALS
        bls_id = None
        for a in ambs:
            if a["type"] == "BLS":
                bls_id = a["id"]
                break
        if not bls_id:
            bls_id = ambs[0]["id"]

        client.patch(f"/api/v1/ambulances/{bls_id}/status", json={"status": "AVAILABLE"})

        # When requesting ALS, since no ALS is available, it should fallback to the only AVAILABLE unit (the BLS unit)
        res_fallback = client.get("/api/v1/ambulances/nearest?lat=17.3850&lng=78.4867&type=ALS")
        assert res_fallback.status_code == 200
        found = res_fallback.json()["ambulance"]
        assert found["status"] == "AVAILABLE"
        assert found["id"] == bls_id

    finally:
        # Restore original statuses
        for amb_id, orig_status in orig_statuses.items():
            client.patch(f"/api/v1/ambulances/{amb_id}/status", json={"status": orig_status})


