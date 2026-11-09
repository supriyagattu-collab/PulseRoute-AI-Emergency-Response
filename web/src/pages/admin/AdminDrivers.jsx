import React, { useState } from 'react';
import { useEmergency } from '../../context/EmergencyContext';
import { DataTable } from '../../components/common/DataTable';
import { Modal } from '../../components/common/Modal';
import { User, Ambulance, Award, Star, Phone, CheckCircle2, Plus } from 'lucide-react';

export const AdminDrivers = () => {
  const { drivers } = useEmergency();
  const [selectedDriver, setSelectedDriver] = useState(null);

  const columns = [
    {
      header: 'Paramedic Name',
      accessor: 'fullName',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-white border border-slate-700">
            {row.fullName.charAt(0)}
          </div>
          <div>
            <span className="font-bold text-white block">{row.fullName}</span>
            <span className="text-[10px] text-slate-400">{row.email}</span>
          </div>
        </div>
      ),
    },
    {
      header: 'Contact Phone',
      accessor: 'phone',
      render: (row) => <span className="text-slate-300 font-mono text-xs">{row.phone}</span>,
    },
    {
      header: 'Assigned Ambulance',
      accessor: 'assignedAmbulanceNumber',
      render: (row) => (
        <span className="font-bold text-white font-mono bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
          {row.assignedAmbulanceNumber}
        </span>
      ),
    },
    {
      header: 'Duty Status',
      accessor: 'status',
      sortable: true,
      render: (row) => {
        const styles = {
          ON_DUTY: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
          BUSY: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
          OFF_DUTY: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
        };
        return (
          <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${styles[row.status] || styles.OFF_DUTY}`}>
            {row.status.replace('_', ' ')}
          </span>
        );
      },
    },
    {
      header: 'Trips Completed',
      accessor: 'completedTrips',
      sortable: true,
      render: (row) => <span className="font-bold text-slate-200">{row.completedTrips} runs</span>,
    },
    {
      header: 'Rating',
      accessor: 'rating',
      sortable: true,
      render: (row) => (
        <span className="text-amber-400 font-bold flex items-center gap-1">
          <Star className="w-3.5 h-3.5 fill-amber-400" /> {row.rating}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-slate-800">
        <h1 className="text-2xl font-black text-white tracking-tight">Paramedic Driver Registry</h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Certified emergency vehicle operators, duty rosters, and completed trip audits
        </p>
      </div>

      <div className="glass-panel p-6 rounded-2xl border border-slate-800">
        <DataTable
          columns={columns}
          data={drivers}
          searchPlaceholder="Search drivers by name, phone or vehicle..."
          searchKeys={['fullName', 'phone', 'assignedAmbulanceNumber']}
          pageSize={6}
        />
      </div>
    </div>
  );
};
