/**
 * WsStatusBadge — tiny connection-state pill for dashboard headers.
 *
 * Shows:
 *   🟢 Live  — WebSocket open
 *   🟡 …     — Connecting / reconnecting
 *   🔴 Offline — Disconnected
 */
import React from 'react';
import { Wifi, WifiOff, Loader2 } from 'lucide-react';

export function WsStatusBadge({ connectionState }) {
  if (connectionState === 'open') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
        </span>
        Live
      </span>
    );
  }

  if (connectionState === 'connecting') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
        <Loader2 size={12} className="animate-spin" />
        Connecting…
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/15 text-red-400 border border-red-500/30">
      <WifiOff size={12} />
      Offline
    </span>
  );
}

export default WsStatusBadge;

