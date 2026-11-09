import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useEmergency } from '../../context/EmergencyContext';
import { useAuth } from '../../context/AuthContext';
import { LeafletMap } from '../../components/common/LeafletMap';
import { PriorityBadge, TierBadge } from '../../components/common/Badge';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { EmptyState } from '../../components/common/EmptyState';
import {
  Navigation,
  Phone,
  Building2,
  MapPin,
  CheckCircle,
  Clock,
  Send,
  ShieldCheck,
  AlertCircle,
  ArrowRight,
  HeartPulse,
} from 'lucide-react';

export const DriverActiveTrip = () => {
  const { currentUser } = useAuth();
  const {
    ambulances,
    emergencies,
    hospitals,
    advanceTripStage,
  } = useEmergency();

  const [isCompleteConfirmOpen, setIsCompleteConfirmOpen] = useState(false);

  const myAmbulance =
    ambulances.find((a) => a.driverId === currentUser?.id || a.driverName === currentUser?.fullName) ||
    ambulances[0];

  const activeEmergency = emergencies.find(
    (e) => e.assignedAmbulanceId === myAmbulance.id && e.status !== 'RESOLVED'
  );

  const destinationHospital = hospitals.find((h) => h.id === activeEmergency?.assignedHospitalId);

  // 6-Phase Trip Workflow
  const tripWorkflowStages = [
    { stage: 'ACCEPTED', label: '1. Accepted', actionLabel: 'Mark On the Way', next: 'ON_THE_WAY' },
    { stage: 'ON_THE_WAY', label: '2. On the Way', actionLabel: 'Mark Arrived at Pickup', next: 'ARRIVED_PICKUP' },
    { stage: 'ARRIVED_PICKUP', label: '3. Arrived Pickup', actionLabel: 'Mark Patient Onboard', next: 'PATIENT_ONBOARD' },
    { stage: 'PATIENT_ONBOARD', label: '4. Patient Onboard', actionLabel: 'Mark Hospital Reached', next: 'HOSPITAL_REACHED' },
    { stage: 'HOSPITAL_REACHED', label: '5. Hospital Reached', actionLabel: 'Complete Handover', next: 'COMPLETED' },
    { stage: 'COMPLETED', label: '6. Completed', actionLabel: 'Done', next: null },
  ];

  const currentStageIndex = tripWorkflowStages.findIndex(
    (s) => s.stage === (activeEmergency?.tripStage || 'ACCEPTED')
  );

  const currentWorkflowStep = tripWorkflowStages[currentStageIndex] || tripWorkflowStages[0];

  const handleStepTransition = () => {
    if (currentWorkflowStep.next === 'COMPLETED') {
      setIsCompleteConfirmOpen(true);
    } else if (currentWorkflowStep.next && activeEmergency) {
      advanceTripStage(activeEmergency.id, currentWorkflowStep.next);
    }
  };

  const handleFinalCompletion = () => {
    if (activeEmergency) {
      advanceTripStage(activeEmergency.id, 'COMPLETED');
    }
  };

  const routeCoords =
    myAmbulance && activeEmergency
      ? [
          [myAmbulance.lat, myAmbulance.lng],
          [activeEmergency.pickupLocation.lat, activeEmergency.pickupLocation.lng],
          destinationHospital ? [destinationHospital.lat, destinationHospital.lng] : null,
        ].filter(Boolean)
      : null;

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-white tracking-tight">Active Trip Workflow</h1>
            <TierBadge tier={myAmbulance.type} />
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Unit <strong className="text-white">{myAmbulance.vehicleNumber}</strong> • Paramedic Navigation Console
          </p>
        </div>

        {activeEmergency && (
          <span className="px-3 py-1.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-mono font-bold animate-pulse">
            Active Mission #{activeEmergency.id}
          </span>
        )}
      </div>

      {activeEmergency ? (
        <div className="space-y-6">
          {/* Trip Progress Bar (6 Steps) */}
          <div className="glass-panel p-4 rounded-2xl border border-slate-800 overflow-x-auto">
            <div className="flex items-center justify-between min-w-[600px] gap-2">
              {tripWorkflowStages.map((step, idx) => {
                const isPassed = idx < currentStageIndex;
                const isCurrent = idx === currentStageIndex;

                return (
                  <div key={step.stage} className="flex-1 text-center relative">
                    <div
                      className={`h-2 rounded-full mb-2 transition-all ${
                        isCurrent
                          ? 'bg-rose-500 shadow-lg shadow-rose-500/50'
                          : isPassed
                          ? 'bg-emerald-500'
                          : 'bg-slate-800'
                      }`}
                    />
                    <span
                      className={`text-[11px] block font-semibold ${
                        isCurrent ? 'text-white font-bold' : isPassed ? 'text-emerald-400' : 'text-slate-500'
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Controls & Patient Card */}
            <div className="space-y-4">
              {/* Tactical Progression Action */}
              <div className="glass-panel p-5 rounded-2xl border border-rose-500/30 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Next Required Action:
                  </span>
                  <PriorityBadge priority={activeEmergency.priority} label={activeEmergency.priorityLabel} />
                </div>

                {currentWorkflowStep.next ? (
                  <button
                    onClick={handleStepTransition}
                    className="w-full py-4 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white font-black text-sm shadow-xl shadow-rose-600/30 flex items-center justify-center gap-2 transform active:scale-95 transition-all"
                  >
                    <span>{currentWorkflowStep.actionLabel}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <div className="p-3 text-center rounded-xl bg-emerald-500/20 text-emerald-300 font-bold text-xs">
                    Trip Successfully Completed
                  </div>
                )}
              </div>

              {/* Patient Vitals & Contact */}
              <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">Patient Vitals</h3>
                  <span className="text-rose-400 font-bold text-xs">{activeEmergency.emergencyType}</span>
                </div>

                <div className="font-bold text-white text-sm">{activeEmergency.patientName}</div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">Consciousness</span>
                    <strong className="text-white">{activeEmergency.vitals.consciousness}</strong>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">Pulse Rate</span>
                    <strong className="text-rose-400">{activeEmergency.vitals.heartRate} bpm</strong>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">Oxygen (SpO2)</span>
                    <strong className="text-emerald-400">{activeEmergency.vitals.spO2}%</strong>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">Blood Pressure</span>
                    <strong className="text-white">{activeEmergency.vitals.bloodPressure}</strong>
                  </div>
                </div>

                {activeEmergency.reporterPhone && (
                  <a
                    href={`tel:${activeEmergency.reporterPhone}`}
                    className="w-full mt-2 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5 text-emerald-400" /> Call Caller ({activeEmergency.reporterPhone})
                  </a>
                )}
              </div>

              {/* Destination Hospital Summary */}
              {destinationHospital && (
                <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-1.5">
                  <div className="text-[10px] uppercase font-bold text-sky-400 flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5" /> Destination Hospital
                  </div>
                  <div className="font-bold text-xs text-white">{destinationHospital.name}</div>
                  <div className="text-[11px] text-slate-400">{destinationHospital.address}</div>
                  <div className="text-[11px] text-sky-300 pt-1">
                    Emergency Line: {destinationHospital.emergencyContact}
                  </div>
                </div>
              )}
            </div>

            {/* Right Map Navigation View (2 Cols) */}
            <div className="lg:col-span-2">
              <div className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white flex items-center gap-2">
                    <Navigation className="w-4 h-4 text-rose-500 animate-pulse" />
                    Turn-By-Turn Route Navigation
                  </span>
                  <span className="text-emerald-400 font-mono font-bold">
                    ETA: ~{activeEmergency.etaMinutes} mins
                  </span>
                </div>

                <LeafletMap
                  center={[myAmbulance.lat, myAmbulance.lng]}
                  zoom={14}
                  ambulances={[myAmbulance]}
                  emergencies={[activeEmergency]}
                  hospitals={destinationHospital ? [destinationHospital] : hospitals}
                  routeCoordinates={routeCoords}
                  height="520px"
                />
              </div>
            </div>
          </div>
        </div>
      ) : (
        <EmptyState
          icon={Navigation}
          title="No Active Trip in Progress"
          description="You are currently available and on standby. Check the requests queue to accept an incoming emergency dispatch."
          actionText="View Incoming Requests"
          onAction={() => window.location.href = '/driver/requests'}
        />
      )}

      {/* Handover Confirmation Modal */}
      <ConfirmDialog
        isOpen={isCompleteConfirmOpen}
        onClose={() => setIsCompleteConfirmOpen(false)}
        onConfirm={handleFinalCompletion}
        title="Complete Patient Handover?"
        message="This will record patient handover to the emergency trauma bay, release the ambulance to AVAILABLE status, and resolve the mission."
        confirmText="Confirm ER Handover"
        type="info"
      />
    </div>
  );
};
