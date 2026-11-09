/**
 * PulseRoute WebSocket Service
 *
 * Manages a persistent WebSocket connection to the FastAPI backend at
 * ws://localhost:8000/ws/live
 *
 * Features:
 *  - Automatic exponential-backoff reconnection (max 30 s delay)
 *  - Typed event callbacks: ambulance_location, emergency_status, assignment_created
 *  - Heartbeat ping every 25 seconds to keep the connection alive
 *  - Clean disconnect on unmount
 */

const WS_URL =
  (import.meta.env.VITE_WS_URL ||
    (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000')
      .replace(/^http/, 'ws')
      .replace(/\/api\/v1$/, '')) + '/ws/live';

const HEARTBEAT_INTERVAL_MS = 25_000;
const MAX_BACKOFF_MS = 30_000;

export const WS_EVENTS = {
  CONNECTED: 'connected',
  AMBULANCE_LOCATION: 'ambulance_location',
  EMERGENCY_STATUS: 'emergency_status',
  ASSIGNMENT_CREATED: 'assignment_created',
  PONG: 'pong',
};

class PulseRouteWebSocketService {
  constructor() {
    this._ws = null;
    this._token = null;
    this._listeners = {}; // eventType → Set<callback>
    this._reconnectAttempts = 0;
    this._reconnectTimer = null;
    this._heartbeatTimer = null;
    this._intentionalClose = false;
    this._onStateChange = null; // (state: 'connecting'|'open'|'closed') => void
  }

  // ── Public API ──────────────────────────────────────────────────────────────

  /**
   * Set or update the JWT authentication token for WebSocket sessions.
   * Reconnects automatically if a connection is currently open.
   */
  setToken(token) {
    this._token = token;
    if (this._ws && this._ws.readyState === WebSocket.OPEN) {
      this.disconnect();
      this.connect(token);
    }
  }

  /** Connect (or reconnect) to the WebSocket server with optional JWT token. */
  connect(token = null) {
    if (token) this._token = token;
    if (this._ws && this._ws.readyState === WebSocket.OPEN) return;
    this._intentionalClose = false;
    this._openSocket();
  }

  /** Gracefully disconnect and suppress automatic reconnection. */
  disconnect() {
    this._intentionalClose = true;
    this._clearTimers();
    if (this._ws) {
      this._ws.close(1000, 'Client intentional disconnect');
      this._ws = null;
    }
    this._notifyState('closed');
  }

  /**
   * Subscribe to a WebSocket event type.
   * @param {string} eventType - One of WS_EVENTS.*
   * @param {function} callback - Receives the parsed data payload
   * @returns {function} Unsubscribe function
   */
  on(eventType, callback) {
    if (!this._listeners[eventType]) {
      this._listeners[eventType] = new Set();
    }
    this._listeners[eventType].add(callback);
    return () => this.off(eventType, callback);
  }

  /** Unsubscribe a specific callback. */
  off(eventType, callback) {
    this._listeners[eventType]?.delete(callback);
  }

  /**
   * Subscribe to connection state changes.
   * @param {function} handler - (state: string) => void
   */
  onStateChange(handler) {
    this._onStateChange = handler;
  }

  get readyState() {
    return this._ws ? this._ws.readyState : WebSocket.CLOSED;
  }

  get isOpen() {
    return this._ws?.readyState === WebSocket.OPEN;
  }

  // ── Private ──────────────────────────────────────────────────────────────────

  _openSocket() {
    this._notifyState('connecting');
    const token = this._token || localStorage.getItem('pulseroute_token');
    const wsEndpoint = token
      ? `${WS_URL}?token=${encodeURIComponent(token)}`
      : WS_URL;

    try {
      this._ws = new WebSocket(wsEndpoint);
    } catch (err) {
      console.warn('[PulseRoute WS] Could not create WebSocket:', err);
      this._scheduleReconnect();
      return;
    }

    this._ws.onopen = () => {
      console.info('[PulseRoute WS] Connected to', WS_URL);
      this._reconnectAttempts = 0;
      this._notifyState('open');
      this._startHeartbeat();
    };

    this._ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        this._dispatch(msg.event, msg.data, msg.timestamp);
      } catch {
        // Non-JSON frame — ignore
      }
    };

    this._ws.onclose = (ev) => {
      this._clearTimers();
      this._notifyState('closed');
      if (ev.code === 1008) {
        console.warn(
          '[PulseRoute WS] Handshake rejected due to auth/policy violation (code 1008):',
          ev.reason
        );
        // Do not auto-reconnect on permanent authorization failure
        return;
      }
      if (!this._intentionalClose) {
        console.warn('[PulseRoute WS] Disconnected (code=%d). Reconnecting…', ev.code);
        this._scheduleReconnect();
      }
    };

    this._ws.onerror = () => {
      // onerror is always followed by onclose; let onclose handle reconnection
    };
  }

  _dispatch(eventType, data, timestamp) {
    const handlers = this._listeners[eventType];
    if (handlers) {
      handlers.forEach((cb) => {
        try {
          cb(data, timestamp);
        } catch (err) {
          console.error('[PulseRoute WS] Handler error for', eventType, err);
        }
      });
    }
  }

  _scheduleReconnect() {
    if (this._intentionalClose) return;
    const delay = Math.min(1000 * 2 ** this._reconnectAttempts, MAX_BACKOFF_MS);
    this._reconnectAttempts += 1;
    console.info('[PulseRoute WS] Reconnecting in %dms (attempt %d)', delay, this._reconnectAttempts);
    this._reconnectTimer = setTimeout(() => this._openSocket(), delay);
  }

  _startHeartbeat() {
    this._heartbeatTimer = setInterval(() => {
      if (this._ws?.readyState === WebSocket.OPEN) {
        this._ws.send('ping');
      }
    }, HEARTBEAT_INTERVAL_MS);
  }

  _clearTimers() {
    clearTimeout(this._reconnectTimer);
    clearInterval(this._heartbeatTimer);
    this._reconnectTimer = null;
    this._heartbeatTimer = null;
  }

  _notifyState(state) {
    this._onStateChange?.(state);
  }
}

/** Singleton — shared across the entire React app */
export const wsService = new PulseRouteWebSocketService();
export default wsService;

