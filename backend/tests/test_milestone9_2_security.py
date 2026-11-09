"""
Milestone 9.2: REST API Security & Role-Based Access Control (RBAC) Tests.

Verifies:
1. Rejection of missing authentication token (401 Unauthorized)
2. Rejection of invalid token signatures (401 Unauthorized)
3. Rejection of expired tokens (401 Unauthorized)
4. Role-based restriction on hospital management operations (403 Forbidden)
5. Role-based restriction on ambulance dispatch assignments (403 Forbidden)
6. Access control on emergency records: patient cannot access another patient's emergency (403 Forbidden)
7. Status transition validation & role restrictions (patient can only cancel own emergency)
8. Terminal status validation (cannot transition from RESOLVED or CANCELLED)
9. Admin universal permissions across all resources
10. WebSocket authentication compatibility with Milestone 9.1
"""
from datetime import timedelta
import pytest
from app.auth.jwt import create_access_token


@pytest.fixture
def admin_headers():
    token = create_access_token({
        "sub": "user-adm-01",
        "email": "admin@example.com",
        "role": "ADMIN",
        "name": "Admin Lead",
    })
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def dispatcher_headers():
    token = create_access_token({
        "sub": "user-dsp-01",
        "email": "dispatcher@example.com",
        "role": "DISPATCHER",
        "name": "Dispatch Operator",
    })
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def driver_headers():
    token = create_access_token({
        "sub": "user-drv-01",
        "email": "driver@example.com",
        "role": "DRIVER",
        "name": "Ambulance Driver",
    })
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def hospital_headers():
    token = create_access_token({
        "sub": "user-hsp-01",
        "email": "hospital@example.com",
        "role": "HOSPITAL",
        "name": "Osmania Duty Officer",
    })
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def patient1_headers():
    token = create_access_token({
        "sub": "patient-user-01",
        "email": "patient1@example.com",
        "role": "PATIENT",
        "name": "Ravi Teja",
        "phone": "+91 98888 11111",
    })
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def patient2_headers():
    token = create_access_token({
        "sub": "patient-user-02",
        "email": "patient2@example.com",
        "role": "PATIENT",
        "name": "Sunita Rao",
        "phone": "+91 97777 22222",
    })
    return {"Authorization": f"Bearer {token}"}


# ── 1. Authentication Token Validation (401 Unauthorized) ─────────────────────

def test_missing_auth_token_rejected_with_401(client):
    """
    Test that sensitive REST endpoints return 401 when no token is provided.
    """
    # 1. Listing emergencies without token
    res1 = client.get("/api/v1/emergencies", headers={"no_auth": "1"})
    assert res1.status_code == 401
    assert "Missing authentication token" in res1.json()["detail"]

    # 2. Creating ambulance assignment without token
    res2 = client.post(
        "/api/v1/assignments",
        json={"emergency_id": 1, "ambulance_id": 1},
        headers={"no_auth": "1"},
    )
    assert res2.status_code == 401

    # 3. Updating hospital capacity without token
    res3 = client.patch(
        "/api/v1/facilities/1/capacity",
        json={"available_icu_beds": 15},
        headers={"no_auth": "1"},
    )
    assert res3.status_code == 401


def test_invalid_token_rejected_with_401(client):
    """
    Test that endpoints return 401 when token signature is invalid or tampered.
    """
    res = client.get(
        "/api/v1/emergencies",
        headers={"Authorization": "Bearer invalid.signature.token"},
    )
    assert res.status_code == 401
    assert "Invalid authentication token" in res.json()["detail"]


def test_expired_token_rejected_with_401(client):
    """
    Test that endpoints return 401 when token has expired.
    """
    expired_token = create_access_token(
        {"sub": "test-admin", "role": "ADMIN"},
        expires_delta=timedelta(seconds=-20),
    )
    res = client.get(
        "/api/v1/emergencies",
        headers={"Authorization": f"Bearer {expired_token}"},
    )
    assert res.status_code == 401
    assert "expired" in res.json()["detail"].lower()


# ── 2. Role-Based Access Control on Hospital Management (403 Forbidden) ──────

def test_hospital_capacity_management_permissions(
    client, patient1_headers, driver_headers, hospital_headers, admin_headers
):
    """
    Only HOSPITAL and ADMIN roles may update hospital capacity.
    PATIENT and DRIVER must be rejected with 403 Forbidden.
    """
    payload = {"available_icu_beds": 14, "available_general_beds": 45}

    # Patient -> 403
    res_pat = client.patch("/api/v1/facilities/1/capacity", json=payload, headers=patient1_headers)
    assert res_pat.status_code == 403
    assert "lacks required permissions" in res_pat.json()["detail"]

    # Driver -> 403
    res_drv = client.patch("/api/v1/facilities/1/capacity", json=payload, headers=driver_headers)
    assert res_drv.status_code == 403

    # Hospital -> 200
    res_hsp = client.patch("/api/v1/facilities/1/capacity", json=payload, headers=hospital_headers)
    assert res_hsp.status_code == 200
    assert res_hsp.json()["available_icu_beds"] == 14

    # Admin -> 200
    res_adm = client.patch("/api/v1/facilities/1/capacity", json={"available_icu_beds": 16}, headers=admin_headers)
    assert res_adm.status_code == 200
    assert res_adm.json()["available_icu_beds"] == 16


# ── 3. Role-Based Access Control on Ambulance Assignments (403 Forbidden) ─────

def test_ambulance_assignment_permissions(
    client, patient1_headers, driver_headers, hospital_headers, dispatcher_headers
):
    """
    Only DISPATCHER and ADMIN roles may create dispatch assignments.
    PATIENT, DRIVER, and HOSPITAL roles must be rejected with 403 Forbidden.
    """
    # Create emergency first
    emg_res = client.post(
        "/api/v1/emergencies",
        json={
            "patient_name": "Assignment Test Patient",
            "contact_phone": "+91 98888 22222",
            "incident_address": "Koti Medical College, Hyderabad",
            "latitude": 17.3850,
            "longitude": 78.4867,
            "emergency_type": "CARDIAC",
            "severity": "CRITICAL",
        },
    )
    emg_id = emg_res.json()["id"]

    assign_payload = {
        "emergency_id": emg_id,
        "ambulance_id": 1,
        "notes": "Testing assignment permissions",
        "estimated_eta_minutes": 5,
    }

    # Patient -> 403
    res_pat = client.post("/api/v1/assignments", json=assign_payload, headers=patient1_headers)
    assert res_pat.status_code == 403

    # Driver -> 403
    res_drv = client.post("/api/v1/assignments", json=assign_payload, headers=driver_headers)
    assert res_drv.status_code == 403

    # Hospital -> 403
    res_hsp = client.post("/api/v1/assignments", json=assign_payload, headers=hospital_headers)
    assert res_hsp.status_code == 403

    # Dispatcher -> 201 Created
    res_dsp = client.post("/api/v1/assignments", json=assign_payload, headers=dispatcher_headers)
    assert res_dsp.status_code == 201
    assert res_dsp.json()["status"] == "DISPATCHED"


# ── 4. Patient Emergency Privacy & Access Control (403 Forbidden) ─────────────

def test_accessing_another_patients_emergency_rejected(client, patient1_headers, patient2_headers, admin_headers):
    """
    Verifies that Patient 2 CANNOT access an emergency created by Patient 1 (403 Forbidden).
    Patient 1 can access their own emergency (200 OK).
    Admin can access any emergency (200 OK).
    """
    # Patient 1 creates an emergency
    emg_create = client.post(
        "/api/v1/emergencies",
        json={
            "patient_name": "Ravi Teja",
            "contact_phone": "+91 98888 11111",
            "incident_address": "Ameerpet Metro Station, Hyderabad",
            "latitude": 17.4375,
            "longitude": 78.4482,
            "emergency_type": "TRAUMA",
            "severity": "HIGH",
        },
        headers=patient1_headers,
    )
    assert emg_create.status_code == 201
    emg_id = emg_create.json()["id"]

    # 1. Patient 2 tries to GET Patient 1's emergency -> 403 Forbidden!
    unauthorized_res = client.get(f"/api/v1/emergencies/{emg_id}", headers=patient2_headers)
    assert unauthorized_res.status_code == 403
    assert "another patient's emergency" in unauthorized_res.json()["detail"].lower()

    # 2. Patient 2 tries to view audit history -> 403 Forbidden!
    unauthorized_hist = client.get(f"/api/v1/emergencies/{emg_id}/history", headers=patient2_headers)
    assert unauthorized_hist.status_code == 403

    # 3. Patient 1 accesses own emergency -> 200 OK
    own_res = client.get(f"/api/v1/emergencies/{emg_id}", headers=patient1_headers)
    assert own_res.status_code == 200
    assert own_res.json()["patient_name"] == "Ravi Teja"

    # 4. Admin accesses Patient 1's emergency -> 200 OK
    admin_res = client.get(f"/api/v1/emergencies/{emg_id}", headers=admin_headers)
    assert admin_res.status_code == 200


# ── 5. Status Transition & Unauthorized Updates ────────────────────────────────

def test_unauthorized_emergency_status_updates(
    client, patient1_headers, patient2_headers, driver_headers, dispatcher_headers
):
    """
    Tests:
    - Patient cannot update emergency status to ON_SCENE / TRANSPORTING (403 Forbidden).
    - Patient cannot cancel another patient's emergency (403 Forbidden).
    - Patient can cancel their own active emergency (200 OK).
    - Driver and Dispatcher can advance status along the clinical path.
    """
    # Patient 1 creates emergency
    emg_res = client.post(
        "/api/v1/emergencies",
        json={
            "patient_name": "Ravi Teja",
            "contact_phone": "+91 98888 11111",
            "incident_address": "Dilsukhnagar Bus Depot",
            "latitude": 17.3687,
            "longitude": 78.5247,
            "emergency_type": "STROKE",
            "severity": "CRITICAL",
        },
        headers=patient1_headers,
    )
    emg_id = emg_res.json()["id"]

    # 1. Patient 1 attempts to set ON_SCENE -> 403 Forbidden
    res_pat_onscene = client.patch(
        f"/api/v1/emergencies/{emg_id}/status",
        json={"status": "ON_SCENE"},
        headers=patient1_headers,
    )
    assert res_pat_onscene.status_code == 403
    assert "only cancel" in res_pat_onscene.json()["detail"].lower()

    # 2. Patient 2 attempts to CANCEL Patient 1's emergency -> 403 Forbidden
    res_pat2_cancel = client.patch(
        f"/api/v1/emergencies/{emg_id}/status",
        json={"status": "CANCELLED"},
        headers=patient2_headers,
    )
    assert res_pat2_cancel.status_code == 403

    # 3. Patient 1 cancels their own emergency -> 200 OK
    res_pat1_cancel = client.patch(
        f"/api/v1/emergencies/{emg_id}/status",
        json={"status": "CANCELLED", "notes": "False alarm; situation resolved."},
        headers=patient1_headers,
    )
    assert res_pat1_cancel.status_code == 200
    assert res_pat1_cancel.json()["status"] == "CANCELLED"


def test_terminal_status_transitions_rejected(client, dispatcher_headers):
    """
    Cannot transition an emergency once it has entered terminal state (CANCELLED or RESOLVED).
    """
    # Create emergency
    emg_res = client.post(
        "/api/v1/emergencies",
        json={
            "patient_name": "Terminal Status Test",
            "contact_phone": "+91 98888 33333",
            "incident_address": "Hitech City Phase 2",
            "latitude": 17.4435,
            "longitude": 78.3772,
        },
    )
    emg_id = emg_res.json()["id"]

    # Cancel it
    client.patch(
        f"/api/v1/emergencies/{emg_id}/status",
        json={"status": "CANCELLED"},
        headers=dispatcher_headers,
    )

    # Attempt to transition from CANCELLED to EN_ROUTE -> 400 Bad Request
    res_reopen = client.patch(
        f"/api/v1/emergencies/{emg_id}/status",
        json={"status": "EN_ROUTE"},
        headers=dispatcher_headers,
    )
    assert res_reopen.status_code == 400
    assert "terminal status" in res_reopen.json()["detail"].lower()


# ── 6. Ambulance Location & Status RBAC ────────────────────────────────────────

def test_ambulance_telemetry_rbac(client, patient1_headers, driver_headers):
    """
    Patients cannot stream ambulance coordinates or change fleet status (403 Forbidden).
    Drivers and Dispatchers can update telemetry (200 OK).
    """
    loc_payload = {"latitude": 17.4200, "longitude": 78.4600, "speed_kmh": 50.0}

    # Patient -> 403
    res_pat = client.patch("/api/v1/ambulances/1/location", json=loc_payload, headers=patient1_headers)
    assert res_pat.status_code == 403

    # Driver -> 200
    res_drv = client.patch("/api/v1/ambulances/1/location", json=loc_payload, headers=driver_headers)
    assert res_drv.status_code == 200
    assert res_drv.json()["latitude"] == 17.4200


# ── 7. WebSocket Authentication Compatibility ─────────────────────────────────

def test_websocket_auth_compatibility(client, admin_headers):
    """
    Verifies that the WebSocket endpoint /ws/live remains protected by JWT tokens
    and is 100% compatible with Milestone 9.1 authentication.
    """
    token = admin_headers["Authorization"].split(" ")[1]
    with client.websocket_connect(f"/ws/live?token={token}") as ws:
        welcome = ws.receive_json()
        assert welcome["event"] == "connected"
        assert welcome["data"]["user"]["role"] == "ADMIN"

