import React, { useState } from 'react';
import { useEmergency } from '../../context/EmergencyContext';
import { useAuth } from '../../context/AuthContext';
import { LeafletMap } from '../../components/common/LeafletMap';
import { PriorityBadge, StatusBadge, TierBadge } from '../../components/common/Badge';
import { ANALYTICS_DATA } from '../../data/mockData';
import {
  ShieldAlert,
  Ambulance,
  Activity,
  Building2,
  Clock,
  TrendingDown,
  BarChart3,
  MapPin,
  RefreshCw,
  Sliders,
  CheckCircle,
  AlertTriangle,
  Cpu,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

export const AdminDashboard = () => {
  const { currentUser } = useAuth();
  const {
    emergencies,
    ambulances,
    hospitals,
    assignAmbulance,
    advanceTripStage,
  } = useEmergency();

  // Helper: mark an emergency as resolved via context trip stage progression
  const resolveEmergency = (emergencyId) => {
    advanceTripStage(emergencyId, 'COMPLETED');
  };

  const [activeTab, setActiveTab] = useState('dispatch'); // 'dispatch' or 'analytics'
  const [selectedAmbulanceToAssign, setSelectedAmbulanceToAssign] = useState({});

  const activeEmergencies = emergencies.filter((e) => e.status !== 'RESOLVED');
  const availableAmbulances = ambulances.filter((a) => a.status === 'AVAILABLE');

  const handleManualAssign = (emergencyId) => {
    const chosenAmbId = selectedAmbulanceToAssign[emergencyId];
    if (chosenAmbId) {
      assignAmbulance(emergencyId, chosenAmbId);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-white tracking-tight">Central Dispatch & Command HQ</h1>
            <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              City Metro Grid (Bangalore)
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Commander: <span className="text-white font-medium">{currentUser?.fullName}</span> • Real-Time Telemetry & Dispatch Control
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('dispatch')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg font-bold transition-all ${
              activeTab === 'dispatch'
                ? 'bg-rose-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" /> Fleet & Dispatch
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg font-bold transition-all ${
              activeTab === 'analytics'
                ? 'bg-rose-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" /> Analytics & AI Metrics
          </button>
        </div>
      </div>

      {activeTab === 'dispatch' ? (
        <div className="space-y-6">
          {/* Global City-Wide Map */}
          <div className="glass-panel p-4 rounded-2xl border border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Live Unified Spatial Grid (Ambulances, Hospitals & Emergencies)
                </h3>
              </div>
              <div className="flex items-center gap-4 text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-rose-500"></span> Incident Pin
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Ambulance
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-sky-500"></span> Hospital
                </span>
              </div>
            </div>

            <LeafletMap
              center={[12.9716, 77.5946]}
              zoom={12}
              ambulances={ambulances}
              emergencies={activeEmergencies}
              hospitals={hospitals}
              height="460px"
            />
          </div>

          {/* Active Emergencies Queue with Manual Override */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-rose-500 animate-pulse" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Active Emergency Incident Queue ({activeEmergencies.length})
                </h3>
              </div>
              <span className="text-xs text-slate-400">Automated Match + Manual Override</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                    <th className="pb-3 pl-2">Case ID & Priority</th>
                    <th className="pb-3">Patient & Symptoms</th>
                    <th className="pb-3">Pickup Location</th>
                    <th className="pb-3">Assigned Unit</th>
                    <th className="pb-3">Target Hospital</th>
                    <th className="pb-3">Status & Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {activeEmergencies.map((emg) => {
                    const assignedAmb = ambulances.find((a) => a.id === emg.assignedAmbulanceId);
                    const assignedHosp = hospitals.find((h) => h.id === emg.assignedHospitalId);

                    return (
                      <tr key={emg.id} className="hover:bg-slate-900/50 transition-colors">
                        <td className="py-3.5 pl-2">
                          <div className="font-bold text-white">#{emg.id}</div>
                          <div className="mt-1">
                            <PriorityBadge priority={emg.priority} label={emg.priorityLabel} />
                          </div>
                        </td>

                        <td className="py-3.5 max-w-[200px]">
                          <div className="font-semibold text-white truncate">{emg.patientName}</div>
                          <div className="text-[11px] text-rose-400 font-medium">{emg.emergencyType}</div>
                          <div className="text-[11px] text-slate-400 truncate">{emg.notes}</div>
                        </td>

                        <td className="py-3.5 max-w-[180px]">
                          <div className="text-slate-300 truncate">
                            {emg.pickupLocation?.address || emg.incident_address || emg.incidentAddress || 'Incident Location'}
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono">
                            [{Number(emg.pickupLocation?.lat ?? emg.latitude ?? emg.lat ?? 0).toFixed(3)},
                             {Number(emg.pickupLocation?.lng ?? emg.longitude ?? emg.lng ?? 0).toFixed(3)}]
                          </div>
                        </td>

                        <td className="py-3.5">
                          {assignedAmb ? (
                            <div>
                              <div className="font-bold text-white flex items-center gap-1">
                                <Ambulance className="w-3.5 h-3.5 text-rose-400" />
                                {assignedAmb.vehicleNumber}
                              </div>
                              <div className="text-[11px] text-slate-400">{assignedAmb.driverName}</div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <select
                                onChange={(e) =>
                                  setSelectedAmbulanceToAssign({
                                    ...selectedAmbulanceToAssign,
                                    [emg.id]: e.target.value,
                                  })
                                }
                                className="px-2 py-1 rounded bg-slate-900 border border-slate-700 text-xs text-white"
                              >
                                <option value="">Select Ambulance</option>
                                {availableAmbulances.map((amb) => (
                                  <option key={amb.id} value={amb.id}>
                                    {amb.vehicleNumber} ({amb.type})
                                  </option>
                                ))}
                              </select>
                              <button
                                onClick={() => handleManualAssign(emg.id)}
                                className="px-2 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white font-bold text-[11px]"
                              >
                                Assign
                              </button>
                            </div>
                          )}
                        </td>

                        <td className="py-3.5">
                          <div className="text-white font-medium truncate max-w-[150px]">
                            {assignedHosp?.name}
                          </div>
                          <div className="text-[11px] text-sky-400">
                            ICU Avail: {assignedHosp?.availableIcuBeds}
                          </div>
                        </td>

                        <td className="py-3.5">
                          <div className="space-y-1">
                            <StatusBadge status={emg.status} />
                            {emg.status !== 'RESOLVED' && (
                              <button
                                onClick={() => resolveEmergency(emg.id)}
                                className="block text-[11px] text-emerald-400 hover:underline font-bold"
                              >
                                Force Resolve
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Fleet Status Summary Table */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Ambulance className="w-5 h-5 text-amber-500" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Ambulance Fleet Status ({ambulances.length} Units)
                </h3>
              </div>
              <span className="text-xs text-slate-400">
                {availableAmbulances.length} Available for Immediate Dispatch
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {ambulances.map((amb) => (
                <div
                  key={amb.id}
                  className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-xs">{amb.vehicleNumber}</span>
                    <TierBadge tier={amb.type} />
                  </div>
                  <div className="text-[11px] text-slate-400">Driver: {amb.driverName}</div>
                  <div className="text-[11px] text-slate-400 flex justify-between">
                    <span>Speed: {amb.speedKmh} km/h</span>
                    <span>O2: {amb.batteryOxygenPct}%</span>
                  </div>
                  <div className="pt-2 border-t border-slate-800/80">
                    <StatusBadge status={amb.status} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Analytics & AI Performance Tab */
        <div className="space-y-6">
          {/* Executive KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="glass-panel p-5 rounded-2xl border border-slate-800">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Average Response Time
              </div>
              <div className="text-3xl font-black text-white">7.4 min</div>
              <div className="text-xs text-emerald-400 mt-1">↓ 3.2 min vs benchmark</div>
            </div>

            <div className="glass-panel p-5 rounded-2xl border border-slate-800">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Total Runs Today
              </div>
              <div className="text-3xl font-black text-white">{ANALYTICS_DATA.summary.totalDispatchesToday}</div>
              <div className="text-xs text-sky-400 mt-1">100% telemetry synced</div>
            </div>

            <div className="glass-panel p-5 rounded-2xl border border-slate-800">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Golden Hour Adherence
              </div>
              <div className="text-3xl font-black text-emerald-400">98.2%</div>
              <div className="text-xs text-slate-400 mt-1">Target &gt; 95% met</div>
            </div>

            <div className="glass-panel p-5 rounded-2xl border border-slate-800">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                AI Triage Model F1
              </div>
              <div className="text-3xl font-black text-rose-400">0.946</div>
              <div className="text-xs text-slate-400 mt-1">Multi-class Random Forest</div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Hourly Incident Density */}
            <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-rose-400" /> Hourly Emergency Incident Surge & ETA
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={ANALYTICS_DATA.hourlyIncidents}>
                    <defs>
                      <linearGradient id="incidentGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="hour" stroke="#64748b" textAnchor="end" tick={{ fontSize: 11 }} />
                    <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                    <Area type="monotone" dataKey="incidents" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#incidentGrad)" name="Incidents" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Severity Distribution Donut */}
            <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-400" /> Triage Urgency Code Breakdown
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={ANALYTICS_DATA.priorityBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {ANALYTICS_DATA.priorityBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* AI Feature Weights Card */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center gap-2">
              <Cpu className="w-5 h-5 text-rose-400" />
              <h3 className="text-sm font-bold text-white">Machine Learning Explainability & Feature Importances</h3>
            </div>
            <p className="text-xs text-slate-400">
              Trained on multi-class triage indicators. Top ranking features driving Code Red (P1) classification:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                <div className="text-slate-400">1. Consciousness (AVPU)</div>
                <div className="text-sm font-bold text-white mt-1">Weight: 0.38</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                <div className="text-slate-400">2. Acute Chest Pain</div>
                <div className="text-sm font-bold text-white mt-1">Weight: 0.24</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                <div className="text-slate-400">3. SpO2 Oxygen Saturation</div>
                <div className="text-sm font-bold text-white mt-1">Weight: 0.19</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                <div className="text-slate-400">4. Severe Hemorrhage</div>
                <div className="text-sm font-bold text-white mt-1">Weight: 0.14</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
