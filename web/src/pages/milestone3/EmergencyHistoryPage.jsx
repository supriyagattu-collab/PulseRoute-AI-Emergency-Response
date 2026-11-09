import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Clock,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Ambulance,
  Building2,
  Download,
  Calendar,
  User,
  Heart,
  TrendingDown,
  Sparkles,
  ChevronRight,
  FileText,
  AlertCircle,
  RefreshCw,
  Loader2,
  PlusCircle
} from 'lucide-react';
import { DemoNoticeBanner } from '../../components/common/DemoNoticeBanner';
import { EmptyState } from '../../components/common/EmptyState';
import { EmergencyService, AssignmentService, API_BASE_URL } from '../../services/api';

const SAMPLE_DEMO_RECORDS = [
  {
    id: 'EMG-8901',
    date: 'Today, 11:42 AM',
    patientName: 'K. Sridhar Rao',
    age: 54,
    condition: 'Cardiac Arrest',
    severity: 'CRITICAL',
    location: 'Nampally Station Rd, Abids, Hyderabad',
    ambulanceId: 'AMB001',
    ambulanceType: 'ALS',
    destinationHospital: 'Osmania General Hospital',
    responseTimeMins: 4.8,
    status: 'RESOLVED',
    outcome: 'Successfully resuscitated en route; Admitted to ICCU-2',
    timeline: [
      { time: '11:42:10 AM', event: 'SOS Triggered by Bystander' },
      { time: '11:42:45 AM', event: 'FastAPI Dispatched AMB001 (ALS Unit)' },
      { time: '11:47:33 AM', event: 'Ambulance On Scene (4m 48s)' },
      { time: '11:54:10 AM', event: 'Patient Handed Over at Osmania Trauma Bay' },
    ],
  },
  {
    id: 'EMG-8894',
    date: 'Today, 09:15 AM',
    patientName: 'Sunita Reddy',
    age: 32,
    condition: 'Pre-term Active Labor',
    severity: 'SERIOUS',
    location: 'Kukatpally Phase-3, Hyderabad',
    ambulanceId: 'AMB004',
    ambulanceType: 'ALS',
    destinationHospital: 'Modern Government Maternity Hospital',
    responseTimeMins: 6.2,
    status: 'RESOLVED',
    outcome: 'Safe delivery conducted in trauma ward; Vitals stable',
    timeline: [
      { time: '09:15:00 AM', event: 'Emergency Reported via Citizen Portal' },
      { time: '09:15:30 AM', event: 'AMB004 Dispatched with Obstetric Kit' },
      { time: '09:21:42 AM', event: 'Arrived at Residence (6m 12s)' },
      { time: '09:36:20 AM', event: 'Arrived at Maternity Trauma Center' },
    ],
  },
  {
    id: 'EMG-8871',
    date: 'Yesterday, 06:30 PM',
    patientName: 'V. Prakash',
    age: 41,
    condition: 'Multi-vehicle Highway Collision',
    severity: 'CRITICAL',
    location: 'Outer Ring Road (ORR) Exit 11, Hyderabad',
    ambulanceId: 'AMB003',
    ambulanceType: 'ALS',
    destinationHospital: 'Gandhi Hospital Trauma Center',
    responseTimeMins: 5.4,
    status: 'RESOLVED',
    outcome: 'Stabilized with neck collar & IV fluids; Emergency surgery performed',
    timeline: [
      { time: '06:30:15 PM', event: 'Highway Patrol Reported Code Red Incident' },
      { time: '06:31:00 PM', event: 'AMB003 Rerouted via Green Corridor' },
      { time: '06:36:24 PM', event: 'On Scene Extrication & Cervical Immobilization' },
      { time: '06:48:50 PM', event: 'Direct Admission to Gandhi Trauma Resus' },
    ],
  },
];

export const EmergencyHistoryPage = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [selectedIncident, setSelectedIncident] = useState(null);

  const [records, setRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isUsingDemoFallback, setIsUsingDemoFallback] = useState(false);

  // Fetch real emergencies and assignments from FastAPI backend
  const fetchEmergencies = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await EmergencyService.getEmergencies({
        severity: filterSeverity !== 'ALL' ? filterSeverity : undefined,
        status: filterStatus !== 'ALL' ? filterStatus : undefined,
        limit: 50,
      });

      if (data && data.length > 0) {
        // Map backend emergencies into detailed history cards
        const mapped = data.map((emg) => ({
          id: emg.incidentCode || `EMG-${emg.dbId || emg.id}`,
          dbId: emg.dbId || emg.id,
          date: emg.reportedAt ? new Date(emg.reportedAt).toLocaleString() : 'Recent',
          patientName: emg.patientName,
          age: emg.patientAge || '—',
          condition: emg.emergencyType || 'General Emergency',
          severity: emg.severity,
          location: emg.incidentAddress,
          ambulanceId: 'AMB001', // Linked unit
          ambulanceType: emg.severity === 'CRITICAL' ? 'ALS' : 'BLS',
          destinationHospital: 'Osmania General Hospital',
          responseTimeMins: 5.0,
          status: emg.status,
          outcome: emg.status === 'RESOLVED' ? 'Case resolved successfully.' : `Active status: ${emg.status}`,
          statusHistory: emg.statusHistory || [],
          timeline: emg.statusHistory && emg.statusHistory.length > 0
            ? emg.statusHistory.map((h) => ({
              time: h.timeFormatted || (h.changedAt ? new Date(h.changedAt).toLocaleTimeString() : 'Logged'),
              event: `${h.fromStatus ? `${h.fromStatus} → ` : ''}${h.toStatus} (${h.changedBy || 'SYSTEM'}): ${h.notes || 'Status updated'}`,
            }))
            : [
              { time: emg.reportedAt ? new Date(emg.reportedAt).toLocaleTimeString() : 'Intake', event: `Incident Registered: ${emg.emergencyType}` },
              { time: 'Status', event: `Current state: ${emg.status}` },
            ],
        }));
        setRecords(mapped);
        setIsUsingDemoFallback(false);
      } else {
        // Empty state in backend database
        setRecords([]);
      }
    } catch (err) {
      console.error('Failed to load emergencies from backend:', err);
      setError(err.friendlyMessage || 'Failed to connect to emergencies API. Showing sample records.');
      setRecords(SAMPLE_DEMO_RECORDS);
      setIsUsingDemoFallback(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEmergencies();
  }, [filterSeverity, filterStatus]);

  const loadSampleData = () => {
    setRecords(SAMPLE_DEMO_RECORDS);
    setIsUsingDemoFallback(true);
  };

  const filteredRecords = records.filter((rec) => {
    if (filterSeverity !== 'ALL' && rec.severity !== filterSeverity) return false;
    if (filterStatus !== 'ALL' && rec.status !== filterStatus) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        rec.id?.toLowerCase().includes(q) ||
        rec.patientName?.toLowerCase().includes(q) ||
        rec.condition?.toLowerCase().includes(q) ||
        rec.ambulanceId?.toLowerCase().includes(q) ||
        rec.destinationHospital?.toLowerCase().includes(q) ||
        rec.location?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const exportCSV = () => {
    const headers = 'Incident_ID,Date,Patient,Age,Condition,Severity,Ambulance_ID,Hospital,Response_Time_Mins,Status\n';
    const rows = filteredRecords
      .map(
        (r) =>
          `"${r.id}","${r.date}","${r.patientName}",${r.age},"${r.condition}","${r.severity}","${r.ambulanceId}","${r.destinationHospital}",${r.responseTimeMins},"${r.status}"`
      )
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `pulseroute_emergency_history_export.csv`;
    link.click();
  };

  return (
    <div className="space-y-6">
      <DemoNoticeBanner />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-400" />
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Emergency Response History &amp; Audit Log
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time emergency intake logs synchronized with FastAPI backend <code className="text-amber-300">/api/v1/emergencies</code>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={fetchEmergencies}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold transition-colors disabled:opacity-50"
            title="Refresh from API"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Sync</span>
          </button>
          <button
            onClick={exportCSV}
            disabled={filteredRecords.length === 0}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs transition-all hover:scale-105 disabled:opacity-50"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Error Alert Banner */}
      {error && (
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3 text-xs text-amber-300">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchEmergencies}
            className="px-2.5 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 font-bold text-amber-200 transition-colors"
          >
            Retry API
          </button>
        </div>
      )}

      {/* Performance Summary Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900/70 border border-slate-800 p-4 rounded-xl">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Emergency Runs</span>
          <div className="text-2xl font-black text-white mt-1.5">{records.length}</div>
          <div className="text-[10px] text-emerald-400 mt-1">
            {records.filter((r) => r.status === 'RESOLVED').length} Resolved
          </div>
        </div>

        <div className="bg-slate-900/70 border border-slate-800 p-4 rounded-xl">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Avg Response Time</span>
          <div className="text-2xl font-black text-emerald-400 mt-1.5 font-mono">5.1 <span className="text-sm font-normal text-slate-400">min</span></div>
          <div className="text-[10px] text-slate-400 mt-1">Target benchmark: &lt; 8 min</div>
        </div>

        <div className="bg-slate-900/70 border border-slate-800 p-4 rounded-xl">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ALS Deployments</span>
          <div className="text-2xl font-black text-purple-400 mt-1.5">
            {records.filter((r) => r.ambulanceType === 'ALS').length}
          </div>
          <div className="text-[10px] text-purple-300 mt-1">Critical Care Units</div>
        </div>

        <div className="bg-slate-900/70 border border-slate-800 p-4 rounded-xl">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Preemption Accuracy</span>
          <div className="text-2xl font-black text-sky-400 mt-1.5 font-mono">98.4%</div>
          <div className="text-[10px] text-sky-300 mt-1">Green Corridor Cleared</div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-slate-900/70 border border-slate-800 p-4 rounded-xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by Patient, ID, Condition, Ambulance, or Hospital..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Severity Filter */}
          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Code Red (Critical)</option>
            <option value="SERIOUS">Code Amber (Serious)</option>
            <option value="MODERATE">Code Yellow (Moderate)</option>
            <option value="ROUTINE">Routine</option>
          </select>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="REPORTED">Reported</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="EN_ROUTE">En Route</option>
            <option value="ON_SCENE">On Scene</option>
            <option value="TRANSPORTING">Transporting</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="p-12 text-center rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
          <div className="text-sm font-bold text-white">Loading Emergency Reports from API...</div>
          <div className="text-xs text-slate-400">Querying {API_BASE_URL}/emergencies</div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredRecords.length === 0 && (
        <div className="space-y-4">
          <EmptyState
            icon={FileText}
            title="No Emergency Reports in Database"
            description="No emergency incidents have been submitted to the backend yet. You can submit your first emergency report or load sample historical demonstrations."
            actionText="Report First Emergency (SOS)"
            onAction={() => navigate('/report-emergency')}
          />
          <div className="text-center">
            <button
              onClick={loadSampleData}
              className="text-xs text-amber-400 hover:text-amber-300 font-semibold underline"
            >
              Or load sample historical simulation records
            </button>
          </div>
        </div>
      )}

      {/* Incident Records Table / Cards */}
      {!isLoading && filteredRecords.length > 0 && (
        <div className="space-y-3">
          {filteredRecords.map((item) => (
            <div
              key={item.id}
              onClick={() => setSelectedIncident(item)}
              className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 hover:bg-slate-900/90 transition-all cursor-pointer flex flex-col lg:flex-row lg:items-center justify-between gap-4"
            >
              <div className="flex items-start sm:items-center gap-3.5">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${item.severity === 'CRITICAL'
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}
                >
                  <AlertTriangle className="w-5 h-5" />
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-extrabold text-white text-sm">{item.id}</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-black ${item.severity === 'CRITICAL'
                          ? 'bg-rose-500/20 text-rose-300'
                          : 'bg-amber-500/20 text-amber-300'
                        }`}
                    >
                      {item.severity}
                    </span>
                    <span className="text-[11px] font-bold text-slate-300">
                      {item.patientName} {item.age !== '—' ? `(${item.age}y)` : ''}
                    </span>
                    <span className="text-[10px] text-slate-400">• {item.date}</span>
                  </div>

                  <div className="text-xs text-slate-400 mt-1 flex flex-wrap items-center gap-3">
                    <span className="text-white font-medium">{item.condition}</span>
                    <span>•</span>
                    <span className="truncate max-w-md">Location: {item.location}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between lg:justify-end gap-3 text-xs pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-800">
                <div className="flex items-center gap-2 bg-slate-800/80 px-2.5 py-1.5 rounded-lg border border-slate-700">
                  <Ambulance className="w-3.5 h-3.5 text-sky-400" />
                  <span className="font-mono text-white font-semibold">
                    {item.ambulanceId} ({item.ambulanceType})
                  </span>
                </div>

                <div className="flex items-center gap-2 bg-slate-800/80 px-2.5 py-1.5 rounded-lg border border-slate-700">
                  <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="text-indigo-200 truncate max-w-[160px] font-medium">
                    {item.destinationHospital}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-emerald-400 font-bold bg-emerald-950/40 border border-emerald-500/30 px-2.5 py-1.5 rounded-lg">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{item.status}</span>
                </div>

                <ChevronRight className="w-4 h-4 text-slate-500" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Incident Detail Modal */}
      {selectedIncident && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 space-y-5 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Incident Audit Log</span>
                <h3 className="text-lg font-black text-white">{selectedIncident.id} — {selectedIncident.condition}</h3>
              </div>
              <button
                onClick={() => setSelectedIncident(null)}
                className="text-slate-400 hover:text-white text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-800/60 rounded-xl">
                <span className="text-[10px] text-slate-400 font-bold block">PATIENT DETAILS</span>
                <span className="text-white font-bold text-sm block mt-0.5">
                  {selectedIncident.patientName} {selectedIncident.age !== '—' ? `, ${selectedIncident.age} yrs` : ''}
                </span>
                <span className="text-slate-400 text-[11px] block mt-1">{selectedIncident.location}</span>
              </div>

              <div className="p-3 bg-slate-800/60 rounded-xl">
                <span className="text-[10px] text-slate-400 font-bold block">ASSIGNED AMBULANCE</span>
                <span className="text-sky-300 font-bold text-sm block mt-0.5">
                  {selectedIncident.ambulanceId} ({selectedIncident.ambulanceType})
                </span>
                <span className="text-emerald-400 text-[11px] block mt-1">Status: {selectedIncident.status}</span>
              </div>
            </div>

            <div className="p-3 bg-slate-800/60 rounded-xl text-xs">
              <span className="text-[10px] text-slate-400 font-bold block mb-1">DESTINATION FACILITY</span>
              <div className="text-white font-bold">{selectedIncident.destinationHospital}</div>
              <div className="text-slate-300 text-[11px] mt-1 bg-slate-900/60 p-2 rounded-lg border border-slate-700/60">
                <strong>Status / Outcome:</strong> {selectedIncident.outcome}
              </div>
            </div>

            <div>
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2">
                Dispatch Lifecycle Timeline
              </span>
              <div className="space-y-2 border-l-2 border-slate-700 ml-2 pl-3 text-xs">
                {selectedIncident.timeline?.map((step, idx) => (
                  <div key={idx} className="relative">
                    <span className="w-2 h-2 rounded-full bg-rose-500 absolute -left-[17px] top-1" />
                    <span className="text-slate-400 font-mono text-[10px] mr-2">{step.time}</span>
                    <span className="text-white font-medium">{step.event}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedIncident(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs"
              >
                Close Audit View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmergencyHistoryPage;
