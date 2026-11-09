import React, { useState } from 'react';
import { useEmergency } from '../../context/EmergencyContext';
import { DataTable } from '../../components/common/DataTable';
import { PriorityBadge, StatusBadge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { Clock, Eye, MapPin, Building2, Activity } from 'lucide-react';

export const ReporterHistory = () => {
  const { emergencies, ambulances, hospitals } = useEmergency();
  const [selectedCase, setSelectedCase] = useState(null);

  const columns = [
    {
      header: 'Incident ID',
      accessor: 'id',
      sortable: true,
      render: (row) => <span className="font-bold text-white font-mono">#{row.id}</span>,
    },
    {
      header: 'Category & Priority',
      accessor: 'emergencyType',
      render: (row) => (
        <div className="space-y-1">
          <div className="font-semibold text-white">{row.emergencyType}</div>
          <PriorityBadge priority={row.priority} label={row.priorityLabel} />
        </div>
      ),
    },
    {
      header: 'Pickup Address',
      accessor: 'address',
      render: (row) => (
        <div className="truncate max-w-[200px] text-slate-300">
          {row.pickupLocation.address}
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      sortable: true,
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      header: 'Reported',
      accessor: 'reportedAt',
      render: (row) => <span className="text-slate-400">{row.reportedAt}</span>,
    },
    {
      header: 'Actions',
      render: (row) => (
        <button
          onClick={() => setSelectedCase(row)}
          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition-colors"
          title="View Incident Record"
        >
          <Eye className="w-4 h-4 text-sky-400" />
        </button>
      ),
    },
  ];

  const filters = [
    {
      label: 'Priority',
      key: 'priority',
      options: [
        { label: 'P1 Critical', value: 'P1' },
        { label: 'P2 Urgent', value: 'P2' },
        { label: 'P3 Moderate', value: 'P3' },
        { label: 'P4 Routine', value: 'P4' },
      ],
    },
    {
      label: 'Status',
      key: 'status',
      options: [
        { label: 'En Route', value: 'EN_ROUTE' },
        { label: 'Transporting', value: 'TRANSPORTING' },
        { label: 'Resolved', value: 'RESOLVED' },
        { label: 'Cancelled', value: 'CANCELLED' },
      ],
    },
  ];

  const assignedAmb = ambulances.find((a) => a.id === selectedCase?.assignedAmbulanceId);
  const assignedHosp = hospitals.find((h) => h.id === selectedCase?.assignedHospitalId);

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-slate-800">
        <h1 className="text-2xl font-black text-white tracking-tight">Emergency History & Archives</h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Complete ledger of past and active emergency calls reported by this citizen account
        </p>
      </div>

      <div className="glass-panel p-6 rounded-2xl border border-slate-800">
        <DataTable
          columns={columns}
          data={emergencies}
          searchPlaceholder="Search by case ID or address..."
          searchKeys={['id', 'emergencyType', 'notes']}
          filters={filters}
          pageSize={6}
        />
      </div>

      {/* Detail Modal */}
      {selectedCase && (
        <Modal
          isOpen={!!selectedCase}
          onClose={() => setSelectedCase(null)}
          title={`Emergency Record #${selectedCase.id}`}
        >
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <PriorityBadge priority={selectedCase.priority} label={selectedCase.priorityLabel} />
              <StatusBadge status={selectedCase.status} />
            </div>

            <div className="space-y-1">
              <div className="text-slate-400">Patient Identifier:</div>
              <div className="font-bold text-white text-sm">{selectedCase.patientName}</div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
              <div className="text-[11px] font-bold text-slate-400 uppercase">Pickup Location</div>
              <div className="text-slate-200">{selectedCase.pickupLocation.address}</div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <div className="text-[10px] text-slate-500 uppercase font-bold">Assigned Unit</div>
                <div className="font-bold text-white mt-0.5">
                  {assignedAmb?.vehicleNumber || 'Unassigned'}
                </div>
                <div className="text-slate-400 text-[11px]">{assignedAmb?.driverName}</div>
              </div>

              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <div className="text-[10px] text-slate-500 uppercase font-bold">Destination Hospital</div>
                <div className="font-bold text-white mt-0.5 truncate">{assignedHosp?.name}</div>
                <div className="text-slate-400 text-[11px]">{assignedHosp?.traumaLevel}</div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
              <div className="text-[11px] font-bold text-slate-400 uppercase">Recorded Vitals</div>
              <div className="flex flex-wrap gap-3 text-slate-300 pt-1">
                <span>AVPU: <strong className="text-white">{selectedCase.vitals.consciousness}</strong></span>
                <span>Heart Rate: <strong className="text-white">{selectedCase.vitals.heartRate} bpm</strong></span>
                <span>SpO2: <strong className="text-white">{selectedCase.vitals.spO2}%</strong></span>
                <span>BP: <strong className="text-white">{selectedCase.vitals.bloodPressure}</strong></span>
              </div>
            </div>

            <div className="text-slate-400 pt-2 border-t border-slate-800">
              Notes: <span className="text-slate-300">{selectedCase.notes}</span>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
