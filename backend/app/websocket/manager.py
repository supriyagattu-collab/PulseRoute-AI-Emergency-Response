"""
WebSocket Connection Manager for PulseRoute Real-Time Communication.

Manages a registry of active WebSocket connections and provides
broadcast helpers for three event types:
  - ambulance_location  : GPS coordinate update
  - emergency_status    : Status transition
  - assignment_created  : New ambulance-to-emergency assignment
"""
import asyncio
import json
import logging
from datetime import datetime, timezone
from typing import Set
from fastapi import WebSocket

logger = logging.getLogger("pulseroute.ws")


class ConnectionManager:
    """Thread-safe WebSocket connection registry with broadcast support."""

    def __init__(self):
        self._connections: Set[WebSocket] = set()
        self._lock = asyncio.Lock()

    async def connect(self, websocket: WebSocket) -> None:
        await websocket.accept()
        async with self._lock:
            self._connections.add(websocket)
        logger.info("WS client connected. Total: %d", len(self._connections))

    async def disconnect(self, websocket: WebSocket) -> None:
        async with self._lock:
            self._connections.discard(websocket)
        logger.info("WS client disconnected. Total: %d", len(self._connections))

    @property
    def active_count(self) -> int:
        return len(self._connections)

    async def broadcast(self, event_type: str, payload: dict) -> None:
        """
        Send a JSON message to every connected client.
        Automatically removes stale connections on send failure.
        """
        if not self._connections:
            return

        message = json.dumps({
            "event": event_type,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "data": payload,
        })

        stale: Set[WebSocket] = set()
        async with self._lock:
            targets = set(self._connections)

        for ws in targets:
            try:
                await ws.send_text(message)
            except Exception:
                stale.add(ws)

        if stale:
            async with self._lock:
                self._connections -= stale
            logger.info("Removed %d stale WS connections.", len(stale))

    # --- Typed broadcast helpers ---------------------------------------------------

    async def broadcast_ambulance_location(
        self,
        ambulance_id: int,
        ambulance_code: str,
        lat: float,
        lng: float,
        speed_kmh: float | None,
        status: str,
    ) -> None:
        await self.broadcast("ambulance_location", {
            "ambulance_id": ambulance_id,
            "ambulance_code": ambulance_code,
            "lat": lat,
            "lng": lng,
            "speed_kmh": speed_kmh,
            "status": status,
        })

    async def broadcast_emergency_status(
        self,
        emergency_id: int,
        incident_code: str,
        old_status: str | None,
        new_status: str,
        changed_by: str,
        notes: str,
    ) -> None:
        await self.broadcast("emergency_status", {
            "emergency_id": emergency_id,
            "incident_code": incident_code,
            "old_status": old_status,
            "new_status": new_status,
            "changed_by": changed_by,
            "notes": notes,
        })

    async def broadcast_assignment_created(
        self,
        assignment_id: int,
        emergency_id: int,
        incident_code: str,
        ambulance_id: int,
        ambulance_code: str,
        estimated_eta_minutes: int,
    ) -> None:
        await self.broadcast("assignment_created", {
            "assignment_id": assignment_id,
            "emergency_id": emergency_id,
            "incident_code": incident_code,
            "ambulance_id": ambulance_id,
            "ambulance_code": ambulance_code,
            "estimated_eta_minutes": estimated_eta_minutes,
        })


# Singleton instance shared across the entire application lifecycle
manager = ConnectionManager()

