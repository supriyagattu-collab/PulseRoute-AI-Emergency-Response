import React, { useState } from 'react';
import { useEmergency } from '../../context/EmergencyContext';
import { DataTable } from '../../components/common/DataTable';
import { Building2, Bed, HeartPulse, CheckCircle2 } from 'lucide-react';

export const AdminHospitals = () => {
  const { hospitals } = useEmergency();

  const columns = [
    {
      header: 'Hospital Name',
      accessor: 'name',
      sortable: true,
      render: (row) => (
        <div>
          <span className="font-bold text-white block">{row.name}</span>
          <span className="text-[11px] text-slate-400">{row.address}</span>
        </div>
      ),
    },
    {
      header: 'Trauma Certification',
      accessor: 'traumaLevel',
      render: (row) => (
        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30">
          {row.traumaLevel}
        </span>
      ),
    },
    {
      header: 'ICU Beds (Avail / Total)',
      render: (row) => (
        <div className="text-xs">
          <strong className="text-rose-400">{row.availableIcuBeds}</strong> / {row.totalIcuBeds}
        </div>
      ),
    },
    {
      header: 'General Beds (Avail / Total)',
      render: (row) => (
        <div className="text-xs">
          <strong className="text-emerald-400">{row.availableGeneralBeds}</strong> / {row.totalGeneralBeds}
        </div>
      ),
    },
    {
      header: 'Specialized Units',
      render: (row) => (
        <div className="flex flex-wrap gap-1 text-[10px]">
          {row.hasCathLab && <span className="bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded">Cath Lab</span>}
          {row.hasStrokeUnit && <span className="bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded">Stroke</span>}
          {row.hasBurnUnit && <span className="bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded">Burns</span>}
        </div>
      ),
    },
    {
      header: 'Hotline',
      accessor: 'phone',
      render: (row) => <span className="text-slate-300 font-mono text-xs">{row.phone || row.emergencyPhone || row.emergency_phone || '040-24600121'}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-slate-800">
        <h1 className="text-2xl font-black text-white tracking-tight">Hospital Network Registry</h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Emergency trauma centers connected to the PulseRoute dispatch grid with live capacity telemetry
        </p>
      </div>

      <div className="glass-panel p-6 rounded-2xl border border-slate-800">
        <DataTable
          columns={columns}
          data={hospitals}
          searchPlaceholder="Search hospital name, address, or trauma level..."
          searchKeys={['name', 'address', 'traumaLevel']}
          pageSize={6}
        />
      </div>
    </div>
  );
};
