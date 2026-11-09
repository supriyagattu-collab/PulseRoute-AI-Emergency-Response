import React from 'react';

export const StatsCard = ({
  title,
  value,
  subtext,
  icon: Icon,
  badgeText,
  badgeColor = 'emerald', // 'emerald', 'rose', 'sky', 'amber'
  trend,
}) => {
  const badgeClasses = {
    emerald: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    rose: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
    sky: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
    amber: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  };

  return (
    <div className="glass-panel p-5 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between">
      <div className="flex items-center justify-between text-slate-400 mb-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{title}</span>
        {Icon && (
          <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300">
            <Icon className="w-4 h-4 text-rose-400" />
          </div>
        )}
      </div>

      <div className="mt-1">
        <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">{value}</div>
        <div className="flex items-center gap-2 mt-2">
          {badgeText && (
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                badgeClasses[badgeColor] || badgeClasses.emerald
              }`}
            >
              {badgeText}
            </span>
          )}
          {subtext && <span className="text-[11px] text-slate-400 truncate">{subtext}</span>}
        </div>
      </div>
    </div>
  );
};
