import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useEmergency } from '../../context/EmergencyContext';
import { LeafletMap } from '../../components/common/LeafletMap';
import { PriorityBadge, StatusBadge, TierBadge } from '../../components/common/Badge';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import {
  Navigation,
  PhoneCall,
  Clock,
  Building2,
  AlertTriangle,
  RotateCw,
  XCircle,
  MapPin,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react';

export const ReporterTracking = () => {
  const {
    activeEmergency,
    ambulances,
    hospitals,
    cancelEmergency,
    advanceSimulationStep,
  } = useEmergency();

  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false);

  const assignedAmbulance = ambulances.find((a) => a.id === activeEmergency?.assignedAmbulanceId);
  const assignedHospital = hospitals.find((h) => h.id === activeEmergency?.assignedHospitalId);

  const routeCoords =
    assignedAmbulance && activeEmergency
      ? [
          [assignedAmbulance.lat, assignedAmbulance.lng],
          [activeEmergency.pickupLocation.lat, activeEmergency.pickupLocation.lng],
          assignedHospital ? [assignedHospital.lat, assignedHospital.lng] : null,
        ].filter(Boolean)
      : null;

  // Timeline stages
  const timelineStages = [
    { key: 'REPORTED', label: 'Reported' },
    { key: 'ASSIGNED', label: 'Unit Assigned' },
    { key: 'EN_ROUTE', label: 'En Route' },
    { key: 'ON_SCENE', label: 'On Scene' },
    { key: 'TRANSPORTING', label: 'Transporting' },
    { key: 'RESOLVED', label: 'Admitted / Handover' },
  ];

  const currentStageIndex = timelineStages.findIndex((s) => s.key === activeEmergency?.status);

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-white tracking-tight">Live Ambulance Tracking</h1>
            <StatusBadge status={activeEmergency?.status || 'REPORTED'} />
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Emergency Case <strong className="text-white">#{activeEmergency?.id}</strong> • Real-time spatial tracking
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={advanceSimulationStep}
            className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <RotateCw className="w-3.5 h-3.5 text-sky-400" /> Refresh Telemetry
          </button>
          {activeEmergency && activeEmergency.status !== 'RESOLVED' && (
            <button
              onClick={() => setIsCancelConfirmOpen(true)}
              className="px-3 py-2 rounded-xl bg-rose-600/20 border border-rose-500/30 text-rose-300 hover:bg-rose-600 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <XCircle className="w-3.5 h-3.5" /> Cancel Request
            </button>
          )}
        </div>
      </div>

      {activeEmergency ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Tracking Details Left */}
          <div className="space-y-4">
            {/* ETA Countdown Card */}
            <div className="glass-panel p-6 rounded-2xl border border-rose-500/30 text-center space-y-2">
              <span className="text-[11px] font-bold text-rose-400 uppercase tracking-widest flex items-center justify-center gap-1.5">
                <Clock className="w-4 h-4 animate-spin" /> Simulated Transit Arrival
              </span>
              <div className="text-4xl sm:text-5xl font-black text-white">
                {activeEmergency.etaMinutes > 0 ? `~${activeEmergency.etaMinutes} min` : 'ARRIVED'}
              </div>
              <div className="text-xs text-slate-400">
                Speed: {assignedAmbulance?.speedKmh || 45} km/h • OpenStreetMap Route
              </div>
            </div>

            {/* Assigned Ambulance & Paramedic Profile */}
            {assignedAmbulance ? (
              <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Navigation className="w-4 h-4 text-rose-400" />
                    <span className="font-bold text-sm text-white">{assignedAmbulance.vehicleNumber}</span>
                  </div>
                  <TierBadge tier={assignedAmbulance.type} />
                </div>

                <div className="text-xs text-slate-300 space-y-1">
                  <div>
                    Driver: <span className="text-white font-medium">{assignedAmbulance.driverName}</span>
                  </div>
                  <div>
                    Base Hub: <span className="text-slate-400">{assignedAmbulance.baseStation}</span>
                  </div>
                  <div>
                    Medical Oxygen: <span className="text-emerald-400 font-bold">{assignedAmbulance.batteryOxygenPct}%</span>
                  </div>
                </div>

                <a
                  href={`tel:${assignedAmbulance.driverPhone}`}
                  className="w-full mt-2 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors"
                >
                  <PhoneCall className="w-4 h-4 text-emerald-400" /> Call Paramedic Driver
                </a>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs">
                Searching for closest available ambulance in dispatch zone...
              </div>
            )}

            {/* Destination Hospital */}
            {assignedHospital && (
              <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-2">
                <div className="text-[10px] font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5" /> Destination Hospital
                </div>
                <div className="font-bold text-sm text-white">{assignedHospital.name}</div>
                <div className="text-xs text-slate-400">{assignedHospital.address}</div>
                <div className="text-xs text-sky-300 pt-1">
                  Available ICU Beds: <strong>{assignedHospital.availableIcuBeds}</strong> / {assignedHospital.totalIcuBeds}
                </div>
              </div>
            )}

            {/* Timeline Progress */}
            <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
              <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Emergency Status Timeline
              </div>
              <div className="space-y-3 relative pl-4 border-l-2 border-slate-800">
                {timelineStages.map((stage, idx) => {
                  const isDone = idx <= currentStageIndex;
                  const isCurrent = idx === currentStageIndex;
                  return (
                    <div key={stage.key} className="relative">
                      <span
                        className={`absolute -left-[21px] top-0.5 w-3 h-3 rounded-full border-2 ${
                          isCurrent
                            ? 'bg-rose-500 border-white ring-4 ring-rose-500/20'
                            : isDone
                            ? 'bg-emerald-500 border-slate-900'
                            : 'bg-slate-800 border-slate-700'
                        }`}
                      />
                      <div className={`text-xs ${isCurrent ? 'font-bold text-white' : isDone ? 'text-slate-300' : 'text-slate-600'}`}>
                        {stage.label}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Interactive Tracking Map Right (2 Cols) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="glass-panel p-4 rounded-2xl border border-slate-800">
              <div className="flex items-center justify-between mb-3 text-xs">
                <span className="font-bold text-white flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live GPS Route Navigation
                </span>
                <span className="text-slate-400">Simulated Telemetry Stream</span>
              </div>

              <LeafletMap
                center={[activeEmergency.pickupLocation.lat, activeEmergency.pickupLocation.lng]}
                zoom={13}
                ambulances={assignedAmbulance ? [assignedAmbulance] : ambulances}
                emergencies={[activeEmergency]}
                hospitals={assignedHospital ? [assignedHospital] : hospitals}
                routeCoordinates={routeCoords}
                height="560px"
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="glass-panel p-12 rounded-2xl text-center border border-slate-800">
          <AlertTriangle className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white">No Active Emergency In Progress</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto mb-4">
            You do not currently have an active emergency dispatch request.
          </p>
          <Link
            to="/reporter/emergency/new"
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs"
          >
            Create New Emergency
          </Link>
        </div>
      )}

      {/* Cancel Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isCancelConfirmOpen}
        onClose={() => setIsCancelConfirmOpen(false)}
        onConfirm={() => cancelEmergency(activeEmergency?.id)}
        title="Cancel Emergency Dispatch?"
        message="Are you sure you wish to cancel this emergency request? The assigned ambulance will be released back to the central fleet."
        confirmText="Yes, Cancel Request"
        type="danger"
      />
    </div>
  );
};
