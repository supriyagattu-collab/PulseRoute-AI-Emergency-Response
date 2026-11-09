/**
 * useWebSocket — React hook for PulseRoute real-time event subscription.
 *
 * Usage:
 *   const { isConnected, connectionState } = useWebSocket({
 *     onAmbulanceLocation: (data) => { ... },
 *     onEmergencyStatus:   (data) => { ... },
 *     onAssignmentCreated: (data) => { ... },
 *   });
 *
 * The hook manages connect/disconnect lifecycle automatically.
 * Reconnection with exponential backoff is handled by wsService.
 */
import { useEffect, useState, useCallback } from 'react';
import wsService, { WS_EVENTS } from '../services/websocketService';

/**
 * @param {object} options
 * @param {function} [options.onAmbulanceLocation]  - GPS update payload
 * @param {function} [options.onEmergencyStatus]    - Status change payload
 * @param {function} [options.onAssignmentCreated]  - New assignment payload
 * @param {boolean}  [options.enabled=true]         - Set false to disable the hook
 */
export function useWebSocket({
  onAmbulanceLocation,
  onEmergencyStatus,
  onAssignmentCreated,
  enabled = true,
} = {}) {
  const [connectionState, setConnectionState] = useState('closed');

  // Stable callbacks using useCallback to avoid stale-closure re-subscriptions
  const handleLocation = useCallback(
    (data) => onAmbulanceLocation?.(data),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );
  const handleStatus = useCallback(
    (data) => onEmergencyStatus?.(data),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );
  const handleAssignment = useCallback(
    (data) => onAssignmentCreated?.(data),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  useEffect(() => {
    if (!enabled) return;

    // State change listener
    wsService.onStateChange(setConnectionState);

    // Event subscriptions
    const unsubLocation   = wsService.on(WS_EVENTS.AMBULANCE_LOCATION,  (d) => onAmbulanceLocation?.(d));
    const unsubStatus     = wsService.on(WS_EVENTS.EMERGENCY_STATUS,     (d) => onEmergencyStatus?.(d));
    const unsubAssignment = wsService.on(WS_EVENTS.ASSIGNMENT_CREATED,   (d) => onAssignmentCreated?.(d));

    // Connect (idempotent if already open)
    wsService.connect();

    return () => {
      unsubLocation();
      unsubStatus();
      unsubAssignment();
    };
  }, [enabled]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    connectionState,
    isConnected: connectionState === 'open',
    isConnecting: connectionState === 'connecting',
  };
}

export default useWebSocket;

