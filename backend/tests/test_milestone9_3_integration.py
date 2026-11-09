"""
Milestone 9.3: Full System Integration Tests.

Validates:
1. Complete End-to-End Emergency Lifecycle Workflow:
   SOS creation -> Location validation & DB storage -> Dispatcher triage ->
   Hospital recommendations -> Ambulance nearest query -> Ambulance assignment ->
   Driver telemetry -> Live WebSocket broadcasts -> Status progression (EN_ROUTE, ON_SCENE, TRANSPORTING) ->
   Hospital resolution (RESOLVED) -> Complete status history audit trail.
2. All Five User Roles Permissions Matrix:
   PATIENT / REPORTER, DRIVER, HOSPITAL, DISPATCHER, ADMIN.
3. Boundary Conditions & Error Handling:
   404s for missing records, 422s for invalid coordinates, 400s for invalid assignments & terminal state transitions,
   401s for unauthenticated requests, 403s for unauthorized operations.
4. Real-Time Multi-Client WebSocket Integration:
   Concurrent clients, live location streaming, status broadcast with PII redaction, rejection of invalid tokens,
   and clean disconnect handling.
5. Dynamic Ambulance Availability Filtering:
   BUSY / MAINTENANCE vehicles excluded; only AVAILABLE vehicles assigned.
"""
import json
import pytest
from starlette.websockets import WebSocketDisconnect
from app.auth.jwt import create_access_token
from app.models.ambulance import Ambulance


def make_token(role: str, user_id: str = None, email: str = None):
    """Helper to generate JWT bearer tokens with specific role and user_id."""
    r_upper = role.upper()
    uid = user_id or f"user-{r_upper.lower()}-01"
    em = email or f"{r_upper.lower()}@pulseroute.org"
    return create_access_token({
        "sub": uid,
        "email": em,
        "role": r_upper,
        "name": f"Test {r_upper.title()}",
    })


# ══════════════════════════════════════════════════════════════════════════════
# 1. Complete End-to-End Emergency Lifecycle Workflow
# ══════════════════════════════════════════════════════════════════════════════

def test_complete_emergency_e2e_workflow_and_lifecycle(client):
    """
    Simulates the entire operational lifecycle from SOS creation to resolution.
    1. Patient creates emergency SOS -> tagged with creator_id.
    2. Location is validated and record is persisted in SQLite with status REPORTED.
    3. Dispatcher receives and inspects incident.
    4. System scores and returns top hospital recommendations.
    5. System identifies closest available ambulance (ALS).
    6. Dispatcher assigns ambulance -> status transitions to ASSIGNED.
    7. Driver receives assignment details.
    8. Driver updates ambulance GPS coordinates.
    9. Driver transitions emergency: EN_ROUTE -> ON_SCENE -> TRANSPORTING.
    10. Hospital admits patient and marks emergency RESOLVED.
    11. Status history confirms every lifecycle transition and timestamp.
    """
    patient_id = "citizen-venkat-01"
    patient_token = make_token("PATIENT", user_id=patient_id)
    dispatcher_token = make_token("DISPATCHER", user_id="dispatcher-hq-01")
    driver_token = make_token("DRIVER", user_id="driver-rajesh-01")
    hospital_token = make_token("HOSPITAL", user_id="hospital-er-01")

    # Step 1: Patient creates SOS
    sos_payload = {
        "patient_name": "Venkat Reddy",
        "contact_phone": "+91 98490 12345",
        "emergency_type": "CARDIAC",
        "severity": "CRITICAL",
        "incident_address": "Near Secunderabad Clock Tower",
        "latitude": 17.4399,
        "longitude": 78.4983,
        "symptoms": "Acute substernal chest pressure radiating to left shoulder",
    }
    sos_res = client.post(
        "/api/v1/emergencies",
        json=sos_payload,
        headers={"Authorization": f"Bearer {patient_token}"},
    )
    assert sos_res.status_code in (200, 201)
    emg_data = sos_res.json()
    emg_id = emg_data["id"]
    assert emg_data["status"] == "REPORTED"
    assert emg_data["creator_id"] == patient_id
    assert emg_data["latitude"] == 17.4399
    assert emg_data["longitude"] == 78.4983

    # Step 2: Patient can read their own emergency
    get_res = client.get(
        f"/api/v1/emergencies/{emg_id}",
        headers={"Authorization": f"Bearer {patient_token}"},
    )
    assert get_res.status_code == 200
    assert get_res.json()["patient_name"] == "Venkat Reddy"

    # Step 3: Dispatcher accesses emergency
    disp_get = client.get(
        f"/api/v1/emergencies/{emg_id}",
        headers={"Authorization": f"Bearer {dispatcher_token}"},
    )
    assert disp_get.status_code == 200

    # Step 4: Dispatcher identifies suitable hospitals (Milestone 7 recommendation scoring)
    rec_res = client.get(
        "/api/v1/facilities/recommendations",
        params={
            "patient_lat": 17.4399,
            "patient_lng": 78.4983,
            "emergency_type": "CARDIAC",
            "limit": 3,
        },
        headers={"Authorization": f"Bearer {dispatcher_token}"},
    )
    assert rec_res.status_code == 200
    recs = rec_res.json()
    assert len(recs) > 0
    # Top recommendation should have ICU beds and cath lab for CARDIAC
    top_hospital = recs[0]
    assert top_hospital["available_icu_beds"] > 0
    hospital_id = top_hospital["id"]

    # Step 5: Dispatcher finds nearest available ambulance
    amb_res = client.get(
        "/api/v1/ambulances/nearest",
        params={"lat": 17.4399, "lng": 78.4983, "type": "ALS"},
        headers={"Authorization": f"Bearer {dispatcher_token}"},
    )
    assert amb_res.status_code == 200
    amb_data = amb_res.json()["ambulance"]
    amb_id = amb_data["id"]
    assert amb_data["status"] == "AVAILABLE"

    # Step 6: Dispatcher assigns ambulance to emergency
    asg_payload = {
        "emergency_id": emg_id,
        "ambulance_id": amb_id,
        "notes": "ALS Unit dispatched for Critical Cardiac incident",
    }
    asg_res = client.post(
        "/api/v1/assignments",
        json=asg_payload,
        headers={"Authorization": f"Bearer {dispatcher_token}"},
    )
    assert asg_res.status_code == 201
    asg_data = asg_res.json()
    asg_id = asg_data["id"]
    assert asg_data["emergency_id"] == emg_id
    assert asg_data["ambulance_id"] == amb_id

    # Verify state updates: emergency is ASSIGNED, ambulance is EN_ROUTE
    emg_check = client.get(f"/api/v1/emergencies/{emg_id}", headers={"Authorization": f"Bearer {dispatcher_token}"})
    assert emg_check.json()["status"] == "ASSIGNED"

    amb_check = client.get(f"/api/v1/ambulances/{amb_id}", headers={"Authorization": f"Bearer {dispatcher_token}"})
    assert amb_check.json()["status"] == "EN_ROUTE"

    # Step 7: Driver inspects assignment
    driver_asg = client.get(
        f"/api/v1/assignments/{asg_id}",
        headers={"Authorization": f"Bearer {driver_token}"},
    )
    assert driver_asg.status_code == 200

    # Step 8: Driver updates ambulance GPS coordinates & speed
    gps_res = client.patch(
        f"/api/v1/ambulances/{amb_id}/location",
        json={"latitude": 17.4410, "longitude": 78.4990, "speed_kmh": 48.5},
        headers={"Authorization": f"Bearer {driver_token}"},
    )
    assert gps_res.status_code == 200
    assert gps_res.json()["latitude"] == 17.4410
    assert gps_res.json()["speed_kmh"] == 48.5

    # Step 9: Driver updates emergency progression: EN_ROUTE -> ON_SCENE -> TRANSPORTING
    en_route_res = client.patch(
        f"/api/v1/emergencies/{emg_id}/status",
        json={"status": "EN_ROUTE", "notes": "Ambulance en route with sirens"},
        headers={"Authorization": f"Bearer {driver_token}"},
    )
    assert en_route_res.status_code == 200
    assert en_route_res.json()["status"] == "EN_ROUTE"

    on_scene_res = client.patch(
        f"/api/v1/emergencies/{emg_id}/status",
        json={"status": "ON_SCENE", "notes": "Paramedics arrived at patient side"},
        headers={"Authorization": f"Bearer {driver_token}"},
    )
    assert on_scene_res.status_code == 200
    assert on_scene_res.json()["status"] == "ON_SCENE"

    transport_res = client.patch(
        f"/api/v1/emergencies/{emg_id}/status",
        json={"status": "TRANSPORTING", "notes": "Patient stabilized, heading to Apex Trauma Hub"},
        headers={"Authorization": f"Bearer {driver_token}"},
    )
    assert transport_res.status_code == 200
    assert transport_res.json()["status"] == "TRANSPORTING"

    # Step 10: Hospital staff receives patient and marks emergency RESOLVED
    resolve_res = client.patch(
        f"/api/v1/emergencies/{emg_id}/status",
        json={"status": "RESOLVED", "notes": "Patient admitted to Cardiac ICU; cath lab activated."},
        headers={"Authorization": f"Bearer {hospital_token}"},
    )
    assert resolve_res.status_code == 200
    final_emg = resolve_res.json()
    assert final_emg["status"] == "RESOLVED"
    assert final_emg["resolved_at"] is not None

    # Step 11: Emergency history audit trail verification
    history_res = client.get(
        f"/api/v1/emergencies/{emg_id}/history",
        headers={"Authorization": f"Bearer {dispatcher_token}"},
    )
    assert history_res.status_code == 200
    history_items = history_res.json()
    assert len(history_items) >= 4

    statuses_recorded = [h["to_status"] for h in history_items]
    assert "ASSIGNED" in statuses_recorded
    assert "EN_ROUTE" in statuses_recorded
    assert "ON_SCENE" in statuses_recorded
    assert "TRANSPORTING" in statuses_recorded
    assert "RESOLVED" in statuses_recorded

    # Check timestamps and changed_by are recorded on each transition
    for item in history_items:
        assert item["changed_at"] is not None
        assert item["changed_by"] is not None


# ══════════════════════════════════════════════════════════════════════════════
# 2. All Five User Roles Permissions Matrix
# ══════════════════════════════════════════════════════════════════════════════

def test_all_five_user_roles_permissions_matrix(client):
    """
    Verifies the principle of least privilege across all five roles:
    PATIENT, DRIVER, HOSPITAL, DISPATCHER, ADMIN.
    """
    roles = {
        "PATIENT": make_token("PATIENT", "usr-pat-01"),
        "DRIVER": make_token("DRIVER", "usr-drv-01"),
        "HOSPITAL": make_token("HOSPITAL", "usr-hsp-01"),
        "DISPATCHER": make_token("DISPATCHER", "usr-dsp-01"),
        "ADMIN": make_token("ADMIN", "usr-adm-01"),
    }

    # 1. Ambulance Assignment creation (POST /api/v1/assignments)
    # Allowed: DISPATCHER, ADMIN. Forbidden: PATIENT, DRIVER, HOSPITAL.
    assign_payload = {"emergency_id": 1, "ambulance_id": 1, "notes": "Permission test"}
    for role_name, token in roles.items():
        res = client.post(
            "/api/v1/assignments",
            json=assign_payload,
            headers={"Authorization": f"Bearer {token}"},
        )
        if role_name in ("DISPATCHER", "ADMIN"):
            # Permitted (201 or 400 if ID not found, but NOT 403)
            assert res.status_code != 403, f"{role_name} unexpectedly got 403 on assignments"
        else:
            assert res.status_code == 403, f"{role_name} should be forbidden (403) from creating assignments"

    # 2. Hospital Bed Capacity management (PATCH /api/v1/facilities/{id}/capacity)
    # Allowed: HOSPITAL, ADMIN. Forbidden: PATIENT, DRIVER, DISPATCHER.
    cap_payload = {"available_icu_beds": 14, "available_general_beds": 35}
    for role_name, token in roles.items():
        res = client.patch(
            "/api/v1/facilities/1/capacity",
            json=cap_payload,
            headers={"Authorization": f"Bearer {token}"},
        )
        if role_name in ("HOSPITAL", "ADMIN"):
            assert res.status_code == 200, f"{role_name} should have capacity update access"
        else:
            assert res.status_code == 403, f"{role_name} should be forbidden (403) from updating capacity"

    # 3. Ambulance GPS Telemetry update (PATCH /api/v1/ambulances/{id}/location)
    # Allowed: DRIVER, DISPATCHER, ADMIN. Forbidden: PATIENT, HOSPITAL.
    loc_payload = {"latitude": 17.3990, "longitude": 78.4740, "speed_kmh": 40.0}
    for role_name, token in roles.items():
        res = client.patch(
            "/api/v1/ambulances/1/location",
            json=loc_payload,
            headers={"Authorization": f"Bearer {token}"},
        )
        if role_name in ("DRIVER", "DISPATCHER", "ADMIN"):
            assert res.status_code == 200, f"{role_name} should have telemetry stream access"
        else:
            assert res.status_code == 403, f"{role_name} should be forbidden (403) from updating telemetry"

    # 4. Emergency Status Updates: Patients forbidden from mutating status
    patient_sos = client.post(
        "/api/v1/emergencies",
        json={
            "patient_name": "Matrix Patient",
            "contact_phone": "+91 99999 11111",
            "emergency_type": "GENERAL",
            "severity": "LOW",
            "incident_address": "Koti Hyderabad",
            "latitude": 17.3850,
            "longitude": 78.4867,
        },
        headers={"Authorization": f"Bearer {roles['PATIENT']}"},
    ).json()
    emg_id = patient_sos["id"]

    pat_patch = client.patch(
        f"/api/v1/emergencies/{emg_id}/status",
        json={"status": "ON_SCENE"},
        headers={"Authorization": f"Bearer {roles['PATIENT']}"},
    )
    assert pat_patch.status_code == 403

    # Dispatcher can update
    disp_patch = client.patch(
        f"/api/v1/emergencies/{emg_id}/status",
        json={"status": "CANCELLED", "notes": "Caller cancelled dispatch"},
        headers={"Authorization": f"Bearer {roles['DISPATCHER']}"},
    )
    assert disp_patch.status_code == 200


# ══════════════════════════════════════════════════════════════════════════════
# 3. Boundary Conditions & Error Handling
# ══════════════════════════════════════════════════════════════════════════════

def test_backend_error_handling_and_boundary_conditions(client):
    """
    Validates robust error handling across REST endpoints:
    - 404 for missing emergency, ambulance, facility
    - 422 for invalid coordinates
    - 400 for assigning non-existent emergency or ambulance
    - 400 for invalid/terminal status transitions
    - 401 for unauthenticated requests
    """
    admin_token = make_token("ADMIN")

    # 1. 404 Missing records
    assert client.get("/api/v1/emergencies/999999").status_code == 404
    assert client.get("/api/v1/ambulances/999999").status_code == 404
    assert client.get("/api/v1/facilities/999999").status_code == 404

    # 2. 422 Invalid GPS coordinates (latitude outside [-90, 90])
    invalid_sos = {
        "patient_name": "OutOfBounds User",
        "contact_phone": "+91 99999 22222",
        "emergency_type": "GENERAL",
        "severity": "LOW",
        "incident_address": "Invalid Latitude",
        "latitude": 105.0,  # Invalid
        "longitude": 78.4867,
    }
    assert client.post("/api/v1/emergencies", json=invalid_sos).status_code == 422

    # Invalid ambulance coordinates
    invalid_loc = {"latitude": -95.0, "longitude": 78.0, "speed_kmh": 20}
    assert client.patch("/api/v1/ambulances/1/location", json=invalid_loc).status_code == 422

    # 3. 400 for non-existent assignments
    bad_asg = client.post("/api/v1/assignments", json={"emergency_id": 99999, "ambulance_id": 1})
    assert bad_asg.status_code == 400

    bad_amb_asg = client.post("/api/v1/assignments", json={"emergency_id": 1, "ambulance_id": 99999})
    assert bad_amb_asg.status_code == 400

    # 4. 400 for terminal status transition violation
    # Create emergency and resolve it
    emg = client.post("/api/v1/emergencies", json={
        "patient_name": "Terminal Test",
        "contact_phone": "+91 99999 33333",
        "emergency_type": "GENERAL",
        "severity": "LOW",
        "incident_address": "Secunderabad",
        "latitude": 17.4399,
        "longitude": 78.4983,
    }).json()
    e_id = emg["id"]
    client.patch(f"/api/v1/emergencies/{e_id}/status", json={"status": "CANCELLED"})

    # Attempting to re-open a CANCELLED or RESOLVED emergency should return 400
    bad_trans = client.patch(f"/api/v1/emergencies/{e_id}/status", json={"status": "EN_ROUTE"})
    assert bad_trans.status_code == 400
    assert "terminal" in bad_trans.json()["detail"].lower()

    # 5. 401 for unauthenticated request on protected endpoints
    no_auth_headers = {"no_auth": "true"}
    assert client.get("/api/v1/emergencies", headers=no_auth_headers).status_code == 401
    assert client.post("/api/v1/assignments", json={"emergency_id": 1, "ambulance_id": 1}, headers=no_auth_headers).status_code == 401
    assert client.patch("/api/v1/facilities/1/capacity", json={"available_icu_beds": 5}, headers=no_auth_headers).status_code == 401


# ══════════════════════════════════════════════════════════════════════════════
# 4. Real-Time Multi-Client WebSocket Integration
# ══════════════════════════════════════════════════════════════════════════════

def test_realtime_websocket_multi_client_integration(client):
    """
    Verifies concurrent WebSocket connections:
    - Multiple authenticated roles (DISPATCHER and HOSPITAL) connect simultaneously.
    - Invalid tokens rejected with 1008 Policy Violation.
    - Telemetry update broadcasted to all active clients.
    - Status update broadcasted with patient personal information (PII) stripped.
    """
    disp_token = make_token("DISPATCHER")
    hosp_token = make_token("HOSPITAL")
    invalid_token = "malformed.invalid.token"

    # Reject invalid token
    with pytest.raises(WebSocketDisconnect) as exc_info:
        with client.websocket_connect(f"/ws/live?token={invalid_token}"):
            pass
    assert exc_info.value.code == 1008

    # Multi-client concurrent live communication
    with client.websocket_connect(f"/ws/live?token={disp_token}") as ws_dispatcher:
        # Verify connection handshake
        init_disp = json.loads(ws_dispatcher.receive_text())
        assert init_disp["event"] == "connected"
        assert init_disp["data"]["user"]["role"] == "DISPATCHER"

        with client.websocket_connect(f"/ws/live?token={hosp_token}") as ws_hospital:
            init_hosp = json.loads(ws_hospital.receive_text())
            assert init_hosp["event"] == "connected"
            assert init_hosp["data"]["user"]["role"] == "HOSPITAL"

            # Trigger ambulance GPS telemetry update
            gps_res = client.patch(
                "/api/v1/ambulances/1/location",
                json={"latitude": 17.4100, "longitude": 78.4800, "speed_kmh": 55.0},
                headers={"Authorization": f"Bearer {disp_token}"},
            )
            assert gps_res.status_code == 200

            # Both connected clients receive the telemetry broadcast
            msg_disp = json.loads(ws_dispatcher.receive_text())
            assert msg_disp["event"] == "ambulance_location"
            assert msg_disp["data"]["lat"] == 17.4100
            assert msg_disp["data"]["speed_kmh"] == 55.0

            msg_hosp = json.loads(ws_hospital.receive_text())
            assert msg_hosp["event"] == "ambulance_location"
            assert msg_hosp["data"]["lat"] == 17.4100

            # Trigger emergency status update
            # Create emergency first
            emg = client.post(
                "/api/v1/emergencies",
                json={
                    "patient_name": "Confidential Citizen",
                    "contact_phone": "+91 91111 22222",
                    "emergency_type": "TRAUMA",
                    "severity": "HIGH",
                    "incident_address": "Banjara Hills Rd 1",
                    "latitude": 17.4156,
                    "longitude": 78.4350,
                    "symptoms": "Severe acute fractures",
                },
                headers={"Authorization": f"Bearer {disp_token}"},
            ).json()

            status_patch = client.patch(
                f"/api/v1/emergencies/{emg['id']}/status",
                json={"status": "EN_ROUTE", "notes": "En route to trauma site"},
                headers={"Authorization": f"Bearer {disp_token}"},
            )
            assert status_patch.status_code == 200

            # Verify broadcast message reaches clients
            st_disp = json.loads(ws_dispatcher.receive_text())
            assert st_disp["event"] == "emergency_status"
            st_data = st_disp["data"]

            # Redaction verification: patient PII strictly excluded
            assert "patient_name" not in st_data
            assert "contact_phone" not in st_data
            assert "symptoms" not in st_data
            assert "Confidential Citizen" not in str(st_data)


# ══════════════════════════════════════════════════════════════════════════════
# 5. Dynamic Ambulance Availability Filtering
# ══════════════════════════════════════════════════════════════════════════════

def test_ambulance_availability_filtering(client, db_session):
    """
    Verifies that BUSY or MAINTENANCE ambulances are never assigned or returned
    by the nearest-ambulance locator.
    """
    disp_token = make_token("DISPATCHER")

    # Add second ambulance in MAINTENANCE
    amb_maint = Ambulance(
        id=2,
        ambulance_id="AMB002",
        vehicle_number="TS-09-EA-2022",
        type="ALS",
        status="MAINTENANCE",
        latitude=17.3980,
        longitude=78.4730,
        driver_name="Sunil Varma",
        driver_contact="+91 98480 22302",
        base_station="Apollo Trauma Hub",
    )
    db_session.add(amb_maint)
    db_session.commit()

    # Query nearest ambulance - AMB001 (AVAILABLE) should be returned even though AMB002 is closer
    res = client.get(
        "/api/v1/ambulances/nearest",
        params={"lat": 17.3980, "lng": 78.4730, "type": "ALS"},
        headers={"Authorization": f"Bearer {disp_token}"},
    )
    assert res.status_code == 200
    assert res.json()["ambulance"]["ambulance_id"] == "AMB001"

    # Set AMB001 to BUSY
    client.patch(
        "/api/v1/ambulances/1/status",
        json={"status": "BUSY"},
        headers={"Authorization": f"Bearer {disp_token}"},
    )

    # Now all ALS units are either BUSY or MAINTENANCE -> Should return 404
    res_none = client.get(
        "/api/v1/ambulances/nearest",
        params={"lat": 17.3980, "lng": 78.4730, "type": "ALS"},
        headers={"Authorization": f"Bearer {disp_token}"},
    )
    assert res_none.status_code == 404
    assert "no available ambulances" in res_none.json()["detail"].lower()

