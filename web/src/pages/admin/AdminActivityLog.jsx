import React from 'react';
import { useEmergency } from '../../context/EmergencyContext';
import { DataTable } from '../../components/common/DataTable';
import { FileText, Clock, User, ShieldAlert, CheckCircle2 } from 'lucide-react';

export const AdminActivityLog = () => {
  const { activityLog } = useEmergency();

  const columns = [
    {
      header: 'Timestamp',
      accessor: 'timestamp',
      render: (row) => (
        <span className="text-slate-400 font-mono text-xs flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-slate-500" /> {row.timestamp}
        </span>
      ),
    },
    {
      header: 'Action Type',
      accessor: 'actionType',
      render: (row) => {
        const badgeColors = {
          rose: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
          indigo: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
          sky: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
          emerald: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
          amber: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
          slate: 'bg-slate-800 text-slate-300 border-slate-700',
        };
        return (
          <span className={`px-2.5 py-0.5 rounded text-[11px] font-bold border font-mono ${badgeColors[row.badgeColor] || badgeColors.slate}`}>
            {row.actionType}
          </span>
        );
      },
    },
    {
      header: 'Actor / Role',
      accessor: 'actor',
      render: (row) => (
        <span className="font-semibold text-white flex items-center gap-1.5">
          <User className="w-3 h-3 text-slate-400" /> {row.actor}
        </span>
      ),
    },
    {
      header: 'Audit Event Description',
      accessor: 'details',
      render: (row) => <span className="text-slate-200">{row.details}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-slate-800">
        <h1 className="text-2xl font-black text-white tracking-tight">System Audit & Activity Log</h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Immutable chronologic ledger of dispatch allocations, telemetry state changes, and ER bed adjustments
        </p>
      </div>

      <div className="glass-panel p-6 rounded-2xl border border-slate-800">
        <DataTable
          columns={columns}
          data={activityLog}
          searchPlaceholder="Search audit events by action or actor..."
          searchKeys={['actionType', 'actor', 'details']}
          pageSize={8}
        />
      </div>
    </div>
  );
};
