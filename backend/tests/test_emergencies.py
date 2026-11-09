"""
Tests for Emergency Reports API.
"""


def test_create_emergency_report_success(client):
    payload = {
        "patient_name": "Sita Sharma",
        "contact_phone": "+91 98490 12345",
        "patient_age": 45,
        "gender": "FEMALE",
        "emergency_type": "CARDIAC",
        "severity": "CRITICAL",
        "consciousness": "CONSCIOUS",
        "breathing": "DIFFICULT",
        "incident_address": "Near Charminar, Old City, Hyderabad",
        "latitude": 17.3616,
        "longitude": 78.4747,
        "symptoms": "Acute retrosternal chest pain for 30 minutes",
        "destination_facility_id": 1,
    }
    response = client.post("/api/v1/emergencies", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["patient_name"] == "Sita Sharma"
    assert data["emergency_type"] == "CARDIAC"
    assert data["severity"] == "CRITICAL"
    assert data["status"] == "REPORTED"
    assert data["incident_code"].startswith("EMG-")
    assert "id" in data


def test_create_emergency_validation_error(client):
    # Missing required contact_phone and incident_address
    payload = {
        "patient_name": "Test User",
        "latitude": 17.3616,
        "longitude": 78.4747,
    }
    response = client.post("/api/v1/emergencies", json=payload)
    assert response.status_code == 422


def test_list_and_get_emergency(client):
    # Create emergency first
    payload = {
        "patient_name": "Venkat Reddy",
        "contact_phone": "+91 98765 43210",
        "emergency_type": "TRAUMA",
        "severity": "CRITICAL",
        "incident_address": "Gachibowli Outer Ring Road",
        "latitude": 17.4400,
        "longitude": 78.3489,
    }
    create_res = client.post("/api/v1/emergencies", json=payload)
    assert create_res.status_code == 201
    created_id = create_res.json()["id"]

    # List emergencies
    list_res = client.get("/api/v1/emergencies")
    assert list_res.status_code == 200
    emergencies = list_res.json()
    assert len(emergencies) >= 1
    assert any(e["id"] == created_id for e in emergencies)

    # Get by ID
    get_res = client.get(f"/api/v1/emergencies/{created_id}")
    assert get_res.status_code == 200
    assert get_res.json()["patient_name"] == "Venkat Reddy"


def test_get_emergency_not_found(client):
    response = client.get("/api/v1/emergencies/999999")
    assert response.status_code == 404


def test_update_emergency_status(client):
    # Create emergency
    payload = {
        "patient_name": "Ravi Kumar",
        "contact_phone": "+91 91234 56789",
        "emergency_type": "GENERAL",
        "severity": "MODERATE",
        "incident_address": "Secunderabad Clock Tower",
        "latitude": 17.4399,
        "longitude": 78.4983,
    }
    create_res = client.post("/api/v1/emergencies", json=payload)
    emergency_id = create_res.json()["id"]

    # Update status to EN_ROUTE
    patch_res = client.patch(f"/api/v1/emergencies/{emergency_id}/status", json={"status": "EN_ROUTE"})
    assert patch_res.status_code == 200
    assert patch_res.json()["status"] == "EN_ROUTE"

    # Update status to RESOLVED
    patch_res2 = client.patch(f"/api/v1/emergencies/{emergency_id}/status", json={"status": "RESOLVED"})
    assert patch_res2.status_code == 200
    assert patch_res2.json()["status"] == "RESOLVED"
    assert patch_res2.json()["resolved_at"] is not None


def test_one_tap_sos_all_milestone6_types_and_severities(client):
    """
    Milestone 6: Verify all requested emergency types and severity levels
    (Cardiac, Accident, Stroke, Maternity, Trauma, General)
    (Critical, High, Medium, Low) are successfully ingested and stored.
    """
    test_cases = [
        ("CARDIAC", "CRITICAL", "Near Nampally Station, Abids", 17.3980, 78.4730),
        ("ACCIDENT", "HIGH", "Cyber Towers Junction, HITEC City", 17.4504, 78.3808),
        ("STROKE", "CRITICAL", "Banjara Hills Road No. 1", 17.4156, 78.4350),
        ("MATERNITY", "MEDIUM", "Mallepally UPHC Area", 17.3872, 78.4612),
        ("TRAUMA", "HIGH", "Secunderabad Clock Tower", 17.4399, 78.4983),
        ("GENERAL", "LOW", "Charminar Monument Square", 17.3616, 78.4747),
    ]

    for emg_type, severity, address, lat, lng in test_cases:
        payload = {
            "patient_name": f"Citizen {emg_type}",
            "contact_phone": "+91 98490 99881",
            "emergency_type": emg_type,
            "severity": severity,
            "incident_address": address,
            "latitude": lat,
            "longitude": lng,
            "caller_name": "One-Tap SOS Citizen Reporter",
            "symptoms": f"Automated test for {emg_type} with severity {severity}",
        }
        res = client.post("/api/v1/emergencies", json=payload)
        assert res.status_code == 201, f"Failed for {emg_type} ({severity}): {res.text}"
        data = res.json()
        assert data["emergency_type"] == emg_type
        assert data["severity"] == severity
        assert data["status"] == "REPORTED"
        assert data["latitude"] == lat
        assert data["longitude"] == lng
        assert data["incident_code"].startswith("EMG-")


def test_one_tap_sos_invalid_coordinates(client):
    """
    Milestone 6: Verify coordinates validation rejects values outside [-90, 90] and [-180, 180].
    """
    invalid_payload = {
        "patient_name": "Invalid Location Citizen",
        "contact_phone": "+91 98490 12345",
        "emergency_type": "CARDIAC",
        "severity": "CRITICAL",
        "incident_address": "Out of Bounds Planet",
        "latitude": 95.0,  # Invalid
        "longitude": 78.4747,
    }
    res = client.post("/api/v1/emergencies", json=invalid_payload)
    assert res.status_code == 422

