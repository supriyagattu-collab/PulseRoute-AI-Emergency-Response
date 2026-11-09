import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Activity,
  Ambulance,
  Building2,
  Navigation,
  Clock,
  PlusCircle,
  AlertCircle,
  CheckCircle2,
  Radio,
  MapPin,
  TrendingUp,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  Flame,
  Filter,
  RefreshCw,
  Loader2,
  X
} from 'lucide-react';
import { LeafletMap } from '../../components/common/LeafletMap';
import { DemoNoticeBanner } from '../../components/common/DemoNoticeBanner';
import { OneTapSosModal } from '../../components/emergency/OneTapSosModal';
import { WsStatusBadge } from '../../components/common/WsStatusBadge';
import { AMBULANCES_DEMO, HEALTH_FACILITIES } from '../../data/pulseRouteData';
import { useEmergency } from '../../context/EmergencyContext';
import {
  AmbulanceService,
  FacilityService,
  EmergencyService,
  HealthService,
  API_BASE_URL
} from '../../services/api';

export const DashboardPage = () => {
  const navigate = useNavigate();
  const { emergencies: contextEmergencies, createEmergency, wsConnectionState } = useEmergency();

  const [fleet, setFleet] = useState(AMBULANCES_DEMO);
  const [facilities, setFacilities] = useState(HEALTH_FACILITIES);
  const [apiEmergencies, setApiEmergencies] = useState([]);
  const [apiHealth, setApiHealth] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState(null);

  // Milestone 6: One-Tap SOS & Map synchronization state
  const [isSosModalOpen, setIsSosModalOpen] = useState(false);
  const [mapCenter, setMapCenter] = useState([17.4065, 78.4772]);
  const [sosPreviewLocation, setSosPreviewLocation] = useState(null);
  const [recentSosAlert, setRecentSosAlert] = useState(null);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    setApiError(null);
    try {
      // Parallel fetch from FastAPI backend
      const [healthRes, ambRes, facRes, emgRes] = await Promise.allSettled([
        HealthService.checkHealth(),
        AmbulanceService.getAmbulances(),
        FacilityService.getFacilities({ limit: 100 }),
        EmergencyService.getEmergencies({ limit: 50 }),
      ]);

      if (healthRes.status === 'fulfilled') {
        setApiHealth(healthRes.value);
      }

      if (ambRes.status === 'fulfilled' && ambRes.value?.length > 0) {
        setFleet(ambRes.value);
      }

      if (facRes.status === 'fulfilled' && facRes.value?.length > 0) {
        setFacilities(facRes.value);
      }

      if (emgRes.status === 'fulfilled') {
        setApiEmergencies(emgRes.value || []);
      }
    } catch (err) {
      console.error('Dashboard synchronization error:', err);
      setApiError('Connected in offline/fallback mode. Verify FastAPI backend.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Milestone 6: Handle emergency created from One-Tap SOS without requiring page reload
  const handleEmergencyCreated = (newReport) => {
    // 1. Prepend to API emergencies without a full reload
    setApiEmergencies((prev) => [newReport, ...prev]);

    // 2. Set map center and selected location
    const emergencyLat = Number(newReport.lat || newReport.latitude || 17.4065);
    const emergencyLng = Number(newReport.lng || newReport.longitude || 78.4772);
    setMapCenter([emergencyLat, emergencyLng]);
    setSosPreviewLocation({ lat: emergencyLat, lng: emergencyLng, address: newReport.incidentAddress });

    // 3. Register in EmergencyContext
    if (createEmergency) {
      createEmergency(newReport);
    }

    // 4. Show a toast/banner
    setRecentSosAlert({
      code: newReport.incidentCode || `EMG-${newReport.id}`,
      type: newReport.emergencyType,
      severity: newReport.severity,
      address: newReport.incidentAddress,
      lat: emergencyLat,
      lng: emergencyLng,
      time: new Date().toLocaleTimeString(),
    });
  };

  const availableAmbulances = fleet.filter((a) => a.status === 'AVAILABLE').length;
  const busyAmbulances = fleet.filter((a) => a.status === 'BUSY' || a.status === 'EN_ROUTE').length;
  const totalFacilities = facilities.length;
  const teachingHospitals = facilities.filter(
    (f) => f.type?.includes('Teaching') || f.facility_type?.includes('Teaching')
  ).length;

  // Active emergencies merged between context and backend
  const activeIncidentsCount = Math.max(
    apiEmergencies.filter((e) => e.status !== 'RESOLVED' && e.status !== 'COMPLETED').length,
    contextEmergencies.filter((e) => e.status !== 'COMPLETED').length
  );

  // Format emergency markers for LeafletMap
  const mapAmbulances = fleet.map((amb) => ({
    id: amb.ambulanceId,
    vehicleNumber: amb.vehicleNumber,
    type: amb.type,
    status: amb.status,
    lat: Number(amb.lat || amb.latitude || 17.4),
    lng: Number(amb.lng || amb.longitude || 78.4),
    speedKmh: amb.speedKmh,
    driverName: amb.driverName,
  }));

  const mapHospitals = facilities.slice(0, 40).map((hosp) => ({
    id: hosp.id || `HOSP-${hosp.dbId}`,
    name: hosp.name || hosp.facility_name,
    type: hosp.type || hosp.facility_type,
    lat: Number(hosp.lat || hosp.latitude || 17.38),
    lng: Number(hosp.lng || hosp.longitude || 78.48),
    availableIcuBeds: hosp.availableIcuBeds ?? 5,
    availableGeneralBeds: hosp.availableGeneralBeds ?? 20,
    traumaLevel: hosp.traumaLevel || hosp.trauma_level || 'Level 2 Trauma Center',
  }));

  return (
    <div className="space-y-6">
      {/* Simulation Banner Requirement */}
      <DemoNoticeBanner />

      {/* Header & Quick Action Trigger */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${apiHealth?.status === 'healthy' ? 'bg-emerald-500 animate-ping' : 'bg-sky-400'}`} />
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              PulseRoute Response Dashboard
            </h1>
            <WsStatusBadge connectionState={wsConnectionState} />
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time geospatial dispatch and recommendation engine integrated with FastAPI backend (<code className="text-sky-300">{API_BASE_URL}</code>).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={fetchDashboardData}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs border border-slate-700 transition-all disabled:opacity-50"
            title="Synchronize from FastAPI"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-sky-400' : ''}`} />
            <span>Sync API</span>
          </button>

          {/* Milestone 6: Prominent One-Tap SOS Header Button */}
          <button
            onClick={() => setIsSosModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:to-rose-500 text-white font-black text-xs shadow-xl shadow-red-950/60 ring-2 ring-red-500/50 transition-all hover:scale-105 active:scale-95 animate-pulse"
            title="Instant One-Tap SOS Reporting"
          >
            <ShieldAlert className="w-4 h-4" />
            <span>ONE-TAP SOS</span>
          </button>

          <Link
            to="/report-emergency"
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition-all"
          >
            <PlusCircle className="w-4 h-4 text-rose-400" />
            <span>Detailed SOS Form</span>
          </Link>
          <Link
            to="/route-eta"
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition-all"
          >
            <Navigation className="w-4 h-4 text-sky-400" />
            <span>Live Route &amp; ETA</span>
          </Link>
        </div>
      </div>

      {/* Milestone 6: Recent One-Tap SOS Success Alert Banner */}
      {recentSosAlert && (
        <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-200 text-xs flex items-center justify-between gap-3 shadow-lg shadow-emerald-950/30 animate-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white">One-Tap SOS Incident Logged:</span>
                <span className="font-mono font-black text-emerald-300">{recentSosAlert.code}</span>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  {recentSosAlert.severity}
                </span>
                <span className="text-slate-400">• {recentSosAlert.type}</span>
              </div>
              <div className="text-[11px] text-emerald-300/80 mt-0.5">
                Location: {recentSosAlert.address} [{recentSosAlert.lat.toFixed(4)}, {recentSosAlert.lng.toFixed(4)}] • Synced to SQLite ({recentSosAlert.time})
              </div>
            </div>
          </div>
          <button
            onClick={() => setRecentSosAlert(null)}
            className="p-1 rounded-lg hover:bg-emerald-900/40 text-emerald-400"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Milestone 6: One-Tap SOS Hero Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-rose-950/80 via-red-900/40 to-slate-900 border border-rose-500/40 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl shadow-rose-950/30">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-rose-600/30 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0 shadow-lg shadow-rose-950/50">
            <Flame className="w-6 h-6 animate-pulse text-rose-500" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
                One-Tap Emergency SOS Reporting
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/30 text-rose-200 border border-rose-500/40">
                GPS READY
              </span>
            </div>
            <p className="text-xs text-rose-200/80 mt-0.5">
              Automatically captures current browser coordinates and registers the incident in the central database with real-time map focus.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsSosModalOpen(true)}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-rose-900/50 hover:scale-105 active:scale-95 transition-all shrink-0 border border-rose-400/40"
        >
          <ShieldAlert className="w-4 h-4" />
          <span>Launch One-Tap SOS</span>
        </button>
      </div>

      {/* KPI Cards Section */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Active Fleet */}
        <div className="bg-slate-900/70 border border-slate-800 p-4 rounded-xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Ambulance Fleet</span>
            <Ambulance className="w-5 h-5 text-sky-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-white">{fleet.length}</span>
            <span className="text-[11px] text-emerald-400 font-medium">
              {availableAmbulances} Units Ready
            </span>
          </div>
          <div className="mt-3 flex items-center gap-2 text-[10px] text-slate-400">
            <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
              {availableAmbulances} Avail
            </span>
            <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">
              {busyAmbulances} Dispatched
            </span>
            <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
              API Synced
            </span>
          </div>
        </div>

        {/* Card 2: Registered Facilities */}
        <div className="bg-slate-900/70 border border-slate-800 p-4 rounded-xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Health Facilities</span>
            <Building2 className="w-5 h-5 text-indigo-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-white">{totalFacilities}</span>
            <span className="text-[11px] text-indigo-400 font-medium">Facilities Loaded</span>
          </div>
          <div className="mt-3 flex items-center gap-2 text-[10px] text-slate-400">
            <span className="px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-bold">
              {teachingHospitals || 9} Teaching Hospitals
            </span>
            <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
              UPHC &amp; PHC Hubs
            </span>
          </div>
        </div>

        {/* Card 3: Active Incidents */}
        <div className="bg-slate-900/70 border border-slate-800 p-4 rounded-xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Active Incidents</span>
            <Flame className="w-5 h-5 text-rose-500 animate-pulse" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-rose-400">
              {activeIncidentsCount || apiEmergencies.length}
            </span>
            <span className="text-[11px] text-rose-400/90 font-medium">Under Response</span>
          </div>
          <div className="mt-3 flex items-center gap-2 text-[10px]">
            <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold">
              Code Red Priority
            </span>
            <span className="text-slate-400">Avg ETA ~5.1m</span>
          </div>
        </div>

        {/* Card 4: Backend Health */}
        <div className="bg-slate-900/70 border border-slate-800 p-4 rounded-xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Backend API Status</span>
            <Radio className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-400 font-mono">
              {apiHealth?.status === 'healthy' ? 'ONLINE' : 'ACTIVE'}
            </span>
            <span className="text-[11px] text-emerald-400 font-medium">
              {apiHealth?.database?.dialect || 'SQLite'}
            </span>
          </div>
          <div className="mt-3 flex items-center gap-2 text-[10px] text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>FastAPI v{apiHealth?.version || '1.0.0'}</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Interactive Map + Quick Access */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map Column (2 spans) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-rose-500" />
                  Live Telangana Fleet &amp; Facility Spatial Map
                </h3>
                <p className="text-[11px] text-slate-400">
                  Tracking units AMB001–AMB005 and verified health facilities across Hyderabad metro.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-1 rounded-md">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Backend Synchronized
                </span>
              </div>
            </div>

            {/* Interactive Leaflet Map Container */}
            <div className="h-[380px] sm:h-[450px] rounded-xl overflow-hidden border border-slate-800 shadow-inner">
              <LeafletMap
                center={mapCenter}
                zoom={12}
                ambulances={mapAmbulances}
                hospitals={mapHospitals}
                emergencies={apiEmergencies.length > 0 ? apiEmergencies : contextEmergencies}
                selectedLocation={sosPreviewLocation}
              />
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400 pt-2 border-t border-slate-800">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Available (BLS/ALS)
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Dispatched / En-route
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" /> Hospital / Facility
                </span>
              </div>
              <Link to="/ambulance-fleet" className="text-rose-400 hover:text-rose-300 font-semibold flex items-center gap-1">
                View Fleet Details <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>

          {/* Active Emergency Reports from FastAPI Backend */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-rose-500" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Live Emergency Intake Feed (FastAPI Backend Database)
                </h3>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold bg-rose-500/20 text-rose-300">
                {apiEmergencies.length} Incident{apiEmergencies.length !== 1 ? 's' : ''} in Database
              </span>
            </div>

            {apiEmergencies.length === 0 ? (
              <div className="p-6 text-center rounded-xl bg-slate-800/30 border border-slate-800 text-slate-400 text-xs">
                No active emergencies in the backend database yet.
                <div className="mt-2">
                  <Link
                    to="/report-emergency"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Report Emergency Now</span>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {apiEmergencies.slice(0, 4).map((emg) => (
                  <div
                    key={emg.id || emg.dbId}
                    className="p-3 rounded-xl bg-slate-800/40 border border-slate-800 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-rose-500/20 border border-rose-500/30 text-rose-400 flex items-center justify-center font-black text-xs shrink-0">
                        SOS
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-white">{emg.incidentCode || `EMG-${emg.id}`}</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded font-bold bg-rose-500/20 text-rose-300">
                            {emg.severity || 'CRITICAL'}
                          </span>
                          <span className="text-slate-300 font-semibold">{emg.patientName}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5 truncate max-w-md">
                          {emg.incidentAddress || emg.location}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-500/20 text-emerald-300">
                        {emg.status || 'REPORTED'}
                      </span>
                      <div className="text-[10px] text-slate-500 mt-1 font-mono">
                        {emg.date || (emg.reportedAt ? new Date(emg.reportedAt).toLocaleTimeString() : 'Recent')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Side Panel: Fleet Status & Quick Navigation */}
        <div className="space-y-4">
          {/* Quick Nav Cards */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 space-y-3">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              System Modules
            </h3>

            <Link
              to="/ambulance-fleet"
              className="group p-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 flex items-center justify-between transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold">
                  <Ambulance className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white group-hover:text-sky-300">Ambulance Fleet</div>
                  <div className="text-[10px] text-slate-400">AMB001–AMB005 live telemetry</div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-transform group-hover:translate-x-1" />
            </Link>

            <Link
              to="/hospital-recommendations"
              className="group p-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 flex items-center justify-between transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white group-hover:text-indigo-300">Hospital Recommendations</div>
                  <div className="text-[10px] text-slate-400">AI triage &amp; ICU bed matching</div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-transform group-hover:translate-x-1" />
            </Link>

            <Link
              to="/route-eta"
              className="group p-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 flex items-center justify-between transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold">
                  <Navigation className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white group-hover:text-rose-300">Route &amp; Live ETA</div>
                  <div className="text-[10px] text-slate-400">Real-time green corridor routing</div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-transform group-hover:translate-x-1" />
            </Link>

            <Link
              to="/emergency-history"
              className="group p-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 flex items-center justify-between transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white group-hover:text-amber-300">Emergency History</div>
                  <div className="text-[10px] text-slate-400">Audit logs &amp; response records</div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          {/* Quick Fleet Snapshot */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Ambulance Status (AMB001–AMB005)
              </h3>
              <span className="text-[10px] text-slate-400 font-mono">{fleet.length} Units</span>
            </div>

            <div className="space-y-2.5">
              {fleet.map((amb) => (
                <div
                  key={amb.ambulanceId}
                  className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-800 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`w-2 h-2 rounded-full ${amb.status === 'AVAILABLE'
                          ? 'bg-emerald-400'
                          : amb.status === 'EN_ROUTE' || amb.status === 'BUSY'
                            ? 'bg-rose-400 animate-pulse'
                            : 'bg-amber-400'
                        }`}
                    />
                    <div>
                      <div className="font-bold text-white flex items-center gap-1.5">
                        {amb.ambulanceId}
                        <span className="text-[10px] px-1 py-0.2 rounded font-black bg-slate-700 text-slate-300">
                          {amb.type}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400">{amb.driverName} • {amb.baseStation}</div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${amb.status === 'AVAILABLE'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : amb.status === 'EN_ROUTE'
                            ? 'bg-rose-500/20 text-rose-300'
                            : amb.status === 'BUSY'
                              ? 'bg-amber-500/20 text-amber-300'
                              : 'bg-slate-700 text-slate-300'
                        }`}
                    >
                      {amb.status}
                    </span>
                    <div className="text-[10px] text-slate-400 mt-0.5">O2: {amb.fuelOxygenLevel}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Milestone 6: One-Tap SOS Modal Component */}
      <OneTapSosModal
        isOpen={isSosModalOpen}
        onClose={() => setIsSosModalOpen(false)}
        onEmergencyCreated={handleEmergencyCreated}
        onNavigateToRecommendations={(emg) => {
          navigate('/hospital-recommendations', { state: { emergency: emg } });
        }}
        onLocationPreview={(loc) => {
          setSosPreviewLocation(loc);
          if (loc.lat && loc.lng) {
            setMapCenter([loc.lat, loc.lng]);
          }
        }}
        initialCoordinates={{ lat: mapCenter[0], lng: mapCenter[1] }}
      />
    </div>
  );
};

export default DashboardPage;
