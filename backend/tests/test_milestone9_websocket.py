"""
Milestone 9 & 9.1: WebSocket Real-Time Communication & Security Tests.

Tests cover:
1. WebSocket /ws/live token authentication (handshake RBAC)
2. Rejection of missing, invalid, expired, and unauthorized role tokens (code 1008)
3. Acceptance of authorized roles (ADMIN, DISPATCHER, DRIVER, HOSPITAL)
4. REST auth endpoints: POST /api/v1/auth/token, GET /api/v1/auth/demo-token
5. Real-time GPS location update broadcast to authenticated clients
6. Real-time emergency status update broadcast to authenticated clients
7. Real-time assignment creation broadcast to authenticated clients
8. Redaction check: patient PII strictly excluded from broadcasts
9. Ping/pong heartbeat and connection tracking
10. ConnectionManager unit tests
"""
import json
import asyncio
from datetime import datetime, timedelta, timezone
import pytest
from unittest.mock import AsyncMock
from starlette.websockets import WebSocketDisconnect
from app.auth.jwt import create_access_token
from app.config import settings


@pytest.fixture
def admin_token():
    """Generates a valid JWT token with ADMIN role."""
    return create_access_token({
        "sub": "user-adm-01",
        "email": "admin@example.com",
        "role": "ADMIN",
        "name": "Admin Tester",
    })


@pytest.fixture
def driver_token():
    """Generates a valid JWT token with DRIVER role."""
    return create_access_token({
        "sub": "user-drv-01",
        "email": "driver@example.com",
        "role": "DRIVER",
        "name": "Driver Tester",
    })


@pytest.fixture
def unauthorized_token():
    """Generates a valid JWT token with unauthorized REPORTER role."""
    return create_access_token({
        "sub": "user-rep-01",
        "email": "reporter@example.com",
        "role": "REPORTER",
        "name": "Citizen Reporter",
    })


@pytest.fixture
def expired_token():
    """Generates an expired JWT token."""
    return create_access_token(
        {"sub": "user-adm-01", "role": "ADMIN"},
        expires_delta=timedelta(seconds=-10),  # expired 10s ago
    )


# ── Milestone 9.1: Security & Handshake Authentication Tests ──────────────────

def test_websocket_rejects_missing_token(client):
    """
    Test that connection without a token is rejected with WS 1008 (Policy Violation).
    """
    with pytest.raises(WebSocketDisconnect) as exc_info:
        with client.websocket_connect("/ws/live"):
            pass
    assert exc_info.value.code == 1008


def test_websocket_rejects_invalid_token(client):
    """
    Test that connection with a malformed/tampered token is rejected with WS 1008.
    """
    with pytest.raises(WebSocketDisconnect) as exc_info:
        with client.websocket_connect("/ws/live?token=invalid.tampered.token"):
            pass
    assert exc_info.value.code == 1008


def test_websocket_rejects_expired_token(client, expired_token):
    """
    Test that connection with an expired token is rejected with WS 1008.
    """
    with pytest.raises(WebSocketDisconnect) as exc_info:
        with client.websocket_connect(f"/ws/live?token={expired_token}"):
            pass
    assert exc_info.value.code == 1008


def test_websocket_rejects_unauthorized_role(client, unauthorized_token):
    """
    Test that connection with a valid token but unauthorized role (REPORTER) is rejected with WS 1008.
    """
    with pytest.raises(WebSocketDisconnect) as exc_info:
        with client.websocket_connect(f"/ws/live?token={unauthorized_token}"):
            pass
    assert exc_info.value.code == 1008


def test_websocket_accepts_authorized_roles(client, admin_token, driver_token):
    """
    Test that authorized roles (ADMIN, DRIVER) connect successfully and receive welcome payload.
    """
    # 1. Test ADMIN role
    with client.websocket_connect(f"/ws/live?token={admin_token}") as ws_admin:
        data = json.loads(ws_admin.receive_text())
        assert data["event"] == "connected"
        assert data["data"]["user"]["role"] == "ADMIN"
        assert data["data"]["active_connections"] >= 1

    # 2. Test DRIVER role
    with client.websocket_connect(f"/ws/live?token={driver_token}") as ws_driver:
        data = json.loads(ws_driver.receive_text())
        assert data["event"] == "connected"
        assert data["data"]["user"]["role"] == "DRIVER"


def test_websocket_header_auth_support(client, admin_token):
    """
    Test that non-browser clients can authenticate via Authorization: Bearer header.
    """
    with client.websocket_connect(
        "/ws/live",
        headers={"Authorization": f"Bearer {admin_token}"},
    ) as ws:
        data = json.loads(ws.receive_text())
        assert data["event"] == "connected"
        assert data["data"]["user"]["role"] == "ADMIN"


# ── Milestone 9.1: Auth REST Endpoints ────────────────────────────────────────

def test_auth_issue_token_endpoint(client):
    """
    Test POST /api/v1/auth/token generates a valid signed JWT access token.
    """
    res = client.post(
        "/api/v1/auth/token",
        json={
            "user_id": "test-admin",
            "email": "test@admin.org",
            "role": "ADMIN",
            "name": "Test Administrator",
        },
    )
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["role"] == "ADMIN"
    assert data["user_id"] == "test-admin"

    # Use the token to connect to WebSocket
    with client.websocket_connect(f"/ws/live?token={data['access_token']}") as ws:
        msg = json.loads(ws.receive_text())
        assert msg["event"] == "connected"
        assert msg["data"]["user"]["role"] == "ADMIN"


def test_auth_demo_token_endpoint(client):
    """
    Test GET /api/v1/auth/demo-token returns pre-signed tokens for demo users.
    """
    for role in ["admin", "driver", "hospital"]:
        res = client.get(f"/api/v1/auth/demo-token?role={role}")
        assert res.status_code == 200
        data = res.json()
        assert data["role"] == role.upper()
        # Verify token works on WebSocket
        with client.websocket_connect(f"/ws/live?token={data['access_token']}") as ws:
            msg = json.loads(ws.receive_text())
            assert msg["event"] == "connected"


# ── Milestone 9: Real-Time Broadcast & Heartbeat Tests ────────────────────────

def test_websocket_ping_pong(client, admin_token):
    """
    Test sending 'ping' receives 'pong'.
    """
    with client.websocket_connect(f"/ws/live?token={admin_token}") as ws:
        ws.receive_text()  # welcome message
        ws.send_text("ping")
        pong = json.loads(ws.receive_text())
        assert pong["event"] == "pong"


def test_ws_status_endpoint_returns_connection_count(client):
    """
    Test GET /ws/status returns active connection count.
    """
    res = client.get("/ws/status")
    assert res.status_code == 200
    data = res.json()
    assert "active_websocket_connections" in data
    assert "websocket_endpoint" in data
    assert isinstance(data["active_websocket_connections"], int)


def test_multi_client_live_broadcasts_and_redaction(client, admin_token, driver_token):
    """
    Test that authenticated multi-clients receive live updates AND that
    patient personal information (name, phone, age, symptoms) is strictly redacted.
    """
    with client.websocket_connect(f"/ws/live?token={admin_token}") as ws1:
        json.loads(ws1.receive_text())  # welcome 1

        with client.websocket_connect(f"/ws/live?token={driver_token}") as ws2:
            json.loads(ws2.receive_text())  # welcome 2

            # 1. Trigger GPS update
            loc_res = client.patch(
                "/api/v1/ambulances/1/location",
                json={"latitude": 17.4321, "longitude": 78.4987, "speed_kmh": 58.0},
            )
            assert loc_res.status_code == 200

            ws1_loc = json.loads(ws1.receive_text())
            ws2_loc = json.loads(ws2.receive_text())

            assert ws1_loc["event"] == "ambulance_location"
            assert ws1_loc["data"]["lat"] == 17.4321
            assert ws1_loc["data"]["lng"] == 78.4987
            assert ws2_loc["data"] == ws1_loc["data"]

            # 2. Trigger Emergency Status update
            emg_res = client.post(
                "/api/v1/emergencies",
                json={
                    "patient_name": "Sensitive Patient Name",
                    "contact_phone": "+91 99999 11111",
                    "patient_age": 45,
                    "symptoms": "Severe chest pain",
                    "incident_address": "Banjara Hills, Hyderabad",
                    "latitude": 17.4150,
                    "longitude": 78.4350,
                    "emergency_type": "CARDIAC",
                    "severity": "CRITICAL",
                },
            )
            assert emg_res.status_code == 201
            emg_id = emg_res.json()["id"]

            status_res = client.patch(
                f"/api/v1/emergencies/{emg_id}/status",
                json={"status": "EN_ROUTE", "changed_by": "DISPATCHER", "notes": "Responding code red"},
            )
            assert status_res.status_code == 200

            ws1_st = json.loads(ws1.receive_text())
            ws2_st = json.loads(ws2.receive_text())

            assert ws1_st["event"] == "emergency_status"
            assert ws1_st["data"]["new_status"] == "EN_ROUTE"
            assert ws2_st["data"] == ws1_st["data"]

            # 3. Trigger Assignment Created
            assign_res = client.post(
                "/api/v1/assignments",
                json={
                    "emergency_id": emg_id,
                    "ambulance_id": 1,
                    "notes": "ALS unit dispatch",
                    "estimated_eta_minutes": 5,
                },
            )
            assert assign_res.status_code == 201

            ws1_asg = json.loads(ws1.receive_text())
            ws2_asg = json.loads(ws2.receive_text())

            assert ws1_asg["event"] == "assignment_created"
            assert ws1_asg["data"]["emergency_id"] == emg_id
            assert ws2_asg["data"] == ws1_asg["data"]

            # 4. Strict Patient PII Redaction Verification
            sensitive_fields = {"patient_name", "contact_phone", "patient_age", "symptoms"}
            for frame in [ws1_loc["data"], ws1_st["data"], ws1_asg["data"]]:
                leaks = sensitive_fields.intersection(frame.keys())
                assert len(leaks) == 0, f"Found sensitive data leak in frame: {leaks}"


# ── Milestone 9: ConnectionManager Unit Tests ─────────────────────────────────

def test_connection_manager_broadcast_skips_empty():
    """
    Unit test: broadcast with no connected clients should complete without error.
    """
    from app.websocket.manager import ConnectionManager
    mgr = ConnectionManager()

    async def _run():
        await mgr.broadcast("test_event", {"key": "value"})

    asyncio.run(_run())


def test_connection_manager_disconnect_removes_client():
    """
    Unit test: disconnect removes websocket from registry.
    """
    from app.websocket.manager import ConnectionManager
    mgr = ConnectionManager()

    mock_ws = AsyncMock()
    mock_ws.accept = AsyncMock()

    async def _run():
        await mgr.connect(mock_ws)
        assert mgr.active_count == 1
        await mgr.disconnect(mock_ws)
        assert mgr.active_count == 0

    asyncio.run(_run())
