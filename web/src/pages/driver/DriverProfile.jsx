import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useEmergency } from '../../context/EmergencyContext';
import { User, Ambulance, ShieldCheck, Phone, Mail, Award, CheckCircle2 } from 'lucide-react';

export const DriverProfile = () => {
  const { currentUser } = useAuth();
  const { ambulances } = useEmergency();

  const myAmbulance =
    ambulances.find((a) => a.driverId === currentUser?.id || a.driverName === currentUser?.fullName) ||
    ambulances[0];

  const [availability, setAvailability] = useState('ON_DUTY');
  const [phone, setPhone] = useState(currentUser?.phone || '+91 98123 45678');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div className="pb-4 border-b border-slate-800">
        <h1 className="text-2xl font-black text-white tracking-tight">Paramedic Driver Profile</h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Driver credentials, duty availability toggle, and assigned ambulance telemetry
        </p>
      </div>

      {savedSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          Driver duty status and credentials updated.
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Availability Toggle */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-white">Duty Availability Status</h2>
          <div className="flex flex-wrap gap-3">
            {[
              { val: 'ON_DUTY', label: '🟢 On Duty / Available for Dispatch', color: 'bg-emerald-600 text-white' },
              { val: 'BUSY', label: '🟡 Busy on Active Run', color: 'bg-amber-600 text-white' },
              { val: 'OFF_DUTY', label: '🔴 Off Duty / Standby', color: 'bg-slate-800 text-slate-400' },
            ].map((opt) => (
              <button
                key={opt.val}
                type="button"
                onClick={() => setAvailability(opt.val)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  availability === opt.val ? opt.color : 'bg-slate-900 border border-slate-800 text-slate-400'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Credentials & Assigned Vehicle */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
            <Ambulance className="w-4 h-4 text-rose-500" /> Assigned Vehicle & Certification
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Assigned Vehicle Number</label>
              <input
                type="text"
                value={myAmbulance.vehicleNumber}
                disabled
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs opacity-80"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Vehicle Tier</label>
              <input
                type="text"
                value={`${myAmbulance.type} (${myAmbulance.type === 'ALS' ? 'Advanced Life Support' : 'Basic Life Support'})`}
                disabled
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs opacity-80"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">EMS Driver Badge</label>
              <input
                type="text"
                value="EMS-BLR-409"
                disabled
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs opacity-80"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Medical Certification</label>
              <input
                type="text"
                value="Advanced Cardiac Life Support (ACLS)"
                disabled
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs opacity-80"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Phone Contact</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Home Depot Station</label>
              <input
                type="text"
                value={myAmbulance.baseStation}
                disabled
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs opacity-80"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/30 transition-all"
        >
          Update Paramedic Status
        </button>
      </form>
    </div>
  );
};
