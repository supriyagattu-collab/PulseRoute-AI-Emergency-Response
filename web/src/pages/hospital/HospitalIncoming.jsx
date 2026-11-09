import React, { useState } from 'react';
import { useEmergency } from '../../context/EmergencyContext';
import { useAuth } from '../../context/AuthContext';
import { PriorityBadge, StatusBadge, TierBadge } from '../../components/common/Badge';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { EmptyState } from '../../components/common/EmptyState';
import { Ambulance, Clock, CheckCircle2, HeartPulse, Building2, User, Activity } from 'lucide-react';

export const HospitalIncoming = () => {
  const { currentUser } = useAuth();
  const {
    hospitals,
    emergencies,
    ambulances,
    advanceTripStage,
    updateHospitalBeds,
  } = useEmergency();

  const [confirmEmergency, setConfirmEmergency] = useState(null);

  const myHospital =
    hospitals.find((h) => h.id === currentUser?.hospitalId) || hospitals[0];

  const inboundEmergencies = emergencies.filter(
    (e) => e.assignedHospitalId === myHospital.id && e.status !== 'RESOLVED' && e.status !== 'CANCELLED'
  );

  const handleConfirmAdmission = () => {
    if (confirmEmergency) {
      // Advance trip stage to COMPLETED & decrement ICU bed
      advanceTripStage(confirmEmergency.id, 'COMPLETED');
      updateHospitalBeds(myHospital.id, 'icu', -1);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Inbound Ambulance Pipeline</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Active patient transport stream incoming to <strong className="text-white">{myHospital.name}</strong>
          </p>
        </div>

        <span className="px-3 py-1.5 rounded-xl bg-sky-500/15 border border-sky-500/30 text-sky-300 text-xs font-mono font-bold">
          Inbound: {inboundEmergencies.length} Units
        </span>
      </div>

      {inboundEmergencies.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {inboundEmergencies.map((emg) => {
            const amb = ambulances.find((a) => a.id === emg.assignedAmbulanceId);
            return (
              <div
                key={emg.id}
                className="glass-panel p-5 rounded-2xl border border-slate-800 hover:border-slate-700 space-y-4 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-white">#{emg.id}</span>
                    <PriorityBadge priority={emg.priority} label={emg.priorityLabel} />
                    <StatusBadge status={emg.status} />
                  </div>
                  <div className="text-xs font-black text-rose-400 flex items-center gap-1 font-mono">
                    <Clock className="w-3.5 h-3.5" /> ETA: ~{emg.etaMinutes} mins
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-bold text-white">{emg.patientName}</h3>
                  <div className="text-xs font-semibold text-rose-400 mt-0.5">
                    {emg.emergencyType} • {emg.notes}
                  </div>
                </div>

                {/* Pre-Arrival Vitals */}
                <div className="grid grid-cols-4 gap-2 p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 block">AVPU</span>
                    <strong className="text-white">{emg.vitals.consciousness}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Pulse</span>
                    <strong className="text-rose-400">{emg.vitals.heartRate} bpm</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">SpO2</span>
                    <strong className="text-emerald-400">{emg.vitals.spO2}%</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Blood Pressure</span>
                    <strong className="text-white">{emg.vitals.bloodPressure}</strong>
                  </div>
                </div>

                {/* Inbound vehicle & Action */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                  <div className="flex items-center gap-2 text-xs">
                    <Ambulance className="w-4 h-4 text-sky-400" />
                    <span className="text-slate-300 font-bold">{amb?.vehicleNumber || 'Dispatching'}</span>
                    <TierBadge tier={amb?.type || 'ALS'} />
                  </div>

                  <button
                    onClick={() => setConfirmEmergency(emg)}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/30 transition-all"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Confirm ER Admission
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={Ambulance}
          title="No Ambulances Inbound"
          description="There are currently no inbound patient transports directed to this trauma facility."
        />
      )}

      {/* Confirmation Modal */}
      <ConfirmDialog
        isOpen={!!confirmEmergency}
        onClose={() => setConfirmEmergency(null)}
        onConfirm={handleConfirmAdmission}
        title="Confirm Emergency Room Admission?"
        message={`Confirming arrival for patient ${confirmEmergency?.patientName}. This will record ER admission timestamp, allocate an ICU/General bed, and release the ambulance.`}
        confirmText="Confirm ER Admission"
        type="info"
      />
    </div>
  );
};
