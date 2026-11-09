import React from 'react';
import { useEmergency } from '../../context/EmergencyContext';
import { useAuth } from '../../context/AuthContext';
import { DataTable } from '../../components/common/DataTable';
import { PriorityBadge, StatusBadge } from '../../components/common/Badge';
import { CheckCircle2, Clock, MapPin } from 'lucide-react';

export const DriverHistory = () => {
  const { currentUser } = useAuth();
  const { emergencies, ambulances } = useEmergency();

  const myAmbulance =
    ambulances.find((a) => a.driverId === currentUser?.id || a.driverName === currentUser?.fullName) ||
    ambulances[0];

  const completedTrips = emergencies.filter(
    (e) => e.assignedAmbulanceId === myAmbulance.id && e.status === 'RESOLVED'
  );

  const columns = [
    {
      header: 'Trip / Case ID',
      accessor: 'id',
      sortable: true,
      render: (row) => <span className="font-mono font-bold text-white">#{row.id}</span>,
    },
    {
      header: 'Patient & Emergency Type',
      accessor: 'patientName',
      render: (row) => (
        <div>
          <div className="font-semibold text-white">{row.patientName}</div>
          <div className="text-[11px] text-rose-400">{row.emergencyType}</div>
        </div>
      ),
    },
    {
      header: 'Priority',
      accessor: 'priority',
      render: (row) => <PriorityBadge priority={row.priority} label={row.priorityLabel} />,
    },
    {
      header: 'Pickup Address',
      accessor: 'address',
      render: (row) => (
        <span className="text-slate-300 truncate max-w-[200px] block">
          {row.pickupLocation.address}
        </span>
      ),
    },
    {
      header: 'Outcome',
      render: () => <StatusBadge status="RESOLVED" />,
    },
    {
      header: 'Date Logged',
      accessor: 'date',
      render: (row) => <span className="text-slate-400">{row.date || 'Today'}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-slate-800">
        <h1 className="text-2xl font-black text-white tracking-tight">Completed Trip Logbook</h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Historical record of emergency runs executed by Unit <strong className="text-white">{myAmbulance.vehicleNumber}</strong>
        </p>
      </div>

      <div className="glass-panel p-6 rounded-2xl border border-slate-800">
        <DataTable
          columns={columns}
          data={completedTrips}
          searchPlaceholder="Search trip log..."
          searchKeys={['id', 'patientName', 'emergencyType']}
          pageSize={5}
        />
      </div>
    </div>
  );
};
