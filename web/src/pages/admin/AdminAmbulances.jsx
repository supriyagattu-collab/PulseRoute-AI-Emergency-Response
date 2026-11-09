import React, { useState } from 'react';
import { useEmergency } from '../../context/EmergencyContext';
import { DataTable } from '../../components/common/DataTable';
import { StatusBadge, TierBadge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { Ambulance, Plus, Power, Wrench, Shield, CheckCircle2 } from 'lucide-react';

export const AdminAmbulances = () => {
  const { ambulances, addAmbulance, toggleAmbulanceMaintenance } = useEmergency();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [type, setType] = useState('ALS');
  const [driverName, setDriverName] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [baseStation, setBaseStation] = useState('Central EMS Station');

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (vehicleNumber && driverName) {
      addAmbulance({
        vehicleNumber,
        type,
        driverName,
        driverPhone: driverPhone || '+91 98000 00000',
        baseStation,
      });
      setIsAddModalOpen(false);
      setVehicleNumber('');
      setDriverName('');
    }
  };

  const columns = [
    {
      header: 'Vehicle Plate',
      accessor: 'vehicleNumber',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-2">
          <span className="font-mono font-bold text-white">{row.vehicleNumber}</span>
          {!row.isActive && (
            <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">
              Deactivated
            </span>
          )}
        </div>
      ),
    },
    {
      header: 'Tier',
      accessor: 'type',
      sortable: true,
      render: (row) => <TierBadge tier={row.type} />,
    },
    {
      header: 'Paramedic / Driver',
      accessor: 'driverName',
      render: (row) => (
        <div>
          <span className="font-semibold text-white">{row.driverName}</span>
          <span className="text-[10px] text-slate-400 block">{row.driverPhone}</span>
        </div>
      ),
    },
    {
      header: 'Base Depot',
      accessor: 'baseStation',
      render: (row) => <span className="text-slate-300 truncate max-w-[150px] block">{row.baseStation}</span>,
    },
    {
      header: 'Status',
      accessor: 'status',
      sortable: true,
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      header: 'O2 / Battery',
      accessor: 'batteryOxygenPct',
      render: (row) => (
        <span className="font-mono text-emerald-400 font-bold">{row.batteryOxygenPct}%</span>
      ),
    },
    {
      header: 'Actions',
      render: (row) => (
        <button
          onClick={() => toggleAmbulanceMaintenance(row.id)}
          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
          title={row.status === 'MAINTENANCE' ? 'Restore to Active Fleet' : 'Mark for Maintenance'}
        >
          <Wrench className="w-4 h-4 text-amber-400" />
        </button>
      ),
    },
  ];

  const filters = [
    {
      label: 'Tier',
      key: 'type',
      options: [
        { label: 'ALS (Advanced)', value: 'ALS' },
        { label: 'BLS (Basic)', value: 'BLS' },
      ],
    },
    {
      label: 'Status',
      key: 'status',
      options: [
        { label: 'Available', value: 'AVAILABLE' },
        { label: 'Dispatched', value: 'DISPATCHED' },
        { label: 'En Route', value: 'EN_ROUTE' },
        { label: 'Maintenance', value: 'MAINTENANCE' },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Ambulance Fleet Management</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Register new emergency transport units, maintain equipment tiers, and monitor telemetry readiness
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/30 flex items-center gap-2 transition-all"
        >
          <Plus className="w-4 h-4" /> Add Ambulance Unit
        </button>
      </div>

      <div className="glass-panel p-6 rounded-2xl border border-slate-800">
        <DataTable
          columns={columns}
          data={ambulances}
          searchPlaceholder="Search by vehicle number, driver or station..."
          searchKeys={['vehicleNumber', 'driverName', 'baseStation']}
          filters={filters}
          pageSize={6}
        />
      </div>

      {/* Add Ambulance Modal */}
      {isAddModalOpen && (
        <Modal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title="Register New Ambulance to Dispatch Fleet"
        >
          <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  License Plate / ID
                </label>
                <input
                  type="text"
                  value={vehicleNumber}
                  onChange={(e) => setVehicleNumber(e.target.value)}
                  placeholder="KA-01-EA-2099"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Equipment Tier
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs"
                >
                  <option value="ALS">ALS (Advanced Life Support)</option>
                  <option value="BLS">BLS (Basic Life Support)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Paramedic / Driver Name
                </label>
                <input
                  type="text"
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
                  placeholder="Ramesh Rao"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Driver Contact Phone
                </label>
                <input
                  type="tel"
                  value={driverPhone}
                  onChange={(e) => setDriverPhone(e.target.value)}
                  placeholder="+91 98000 12345"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Base EMS Station
              </label>
              <input
                type="text"
                value={baseStation}
                onChange={(e) => setBaseStation(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs"
              >
                Add to Fleet
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
