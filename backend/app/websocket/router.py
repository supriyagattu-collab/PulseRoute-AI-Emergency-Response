"""
WebSocket router for PulseRoute real-time event streaming with JWT Authentication.

Endpoint: ws://localhost:8000/ws/live?token=<jwt_token>

Clients must provide a valid JWT token signed with JWT_SECRET_KEY containing
an authorized role (ADMIN, DISPATCHER, OPERATOR, DRIVER, HOSPITAL).
Unauthenticated or unauthorized connections are rejected with close code 1008.
"""
import json
import logging
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Query, WebSocket, WebSocketDisconnect
from app.websocket.manager import manager
from app.auth.jwt import authenticate_websocket

logger = logging.getLogger("pulseroute.ws")

ws_router = APIRouter(tags=["WebSocket"])


@ws_router.websocket("/ws/live")
async def websocket_live(
    websocket: WebSocket,
    token: Optional[str] = Query(None, description="Signed JWT access token"),
):
    """
    Authenticated real-time event stream for PulseRoute authorized personnel.

    Handshake Authentication & RBAC:
      - Validates JWT signature and expiration.
      - Enforces allowed roles (ADMIN, DISPATCHER, OPERATOR, DRIVER, HOSPITAL).
      - Rejects missing, invalid, expired, or unauthorized tokens with WS 1008 Policy Violation.

    Payloads broadcast to connected clients:
      - ambulance_location (public vehicle telemetry without patient PII)
      - emergency_status (incident code and status transition without patient PII)
      - assignment_created (incident and vehicle pairing without patient PII)
    """
    # 1. Validate JWT token and role permissions
    is_valid, auth_result, close_code = authenticate_websocket(websocket, token=token)
    if not is_valid:
        logger.warning("Rejected WebSocket connection: %s", auth_result)
        # Close connection immediately with Policy Violation (1008)
        await websocket.close(code=close_code, reason=auth_result)
        return

    # 2. Accept and register authenticated connection
    payload = auth_result
    await manager.connect(websocket)
    logger.info(
        "Authenticated WS client connected: sub=%s, role=%s",
        payload.get("sub"),
        payload.get("role"),
    )

    # 3. Send welcome handshake confirming successful authentication
    try:
        await websocket.send_text(json.dumps({
            "event": "connected",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "data": {
                "message": "PulseRoute live feed connected (authenticated).",
                "active_connections": manager.active_count,
                "user": {
                    "user_id": payload.get("sub"),
                    "role": payload.get("role"),
                    "email": payload.get("email"),
                },
            },
        }))
    except Exception:
        pass

    # 4. Message loop: keep connection alive and handle client pings
    try:
        while True:
            text = await websocket.receive_text()
            if text.strip().lower() in {"ping", "heartbeat"}:
                await websocket.send_text(json.dumps({
                    "event": "pong",
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                }))
    except WebSocketDisconnect:
        logger.info("Authenticated WS client disconnected normally.")
    except Exception as exc:
        logger.warning("WS connection closed unexpectedly: %s", exc)
    finally:
        await manager.disconnect(websocket)


