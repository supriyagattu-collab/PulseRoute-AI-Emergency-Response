import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useEmergency } from '../../context/EmergencyContext';
import { Building2, Phone, MapPin, CheckCircle, ShieldCheck, HeartPulse, Activity } from 'lucide-react';

export const HospitalProfile = () => {
  const { currentUser } = useAuth();
  const { hospitals } = useEmergency();

  const myHospital =
    hospitals.find((h) => h.id === currentUser?.hospitalId) || hospitals[0];

  const [hasCathLab, setHasCathLab] = useState(myHospital.hasCathLab);
  const [hasBurnUnit, setHasBurnUnit] = useState(myHospital.hasBurnUnit);
  const [hasStrokeUnit, setHasStrokeUnit] = useState(myHospital.hasStrokeUnit);
  const [phone, setPhone] = useState(myHospital.phone);
  const [emergencyContact, setEmergencyContact] = useState(myHospital.emergencyContact);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div className="pb-4 border-b border-slate-800">
        <h1 className="text-2xl font-black text-white tracking-tight">Hospital Trauma Facility Registry</h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Emergency department capabilities and trauma certifications for CAD routing matching
        </p>
      </div>

      {savedSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          Hospital facilities and hotlines updated successfully.
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h2 className="text-base font-bold text-white">{myHospital.name}</h2>
              <p className="text-xs text-slate-400">{myHospital.address}</p>
            </div>
            <span className="px-3 py-1 rounded-xl bg-sky-500/15 border border-sky-500/30 text-sky-300 text-xs font-bold">
              {myHospital.traumaLevel}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">General Hotline</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">ER Trauma Hotline</label>
              <input
                type="text"
                value={emergencyContact}
                onChange={(e) => setEmergencyContact(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs"
              />
            </div>
          </div>
        </div>

        {/* Specialized Facilities Toggle */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-white">
            Specialized Emergency Care Units
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <button
              type="button"
              onClick={() => setHasCathLab(!hasCathLab)}
              className={`p-3.5 rounded-xl border text-left transition-colors ${
                hasCathLab
                  ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300'
                  : 'bg-slate-900 border-slate-800 text-slate-500'
              }`}
            >
              <HeartPulse className="w-5 h-5 mb-2" />
              <div className="font-bold">Cardiac Cath Lab</div>
              <div className="text-[10px] mt-0.5">{hasCathLab ? 'Online 24/7' : 'Unavailable'}</div>
            </button>

            <button
              type="button"
              onClick={() => setHasStrokeUnit(!hasStrokeUnit)}
              className={`p-3.5 rounded-xl border text-left transition-colors ${
                hasStrokeUnit
                  ? 'bg-sky-950/20 border-sky-500/40 text-sky-300'
                  : 'bg-slate-900 border-slate-800 text-slate-500'
              }`}
            >
              <ShieldCheck className="w-5 h-5 mb-2" />
              <div className="font-bold">Stroke / Neuro Unit</div>
              <div className="text-[10px] mt-0.5">{hasStrokeUnit ? 'Online 24/7' : 'Unavailable'}</div>
            </button>

            <button
              type="button"
              onClick={() => setHasBurnUnit(!hasBurnUnit)}
              className={`p-3.5 rounded-xl border text-left transition-colors ${
                hasBurnUnit
                  ? 'bg-rose-950/20 border-rose-500/40 text-rose-300'
                  : 'bg-slate-900 border-slate-800 text-slate-500'
              }`}
            >
              <Activity className="w-5 h-5 mb-2" />
              <div className="font-bold">Burns Care Ward</div>
              <div className="text-[10px] mt-0.5">{hasBurnUnit ? 'Online 24/7' : 'Unavailable'}</div>
            </button>
          </div>
        </div>

        <button
          type="submit"
          className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/30 transition-all"
        >
          Save Hospital Settings
        </button>
      </form>
    </div>
  );
};
