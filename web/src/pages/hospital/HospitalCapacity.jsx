import React, { useState } from 'react';
import { useEmergency } from '../../context/EmergencyContext';
import { useAuth } from '../../context/AuthContext';
import { Bed, HeartPulse, Plus, Minus, AlertTriangle, ShieldCheck, CheckCircle2 } from 'lucide-react';

export const HospitalCapacity = () => {
  const { currentUser } = useAuth();
  const { hospitals, updateHospitalBeds } = useEmergency();

  const myHospital =
    hospitals.find((h) => h.id === currentUser?.hospitalId) || hospitals[0];

  const [notification, setNotification] = useState('');

  const handleBedAdjust = (type, delta) => {
    updateHospitalBeds(myHospital.id, type, delta);
    setNotification(`Successfully updated ${type.toUpperCase()} bed allocation.`);
    setTimeout(() => setNotification(''), 2500);
  };

  const icuOccupied = myHospital.totalIcuBeds - myHospital.availableIcuBeds;
  const genOccupied = myHospital.totalGeneralBeds - myHospital.availableGeneralBeds;

  const icuOccupancyPct = Math.round((icuOccupied / myHospital.totalIcuBeds) * 100);
  const genOccupancyPct = Math.round((genOccupied / myHospital.totalGeneralBeds) * 100);

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-slate-800">
        <h1 className="text-2xl font-black text-white tracking-tight">Bed & Facility Capacity Hub</h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Manage critical care and acute emergency observation capacities for <strong className="text-white">{myHospital.name}</strong>
        </p>
      </div>

      {notification && (
        <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          {notification}
        </div>
      )}

      {/* Primary Capacity Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* ICU Bed Card */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
                <HeartPulse className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Intensive Care Units (ICU)</h3>
                <span className="text-[11px] text-slate-400">Ventilator & Cath Lab Connected</span>
              </div>
            </div>
            <span
              className={`text-xs font-bold px-2.5 py-0.5 rounded border ${
                myHospital.availableIcuBeds <= 2
                  ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                  : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
              }`}
            >
              {myHospital.availableIcuBeds <= 2 ? 'CRITICAL CAPACITY' : 'OPERATIONAL'}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase font-bold">Total</span>
              <div className="text-xl font-black text-white mt-1">{myHospital.totalIcuBeds}</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase font-bold">Occupied</span>
              <div className="text-xl font-black text-amber-400 mt-1">{icuOccupied}</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase font-bold">Available</span>
              <div className="text-xl font-black text-emerald-400 mt-1">{myHospital.availableIcuBeds}</div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-slate-400">Real-time manual adjustment:</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleBedAdjust('icu', -1)}
                disabled={myHospital.availableIcuBeds <= 0}
                className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-rose-400 border border-slate-800 disabled:opacity-40 text-xs font-bold flex items-center gap-1"
                title="Admit patient (-1 available)"
              >
                <Minus className="w-3.5 h-3.5" /> Admit
              </button>
              <button
                onClick={() => handleBedAdjust('icu', 1)}
                disabled={myHospital.availableIcuBeds >= myHospital.totalIcuBeds}
                className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-emerald-400 border border-slate-800 disabled:opacity-40 text-xs font-bold flex items-center gap-1"
                title="Discharge patient (+1 available)"
              >
                <Plus className="w-3.5 h-3.5" /> Discharge
              </button>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-[11px] text-slate-400 mb-1">
              <span>Occupancy Rate</span>
              <span className="font-bold text-white">{icuOccupancyPct}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  icuOccupancyPct > 80 ? 'bg-rose-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${icuOccupancyPct}%` }}
              />
            </div>
          </div>
        </div>

        {/* General Emergency Beds Card */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400">
                <Bed className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">General Emergency Wards</h3>
                <span className="text-[11px] text-slate-400">Triage & Short Stay Observation</span>
              </div>
            </div>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded bg-sky-500/20 text-sky-400 border border-sky-500/40">
              OPERATIONAL
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase font-bold">Total</span>
              <div className="text-xl font-black text-white mt-1">{myHospital.totalGeneralBeds}</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase font-bold">Occupied</span>
              <div className="text-xl font-black text-amber-400 mt-1">{genOccupied}</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase font-bold">Available</span>
              <div className="text-xl font-black text-sky-400 mt-1">{myHospital.availableGeneralBeds}</div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-slate-400">Real-time manual adjustment:</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleBedAdjust('general', -1)}
                disabled={myHospital.availableGeneralBeds <= 0}
                className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-rose-400 border border-slate-800 disabled:opacity-40 text-xs font-bold flex items-center gap-1"
              >
                <Minus className="w-3.5 h-3.5" /> Admit
              </button>
              <button
                onClick={() => handleBedAdjust('general', 1)}
                disabled={myHospital.availableGeneralBeds >= myHospital.totalGeneralBeds}
                className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-emerald-400 border border-slate-800 disabled:opacity-40 text-xs font-bold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Discharge
              </button>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-[11px] text-slate-400 mb-1">
              <span>Occupancy Rate</span>
              <span className="font-bold text-white">{genOccupancyPct}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-sky-500 transition-all duration-300"
                style={{ width: `${genOccupancyPct}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
