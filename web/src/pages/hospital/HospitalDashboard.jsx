import React, { useState } from 'react';
import { useEmergency } from '../../context/EmergencyContext';
import { useAuth } from '../../context/AuthContext';
import { PriorityBadge, StatusBadge, TierBadge } from '../../components/common/Badge';
import { LeafletMap } from '../../components/common/LeafletMap';
import {
  Building2,
  Bed,
  HeartPulse,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Minus,
  Ambulance,
  Activity,
  ShieldCheck,
  Stethoscope,
} from 'lucide-react';

export const HospitalDashboard = () => {
  const { currentUser } = useAuth();
  const {
    hospitals,
    emergencies,
    ambulances,
    updateHospitalBeds,
    advanceTripStage,
  } = useEmergency();

  // Find this user's assigned hospital (or default to Apollo)
  const myHospital =
    hospitals.find((h) => h.id === currentUser?.hospitalId) || hospitals[0];

  // Inbound emergencies routed to this hospital
  const inboundEmergencies = emergencies.filter(
    (e) => e.assignedHospitalId === myHospital.id && e.status !== 'RESOLVED'
  );

  // Resolved / admitted cases
  const recentAdmissions = emergencies.filter(
    (e) => e.assignedHospitalId === myHospital.id && e.status === 'RESOLVED'
  );

  const icuOccupancyPct = Math.round(
    ((myHospital.totalIcuBeds - myHospital.availableIcuBeds) / myHospital.totalIcuBeds) * 100
  );
  const genOccupancyPct = Math.round(
    ((myHospital.totalGeneralBeds - myHospital.availableGeneralBeds) / myHospital.totalGeneralBeds) * 100
  );

  const handleBedChange = (type, delta) => {
    updateHospitalBeds(myHospital.id, type, delta);
  };

  const handleAdmitInbound = (emergencyId) => {
    advanceTripStage(emergencyId, 'COMPLETED');
    // Decrement available ICU or General bed automatically
    handleBedChange('icu', -1);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-white tracking-tight">Emergency Trauma Command</h1>
            <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30">
              {myHospital.traumaLevel}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Facility: <span className="text-white font-bold">{myHospital.name}</span> • Duty Officer:{' '}
            <span className="text-white font-medium">{currentUser?.fullName}</span>
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Cath Lab: Online
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Trauma Bay: Standby
          </span>
        </div>
      </div>

      {/* Live Bed Capacity Controller */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* ICU Beds Card */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
                <HeartPulse className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">ICU Critical Care Beds</h3>
                <p className="text-[11px] text-slate-400">Ventilator & Cath Lab Equipped</p>
              </div>
            </div>
            <span
              className={`text-xs font-bold px-2 py-0.5 rounded ${
                myHospital.availableIcuBeds <= 2
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              }`}
            >
              {myHospital.availableIcuBeds <= 2 ? 'CRITICAL CAPACITY' : 'OPERATIONAL'}
            </span>
          </div>

          <div className="flex items-end justify-between py-2 border-y border-slate-800/80">
            <div>
              <div className="text-3xl font-black text-white">{myHospital.availableIcuBeds}</div>
              <div className="text-xs text-slate-400 mt-0.5">
                Available of <span className="text-white font-semibold">{myHospital.totalIcuBeds}</span> Total Beds
              </div>
            </div>

            {/* Real-time Adjuster */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleBedChange('icu', -1)}
                disabled={myHospital.availableIcuBeds <= 0}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-rose-400 font-bold text-xs border border-slate-700 disabled:opacity-40 transition-colors"
                title="Admit patient (decrease available)"
              >
                <Minus className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleBedChange('icu', 1)}
                disabled={myHospital.availableIcuBeds >= myHospital.totalIcuBeds}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold text-xs border border-slate-700 disabled:opacity-40 transition-colors"
                title="Discharge patient (increase available)"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Occupancy bar */}
          <div>
            <div className="flex justify-between text-[11px] text-slate-400 mb-1">
              <span>Occupancy Rate</span>
              <span className="font-semibold text-white">{icuOccupancyPct}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  icuOccupancyPct > 80 ? 'bg-rose-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${icuOccupancyPct}%` }}
              />
            </div>
          </div>
        </div>

        {/* General Emergency Beds Card */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
                <Bed className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">General Emergency Beds</h3>
                <p className="text-[11px] text-slate-400">Acute Observation & Triage</p>
              </div>
            </div>
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-sky-500/20 text-sky-400 border border-sky-500/30">
              NORMAL
            </span>
          </div>

          <div className="flex items-end justify-between py-2 border-y border-slate-800/80">
            <div>
              <div className="text-3xl font-black text-white">{myHospital.availableGeneralBeds}</div>
              <div className="text-xs text-slate-400 mt-0.5">
                Available of <span className="text-white font-semibold">{myHospital.totalGeneralBeds}</span> Total Beds
              </div>
            </div>

            {/* Real-time Adjuster */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleBedChange('general', -1)}
                disabled={myHospital.availableGeneralBeds <= 0}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-rose-400 font-bold text-xs border border-slate-700 disabled:opacity-40 transition-colors"
                title="Admit patient"
              >
                <Minus className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleBedChange('general', 1)}
                disabled={myHospital.availableGeneralBeds >= myHospital.totalGeneralBeds}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold text-xs border border-slate-700 disabled:opacity-40 transition-colors"
                title="Discharge patient"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Occupancy bar */}
          <div>
            <div className="flex justify-between text-[11px] text-slate-400 mb-1">
              <span>Occupancy Rate</span>
              <span className="font-semibold text-white">{genOccupancyPct}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-sky-500 transition-all duration-500"
                style={{ width: `${genOccupancyPct}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Inbound Ambulances Feed */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Ambulance className="w-5 h-5 text-rose-500 animate-pulse" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Inbound Ambulance Stream ({inboundEmergencies.length})
            </h3>
          </div>
          <span className="text-xs text-slate-400">Real-time telematics via WebSocket</span>
        </div>

        {inboundEmergencies.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {inboundEmergencies.map((emg) => {
              const amb = ambulances.find((a) => a.id === emg.assignedAmbulanceId);
              return (
                <div
                  key={emg.id}
                  className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 space-y-3 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <PriorityBadge priority={emg.priority} label={emg.priorityLabel} />
                      <StatusBadge status={emg.status} />
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-black text-rose-400 flex items-center gap-1 justify-end">
                        <Clock className="w-3.5 h-3.5" /> ETA: ~{emg.etaMinutes} mins
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-white">{emg.patientName}</h4>
                    <p className="text-xs text-rose-400 font-semibold">{emg.emergencyType} • {emg.notes}</p>
                  </div>

                  {/* Vitals Bar */}
                  <div className="grid grid-cols-3 gap-2 p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px]">
                    <div>
                      <span className="text-slate-500 block">AVPU:</span>
                      <span className="font-bold text-white">{emg.vitals.consciousness}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Pulse:</span>
                      <span className="font-bold text-rose-400">{emg.vitals.heartRate} bpm</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">SpO2:</span>
                      <span className="font-bold text-emerald-400">{emg.vitals.spO2}%</span>
                    </div>
                  </div>

                  {/* Inbound vehicle & action */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
                    <span className="text-slate-400">
                      Vehicle: <span className="text-white font-medium">{amb?.vehicleNumber || 'En Route'}</span>
                    </span>

                    <button
                      onClick={() => handleAdmitInbound(emg.id)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-md shadow-emerald-600/30"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Confirm ER Admission
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center text-slate-400 text-xs bg-slate-900/50 rounded-xl">
            No active ambulances currently inbound to this facility.
          </div>
        )}
      </div>

      {/* Hospital Map View */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
            Hospital Geolocation & Perimeter
          </h3>
          <span className="text-xs text-slate-400">{myHospital.address}</span>
        </div>
        <LeafletMap
          center={[myHospital.lat, myHospital.lng]}
          zoom={13}
          hospitals={[myHospital]}
          ambulances={ambulances.filter((a) => a.status !== 'MAINTENANCE')}
          emergencies={inboundEmergencies}
          height="380px"
        />
      </div>
    </div>
  );
};
