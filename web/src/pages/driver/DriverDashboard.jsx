import React, { useState } from 'react';
import { useEmergency } from '../../context/EmergencyContext';
import { useAuth } from '../../context/AuthContext';
import { LeafletMap } from '../../components/common/LeafletMap';
import { PriorityBadge, StatusBadge, TierBadge } from '../../components/common/Badge';
import {
  Navigation,
  Phone,
  Building2,
  CheckCircle,
  AlertCircle,
  Gauge,
  Fuel,
  Compass,
  ArrowRight,
  ShieldAlert,
  Send,
  MapPin,
} from 'lucide-react';

export const DriverDashboard = () => {
  const { currentUser } = useAuth();
  const {
    ambulances,
    emergencies,
    hospitals,
    advanceTripStage,
  } = useEmergency();

  // Pick this driver's ambulance
  const myAmbulance =
    ambulances.find((a) => a.driverId === currentUser?.id || a.driverName === currentUser?.fullName) ||
    ambulances[0];

  // Find active emergency assigned to this ambulance
  const activeMission = emergencies.find(
    (e) => e.assignedAmbulanceId === myAmbulance?.id && e.status !== 'RESOLVED'
  );

  const destinationHospital = hospitals.find((h) => h.id === activeMission?.assignedHospitalId);

  const handleAdvanceMissionState = (nextState) => {
    if (activeMission) {
      advanceTripStage(activeMission.id, nextState);
    }
  };

  const routeCoords =
    myAmbulance && activeMission
      ? [
          [myAmbulance.lat || myAmbulance.latitude, myAmbulance.lng || myAmbulance.longitude],
          [
            activeMission.pickupLocation?.lat ?? activeMission.latitude ?? activeMission.lat,
            activeMission.pickupLocation?.lng ?? activeMission.longitude ?? activeMission.lng,
          ],
          destinationHospital ? [destinationHospital.lat || destinationHospital.latitude, destinationHospital.lng || destinationHospital.longitude] : null,
        ].filter(Boolean)
      : null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-white tracking-tight">Driver Navigation Console</h1>
            <TierBadge tier={myAmbulance?.type || 'ALS'} />
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Unit: <span className="text-white font-bold">{myAmbulance?.vehicleNumber}</span> • Driver:{' '}
            <span className="text-white font-medium">{currentUser?.fullName}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
            <span className="text-slate-400">Unit Status:</span>
            <StatusBadge status={myAmbulance?.status || 'AVAILABLE'} />
          </div>
        </div>
      </div>

      {/* Telematics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Gauge className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-400">Current Speed</div>
            <div className="text-base font-bold text-white">{myAmbulance?.speedKmh || 0} km/h</div>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
            <Fuel className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-400">Medical O2 / Battery</div>
            <div className="text-base font-bold text-white">{myAmbulance?.batteryOxygenPct || 95}%</div>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-400">Station Base</div>
            <div className="text-xs font-bold text-white truncate max-w-[130px]">{myAmbulance?.baseStation}</div>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-400">Current Run</div>
            <div className="text-xs font-bold text-white">
              {activeMission ? `#${activeMission.id} (${activeMission.priority})` : 'Standby'}
            </div>
          </div>
        </div>
      </div>

      {/* Main Mission Controller */}
      {activeMission ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Tactical Mission Controls */}
          <div className="lg:col-span-1 space-y-4">
            <div className="glass-panel p-5 rounded-2xl border border-rose-500/30 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-rose-400 uppercase tracking-widest flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                  Active Dispatch Mission
                </span>
                <PriorityBadge priority={activeMission.priority} label={activeMission.priorityLabel} />
              </div>

              {/* Patient Snapshot */}
              <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2 text-xs">
                <div className="font-bold text-sm text-white">{activeMission.patientName}</div>
                <div className="text-rose-400 font-semibold">{activeMission.emergencyType} Emergency</div>
                <div className="text-slate-400 text-[11px]">
                  Notes: <span className="text-slate-300">{activeMission.notes}</span>
                </div>
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Caller: {activeMission.reporterName}</span>
                  <a
                    href={`tel:${activeMission.reporterPhone}`}
                    className="text-emerald-400 font-bold hover:underline flex items-center gap-1"
                  >
                    <Phone className="w-3 h-3" /> Call
                  </a>
                </div>
              </div>

              {/* Location Chokepoints */}
              <div className="space-y-2 text-xs">
                <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                  <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-rose-400" /> Pickup Location
                  </div>
                  <div className="font-medium text-slate-200 mt-1">{activeMission.pickupLocation.address}</div>
                </div>

                {destinationHospital && (
                  <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                    <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                      <Building2 className="w-3 h-3 text-sky-400" /> Destination Hospital
                    </div>
                    <div className="font-medium text-slate-200 mt-1">{destinationHospital.name}</div>
                    <div className="text-[11px] text-sky-400 mt-0.5">
                      Available ICU Beds: {destinationHospital.availableIcuBeds}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons for Driver State Progression */}
              <div className="space-y-2 pt-2">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Update Mission Phase:
                </div>

                {activeMission.status === 'ASSIGNED' && (
                  <button
                    onClick={() => handleAdvanceMissionState('EN_ROUTE')}
                    className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-600/30 transition-all"
                  >
                    <Navigation className="w-4 h-4" /> Start Drive (Mark En Route)
                  </button>
                )}

                {activeMission.status === 'EN_ROUTE' && (
                  <button
                    onClick={() => handleAdvanceMissionState('ON_SCENE')}
                    className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition-all"
                  >
                    <CheckCircle className="w-4 h-4" /> Arrived at Scene (Patient Contact)
                  </button>
                )}

                {activeMission.status === 'ON_SCENE' && (
                  <button
                    onClick={() => handleAdvanceMissionState('TRANSPORTING')}
                    className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all"
                  >
                    <Send className="w-4 h-4" /> Transport Patient to Hospital
                  </button>
                )}

                {activeMission.status === 'TRANSPORTING' && (
                  <button
                    onClick={() => handleAdvanceMissionState('RESOLVED')}
                    className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all"
                  >
                    <CheckCircle className="w-4 h-4" /> Complete Handover to ER
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Turn-by-Turn Navigation Map */}
          <div className="lg:col-span-2">
            <div className="glass-panel p-4 rounded-2xl border border-slate-800">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Navigation className="w-4 h-4 text-rose-500 animate-pulse" />
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                    Turn-By-Turn Route Simulation
                  </h3>
                </div>
                <span className="text-xs text-emerald-400 font-mono font-bold">
                  ETA: ~{activeMission.etaMinutes} mins
                </span>
              </div>

              <LeafletMap
                center={[myAmbulance.lat, myAmbulance.lng]}
                zoom={14}
                ambulances={[myAmbulance]}
                emergencies={[activeMission]}
                hospitals={destinationHospital ? [destinationHospital] : hospitals}
                routeCoordinates={routeCoords}
                height="500px"
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="glass-panel p-12 rounded-2xl text-center border border-slate-800">
          <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white">Standby • Ready for Dispatch</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Unit {myAmbulance?.vehicleNumber} is idle and marked as AVAILABLE in the Central Dispatch queue.
          </p>
        </div>
      )}
    </div>
  );
};
