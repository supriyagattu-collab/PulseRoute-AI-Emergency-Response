import React, { useState } from 'react';
import { useEmergency } from '../../context/EmergencyContext';
import { LeafletMap } from '../../components/common/LeafletMap';
import { PriorityBadge, StatusBadge, TierBadge } from '../../components/common/Badge';
import { MapPin, Ambulance, Building2, Activity, Filter, Radio, Eye } from 'lucide-react';

export const AdminMonitoring = () => {
  const { emergencies, ambulances, hospitals, isSimulatingGps } = useEmergency();

  const [showAmbulances, setShowAmbulances] = useState(true);
  const [showEmergencies, setShowEmergencies] = useState(true);
  const [showHospitals, setShowHospitals] = useState(true);
  const [filterTier, setFilterTier] = useState('ALL');

  const filteredAmbulances = showAmbulances
    ? ambulances.filter((a) => (filterTier === 'ALL' ? true : a.type === filterTier))
    : [];

  const filteredEmergencies = showEmergencies
    ? emergencies.filter((e) => e.status !== 'RESOLVED' && e.status !== 'CANCELLED')
    : [];

  const filteredHospitals = showHospitals ? hospitals : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Live Spatial Monitoring Grid</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            City-wide unified geospatial monitoring console • Simulated GPS telemetry stream
          </p>
        </div>

        {/* Layer Filters */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <button
            onClick={() => setShowAmbulances(!showAmbulances)}
            className={`px-3 py-1.5 rounded-xl font-bold border transition-colors flex items-center gap-1.5 ${
              showAmbulances
                ? 'bg-emerald-600/20 text-emerald-300 border-emerald-500/40'
                : 'bg-slate-900 text-slate-500 border-slate-800'
            }`}
          >
            <Ambulance className="w-3.5 h-3.5" /> Fleet ({ambulances.length})
          </button>

          <button
            onClick={() => setShowEmergencies(!showEmergencies)}
            className={`px-3 py-1.5 rounded-xl font-bold border transition-colors flex items-center gap-1.5 ${
              showEmergencies
                ? 'bg-rose-600/20 text-rose-300 border-rose-500/40'
                : 'bg-slate-900 text-slate-500 border-slate-800'
            }`}
          >
            <Activity className="w-3.5 h-3.5" /> Active Incidents ({filteredEmergencies.length})
          </button>

          <button
            onClick={() => setShowHospitals(!showHospitals)}
            className={`px-3 py-1.5 rounded-xl font-bold border transition-colors flex items-center gap-1.5 ${
              showHospitals
                ? 'bg-sky-600/20 text-sky-300 border-sky-500/40'
                : 'bg-slate-900 text-slate-500 border-slate-800'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" /> Hospitals ({hospitals.length})
          </button>
        </div>
      </div>

      {/* Full-width Map Container */}
      <div className="glass-panel p-4 rounded-3xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between text-xs px-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-bold text-white uppercase tracking-wider">
              Metropolitan Dispatch Sector (Bangalore Tech Hub)
            </span>
          </div>
          <span className="text-slate-400 font-mono text-[11px]">
            {isSimulatingGps ? 'GPS Broadcast: Active' : 'GPS Broadcast: Paused'}
          </span>
        </div>

        <LeafletMap
          center={[12.9716, 77.5946]}
          zoom={12}
          ambulances={filteredAmbulances}
          emergencies={filteredEmergencies}
          hospitals={filteredHospitals}
          height="620px"
        />

        {/* Legend Footer */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-800/80 text-xs px-2">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-slate-300">
              <span className="w-3 h-3 rounded-full bg-rose-500" /> Incident Location (Code Red/Yellow)
            </span>
            <span className="flex items-center gap-1.5 text-slate-300">
              <span className="w-3 h-3 rounded-full bg-emerald-500" /> Ambulance Available
            </span>
            <span className="flex items-center gap-1.5 text-slate-300">
              <span className="w-3 h-3 rounded-full bg-amber-500" /> Ambulance En Route / Transporting
            </span>
            <span className="flex items-center gap-1.5 text-slate-300">
              <span className="w-3 h-3 rounded-md bg-sky-500" /> Hospital Trauma Center
            </span>
          </div>

          <span className="text-[11px] text-slate-500">
            OpenStreetMap (OSM) Tiles with Dark UI Filter
          </span>
        </div>
      </div>
    </div>
  );
};
