import React from 'react';

export const PriorityBadge = ({ priority, label }) => {
  const configs = {
    P1: {
      bg: 'bg-rose-500/15 border-rose-500/40 text-rose-400',
      dot: 'bg-rose-500',
      defaultLabel: 'P1 Critical',
    },
    P2: {
      bg: 'bg-amber-500/15 border-amber-500/40 text-amber-400',
      dot: 'bg-amber-500',
      defaultLabel: 'P2 Urgent',
    },
    P3: {
      bg: 'bg-yellow-500/15 border-yellow-500/40 text-yellow-300',
      dot: 'bg-yellow-400',
      defaultLabel: 'P3 Moderate',
    },
    P4: {
      bg: 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400',
      dot: 'bg-emerald-500',
      defaultLabel: 'P4 Routine',
    },
  };

  const current = configs[priority] || configs.P3;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${current.bg}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${current.dot} animate-pulse`} />
      {label || current.defaultLabel}
    </span>
  );
};

export const StatusBadge = ({ status }) => {
  const configs = {
    REPORTED: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
    ASSIGNED: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
    EN_ROUTE: 'bg-amber-500/15 text-amber-300 border-amber-500/30 animate-pulse',
    ON_SCENE: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
    TRANSPORTING: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30 animate-pulse',
    RESOLVED: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    AVAILABLE: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    DISPATCHED: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    MAINTENANCE: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
  };

  const style = configs[status] || 'bg-slate-800 text-slate-300 border-slate-700';

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium border ${style}`}
    >
      {status ? status.replace('_', ' ') : 'UNKNOWN'}
    </span>
  );
};

export const TierBadge = ({ tier }) => {
  const isAls = tier === 'ALS';
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold tracking-wider border ${
        isAls
          ? 'bg-red-950/60 text-red-300 border-red-500/40'
          : 'bg-sky-950/60 text-sky-300 border-sky-500/40'
      }`}
    >
      {tier} {isAls ? '(Advanced Life Support)' : '(Basic Life Support)'}
    </span>
  );
};
