"""
Milestone 10.1: Production Security Hardening Test Suite.

Verifies all 15 security requirements:
 1. Demo token rejected when DEMO_MODE=False (HTTP 403)
 2. Demo token works only when explicitly enabled in development (HTTP 200)
 3. Token issuance rejects invalid credentials (HTTP 401)
 4. User cannot self-assign ADMIN role (HTTP 400/403/422)
 5. Incorrect password rejected (HTTP 401)
 6. Disabled user cannot authenticate (HTTP 403)
 7. Expired JWT rejected (HTTP 401)
 8. Revoked refresh token rejected (HTTP 401)
 9. Refresh-token reuse rejected & triggers security invalidation (HTTP 401)
10. Unauthorized role changes rejected (HTTP 403) & authorized admin role update works
11. Patient cannot access another patient's emergency record (HTTP 403)
12. SOS rate limit returns HTTP 429 after 5 requests/min/IP
13. CSRF protection works if cookie authentication is implemented (HTTP 403 on missing/invalid CSRF header)
14. CORS rejects unauthorized origins (no Access-Control-Allow-Origin header)
15. Existing WebSocket authentication remains secure (valid token connects, invalid/expired/unauthorized rejected)
"""
import json
import pytest
from datetime import timedelta
from starlette.websockets import WebSocketDisconnect
from app.config import settings
from app.models.user import User
from app.models.emergency import EmergencyReport
from app.auth.security import hash_password
from app.auth.jwt import create_access_token, create_refresh_token
from app.auth.rate_limiter import limiter


# ── Test 1 & 2: Demo Token Gate ───────────────────────────────────────────────

def test_1_demo_token_rejected_when_demo_mode_false(client):
    """
    1. Demo token endpoint must return HTTP 403 Forbidden when DEMO_MODE is False.
    """
    original_mode = settings.DEMO_MODE
    try:
        settings.DEMO_MODE = False
        res = client.get("/api/v1/auth/demo-token?role=admin", headers={"no_auth": True})
        assert res.status_code == 403
        data = res.json()
        assert "demo mode is disabled" in data["detail"].lower()
    finally:
        settings.DEMO_MODE = original_mode


def test_2_demo_token_works_only_when_explicitly_enabled(client):
    """
    2. Demo token works only when explicitly enabled in development.
    """
    settings.DEMO_MODE = True
    res = client.get("/api/v1/auth/demo-token?role=admin", headers={"no_auth": True})
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["role"] == "ADMIN"
    assert data["expires_in_minutes"] == 15


# ── Test 3: Token Issuance Rejects Invalid Credentials ────────────────────────

def test_3_token_issuance_rejects_invalid_credentials(client):
    """
    3. Token issuance rejects invalid or unknown credentials with HTTP 401.
    """
    # Test via /auth/login
    res1 = client.post(
        "/api/v1/auth/login",
        json={"email": "nonexistent@example.com", "password": "WrongPassword123!"},
        headers={"no_auth": True},
    )
    assert res1.status_code == 401
    assert "invalid email or password" in res1.json()["detail"].lower()

    # Test via /auth/token with credentials
    res2 = client.post(
        "/api/v1/auth/token",
        json={"email": "nonexistent@example.com", "password": "WrongPassword123!"},
        headers={"no_auth": True},
    )
    assert res2.status_code == 401


# ── Test 4: User Cannot Self-Assign ADMIN ─────────────────────────────────────

def test_4_user_cannot_self_assign_admin(client, db_session):
    """
    4. Users cannot self-assign ADMIN, DISPATCHER, DRIVER, or HOSPITAL roles.
    """
    # 4a. Attempt self-registration with ADMIN role
    res = client.post(
        "/api/v1/auth/register",
        json={
            "email": "attacker1@example.com",
            "password": "Password123!",
            "full_name": "Privilege Escalation Attempt",
            "role": "ADMIN",
        },
        headers={"no_auth": True},
    )
    # Pydantic field_validator raises ValueError -> HTTP 422 or 403
    assert res.status_code in [400, 403, 422]

    # 4b. Register as standard PATIENT
    res_reg = client.post(
        "/api/v1/auth/register",
        json={
            "email": "legitpatient@example.com",
            "password": "Password123!",
            "full_name": "Legit Citizen",
            "role": "PATIENT",
        },
        headers={"no_auth": True},
    )
    assert res_reg.status_code == 201

    # 4c. Attempt to claim ADMIN role during credential token exchange
    res_spoof = client.post(
        "/api/v1/auth/token",
        json={
            "email": "legitpatient@example.com",
            "password": "Password123!",
            "role": "ADMIN",
        },
        headers={"no_auth": True},
    )
    assert res_spoof.status_code == 403
    assert "cannot self-assign role" in res_spoof.json()["detail"].lower()


# ── Test 5: Incorrect Password Rejected ───────────────────────────────────────

def test_5_incorrect_password_rejected(client, db_session):
    """
    5. Incorrect password for an existing account is rejected with HTTP 401.
    """
    user = User(
        user_id="user-test-05",
        email="test5@example.com",
        hashed_password=hash_password("CorrectPassword123!"),
        full_name="Password Test User",
        role="PATIENT",
        status="ACTIVE",
        is_active=True,
    )
    db_session.add(user)
    db_session.commit()

    res = client.post(
        "/api/v1/auth/login",
        json={"email": "test5@example.com", "password": "WrongPassword456!"},
        headers={"no_auth": True},
    )
    assert res.status_code == 401
    assert "invalid email or password" in res.json()["detail"].lower()


# ── Test 6: Disabled User Cannot Authenticate ─────────────────────────────────

def test_6_disabled_user_cannot_authenticate(client, db_session):
    """
    6. Disabled or suspended user accounts are blocked from logging in with HTTP 403.
    """
    user = User(
        user_id="user-disabled-01",
        email="banned@example.com",
        hashed_password=hash_password("Password123!"),
        full_name="Disabled User",
        role="PATIENT",
        status="DISABLED",
        is_active=False,
    )
    db_session.add(user)
    db_session.commit()

    res = client.post(
        "/api/v1/auth/login",
        json={"email": "banned@example.com", "password": "Password123!"},
        headers={"no_auth": True},
    )
    assert res.status_code == 403
    assert "disabled" in res.json()["detail"].lower()


# ── Test 7: Expired JWT Rejected ──────────────────────────────────────────────

def test_7_expired_jwt_rejected(client):
    """
    7. Expired JWT tokens are rejected with HTTP 401 Unauthorized.
    """
    expired_token = create_access_token(
        {"sub": "user-exp", "email": "exp@example.com", "role": "PATIENT"},
        expires_delta=timedelta(seconds=-30),
    )
    res = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {expired_token}"},
    )
    assert res.status_code == 401
    assert "expired" in res.json()["detail"].lower()


# ── Test 8: Revoked Refresh Token Rejected ────────────────────────────────────

def test_8_revoked_refresh_token_rejected(client, db_session):
    """
    8. Revoked refresh token cannot be used to rotate or issue new access tokens.
    """
    # 1. Log in to obtain fresh tokens
    login_res = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@example.com", "password": "DemoPassword123!"},
        headers={"no_auth": True},
    )
    assert login_res.status_code == 200
    refresh_token = login_res.json()["refresh_token"]

    # 2. Call logout to explicitly revoke the token
    logout_res = client.post(
        "/api/v1/auth/logout",
        json={"refresh_token": refresh_token},
        headers={"no_auth": True},
    )
    assert logout_res.status_code == 200

    # 3. Attempt to refresh with the revoked token
    refresh_res = client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": refresh_token},
        headers={"no_auth": True},
    )
    assert refresh_res.status_code == 401
    assert "revoked" in refresh_res.json()["detail"].lower()


# ── Test 9: Refresh Token Reuse Rejected & Invalidation ───────────────────────

def test_9_refresh_token_reuse_rejected(client, db_session):
    """
    9. Refresh token reuse triggers theft alert and immediately revokes all descendant sessions.
    """
    # 1. Log in
    login_res = client.post(
        "/api/v1/auth/login",
        json={"email": "dispatcher@example.com", "password": "DemoPassword123!"},
        headers={"no_auth": True},
    )
    assert login_res.status_code == 200
    r1 = login_res.json()["refresh_token"]

    # 2. Legitimate rotation: R1 -> R2
    rot1 = client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": r1},
        headers={"no_auth": True},
    )
    assert rot1.status_code == 200
    r2 = rot1.json()["refresh_token"]

    # 3. Malicious attempt to reuse old token R1 again!
    reuse_res = client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": r1},
        headers={"no_auth": True},
    )
    assert reuse_res.status_code == 401
    assert "reuse detected" in reuse_res.json()["detail"].lower()

    # 4. Invalidation check: R2 must now also be rejected because all sessions were revoked!
    rot2 = client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": r2},
        headers={"no_auth": True},
    )
    assert rot2.status_code == 401


# ── Test 10: Unauthorized Role Changes Rejected ───────────────────────────────

def test_10_unauthorized_role_changes_rejected(client, db_session):
    """
    10. Role changes can ONLY be performed by authorized administrators (ADMIN).
    """
    # Target user
    target_user = User(
        user_id="user-target-10",
        email="target10@example.com",
        hashed_password=hash_password("Password123!"),
        full_name="Target Role User",
        role="PATIENT",
        status="ACTIVE",
        is_active=True,
    )
    db_session.add(target_user)
    db_session.commit()

    # Non-admin token (Driver)
    driver_token = create_access_token({"sub": "user-drv-01", "role": "DRIVER"})

    # Non-admin attempts to update role
    res_forbidden = client.patch(
        f"/api/v1/auth/users/{target_user.user_id}/role",
        json={"role": "ADMIN"},
        headers={"Authorization": f"Bearer {driver_token}"},
    )
    assert res_forbidden.status_code == 403

    # Admin token
    admin_token = create_access_token({"sub": "user-adm-01", "role": "ADMIN"})
    res_admin = client.patch(
        f"/api/v1/auth/users/{target_user.user_id}/role",
        json={"role": "DISPATCHER"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res_admin.status_code == 200
    assert res_admin.json()["role"] == "DISPATCHER"


# ── Test 11: Patient Cannot Access Another Patient's Emergency ───────────────

def test_11_patient_cannot_access_another_patients_emergency(client, db_session):
    """
    11. Patient A cannot access Patient B's emergency record (HTTP 403 Forbidden).
    """
    # Patient A creates emergency record
    emg = EmergencyReport(
        incident_code="EMG-SEC-101",
        patient_name="Patient Alpha",
        contact_phone="+91 98490 99001",
        emergency_type="CARDIAC",
        severity="CRITICAL",
        status="REPORTED",
        incident_address="Banjara Hills Rd 1",
        latitude=17.4150,
        longitude=78.4480,
        creator_id="patient-alpha-id",
        caller_name="Patient Alpha",
    )
    db_session.add(emg)
    db_session.commit()
    db_session.refresh(emg)

    # Patient B attempts access
    patient_b_token = create_access_token({
        "sub": "patient-beta-id",
        "email": "beta@example.com",
        "role": "PATIENT",
        "name": "Patient Beta",
        "phone": "+91 98490 99002",
    })

    res = client.get(
        f"/api/v1/emergencies/{emg.id}",
        headers={"Authorization": f"Bearer {patient_b_token}"},
    )
    assert res.status_code == 403
    assert "permission to view another patient" in res.json()["detail"].lower()


# ── Test 12: SOS Rate Limit Returns HTTP 429 ─────────────────────────────────

def test_12_sos_rate_limit_returns_http_429(client):
    """
    12. Exceeding maximum 5 SOS requests per minute per IP returns HTTP 429 Too Many Requests.
    """
    limiter.reset()
    payload = {
        "patient_name": "Rate Limit Test Patient",
        "contact_phone": "+91 98490 00000",
        "incident_address": "Tank Bund Rd, Hyderabad",
        "latitude": 17.4200,
        "longitude": 78.4700,
        "emergency_type": "GENERAL",
        "severity": "MODERATE",
    }

    # First 5 requests must succeed
    for i in range(5):
        res = client.post(
            "/api/v1/emergencies",
            json={**payload, "patient_name": f"Patient {i}"},
            headers={"no_auth": True},
        )
        assert res.status_code == 201

    # 6th request from same IP must be rejected with 429
    res_limited = client.post(
        "/api/v1/emergencies",
        json=payload,
        headers={"no_auth": True},
    )
    assert res_limited.status_code == 429
    assert "Retry-After" in res_limited.headers
    assert "rate limit exceeded" in res_limited.json()["detail"].lower()
    limiter.reset()


# ── Test 13: CSRF Protection with Cookie Authentication ───────────────────────

def test_13_csrf_protection_works_with_cookie_authentication(client, db_session):
    """
    13. CSRF protection enforces valid Double Submit CSRF token when using cookie authentication.
    """
    # Log in to receive cookies
    login_res = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@example.com", "password": "DemoPassword123!"},
        headers={"no_auth": True},
    )
    assert login_res.status_code == 200
    cookies = login_res.cookies
    refresh_cookie = cookies.get("pulseroute_refresh_token")
    csrf_cookie = cookies.get("pulseroute_csrf_token")
    assert refresh_cookie is not None
    assert csrf_cookie is not None

    # Case A: Request with cookie but MISSING X-CSRF-Token header -> 403 Forbidden
    res_no_csrf = client.post(
        "/api/v1/auth/refresh",
        cookies={"pulseroute_refresh_token": refresh_cookie, "pulseroute_csrf_token": csrf_cookie},
        headers={"no_auth": True},  # No X-CSRF-Token header
    )
    assert res_no_csrf.status_code == 403
    assert "csrf validation failed" in res_no_csrf.json()["detail"].lower()

    # Case B: Request with cookie and INVALID X-CSRF-Token header -> 403 Forbidden
    res_bad_csrf = client.post(
        "/api/v1/auth/refresh",
        cookies={"pulseroute_refresh_token": refresh_cookie, "pulseroute_csrf_token": csrf_cookie},
        headers={"no_auth": True, "x-csrf-token": "wrong-tampered-token"},
    )
    assert res_bad_csrf.status_code == 403

    # Case C: Request with cookie and MATCHING X-CSRF-Token header -> 200 OK
    res_valid_csrf = client.post(
        "/api/v1/auth/refresh",
        cookies={"pulseroute_refresh_token": refresh_cookie, "pulseroute_csrf_token": csrf_cookie},
        headers={"no_auth": True, "x-csrf-token": csrf_cookie},
    )
    assert res_valid_csrf.status_code == 200
    assert "access_token" in res_valid_csrf.json()


# ── Test 14: CORS Rejects Unauthorized Origins ────────────────────────────────

def test_14_cors_rejects_unauthorized_origins(client):
    """
    14. CORS rejects unauthorized origins and only responds with Access-Control-Allow-Origin
    for configured origins.
    """
    # Request from an unauthorized evil domain
    res = client.options(
        "/api/v1/emergencies",
        headers={
            "no_auth": True,
            "Origin": "https://malicious-evil-phishing-site.com",
            "Access-Control-Request-Method": "POST",
        },
    )
    # The header must NOT allow the malicious origin
    allow_origin = res.headers.get("access-control-allow-origin")
    assert allow_origin != "https://malicious-evil-phishing-site.com"

    # Request from allowed local dev origin
    res_allowed = client.options(
        "/api/v1/emergencies",
        headers={
            "no_auth": True,
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "POST",
        },
    )
    assert res_allowed.headers.get("access-control-allow-origin") == "http://localhost:5173"


# ── Test 15: WebSocket Authentication Remains Secure ──────────────────────────

def test_15_existing_websocket_authentication_remains_secure(client):
    """
    15. WebSocket handshake authentication remains strictly enforced:
    - Valid JWT connects and receives welcome event.
    - Missing token rejected (1008).
    - Invalid signature rejected (1008).
    - Expired token rejected (1008).
    - Unauthorized role (REPORTER) rejected (1008).
    """
    # 1. Missing token
    with pytest.raises(WebSocketDisconnect) as exc1:
        with client.websocket_connect("/ws/live"):
            pass
    assert exc1.value.code == 1008

    # 2. Invalid token
    with pytest.raises(WebSocketDisconnect) as exc2:
        with client.websocket_connect("/ws/live?token=invalid.tampered.token"):
            pass
    assert exc2.value.code == 1008

    # 3. Expired token
    expired_token = create_access_token({"sub": "u", "role": "ADMIN"}, expires_delta=timedelta(seconds=-10))
    with pytest.raises(WebSocketDisconnect) as exc3:
        with client.websocket_connect(f"/ws/live?token={expired_token}"):
            pass
    assert exc3.value.code == 1008

    # 4. Unauthorized role (REPORTER)
    rep_token = create_access_token({"sub": "u", "role": "REPORTER"})
    with pytest.raises(WebSocketDisconnect) as exc4:
        with client.websocket_connect(f"/ws/live?token={rep_token}"):
            pass
    assert exc4.value.code == 1008

    # 5. Valid authorized token (ADMIN)
    valid_token = create_access_token({"sub": "user-adm-01", "role": "ADMIN"})
    with client.websocket_connect(f"/ws/live?token={valid_token}") as ws:
        msg = json.loads(ws.receive_text())
        assert msg["event"] == "connected"
        assert msg["data"]["user"]["role"] == "ADMIN"

