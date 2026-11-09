import React, { useState, useEffect, useRef } from 'react';
import { useLocation, Link } from 'react-router-dom';
import {
  Navigation,
  Ambulance,
  Building2,
  Clock,
  Gauge,
  Heart,
  Activity,
  Play,
  Pause,
  RotateCcw,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Phone,
  Radio,
  MapPin,
  RefreshCw,
  Loader2,
  Share2,
} from 'lucide-react';
import { LeafletMap } from '../../components/common/LeafletMap';
import { DemoNoticeBanner } from '../../components/common/DemoNoticeBanner';
import { AMBULANCES_DEMO, HEALTH_FACILITIES } from '../../data/pulseRouteData';
import { AmbulanceService, FacilityService } from '../../services/api';
import { fetchRoadRoute } from '../../services/routingService';

export const RouteEtaPage = () => {
  const location = useLocation();

  const [fleet, setFleet] = useState(AMBULANCES_DEMO);
  const [facilities, setFacilities] = useState(HEALTH_FACILITIES);
  const [isLoading, setIsLoading] = useState(true);

  // Selected ambulance and hospital from navigation state or defaults
  const [selectedAmbulanceId, setSelectedAmbulanceId] = useState('AMB001');
  const [selectedHospitalId, setSelectedHospitalId] = useState(
    location.state?.selectedHospital?.id || 'HOSP-5120' // Osmania General
  );

  // Routing State (Milestone 8.1 FIX 3: Road Network Routing)
  const [routeResult, setRouteResult] = useState({
    coordinates: [],
    distanceKm: 4.8,
    durationMinutes: 6,
    isRoadNetwork: false,
    provider: 'Calculating road route...',
    fallbackReason: null,
  });
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);

  // GPS Backend Synchronization State (Milestone 8.1 FIX 4)
  const [syncStatus, setSyncStatus] = useState('IDLE'); // 'SYNCING' | 'SYNCED' | 'OFFLINE'
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const lastSyncTimestampRef = useRef(0);

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      try {
        const [ambData, facData] = await Promise.allSettled([
          AmbulanceService.getAmbulances(),
          FacilityService.getFacilities({ limit: 100 }),
        ]);

        if (isMounted) {
          if (ambData.status === 'fulfilled' && ambData.value?.length > 0) {
            setFleet(ambData.value);
            if (!selectedAmbulanceId) setSelectedAmbulanceId(ambData.value[0].ambulanceId);
          }
          if (facData.status === 'fulfilled' && facData.value?.length > 0) {
            setFacilities(facData.value);
            if (!location.state?.selectedHospital && facData.value[0]?.id) {
              setSelectedHospitalId(facData.value[0].id);
            }
          }
        }
      } catch (err) {
        console.warn('Route tracker using local fallback dataset:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  const activeAmbulance =
    fleet.find((a) => a.ambulanceId === selectedAmbulanceId || a.id === selectedAmbulanceId) ||
    fleet[0] ||
    AMBULANCES_DEMO[0];

  const activeHospital =
    facilities.find((h) => h.id === selectedHospitalId || h.dbId === selectedHospitalId) ||
    facilities[0] ||
    HEALTH_FACILITIES[0];

  // Incident location (Nampally Station area)
  const patientLocation = {
    address: 'Nampally Station Road, Abids, Hyderabad',
    lat: 17.3980,
    lng: 78.4730,
  };

  // Route Simulation State
  const [isPlaying, setIsPlaying] = useState(true);
  const [progressPct, setProgressPct] = useState(24);
  const [speedMultiplier, setSpeedMultiplier] = useState(1);
  const [etaSeconds, setEtaSeconds] = useState(320);
  const [vehicleSpeed, setVehicleSpeed] = useState(52);

  // Vitals simulation
  const [vitals, setVitals] = useState({
    heartRate: 88,
    spo2: 97,
    bpSys: 124,
    bpDia: 82,
  });

  // Calculate road-network route on ambulance/hospital change
  useEffect(() => {
    let isMounted = true;
    const calculateRoute = async () => {
      setIsLoadingRoute(true);
      const waypoints = [
        { lat: Number(activeAmbulance.lat || 17.3985), lng: Number(activeAmbulance.lng || 78.4735) },
        { lat: patientLocation.lat, lng: patientLocation.lng },
        {
          lat: Number(activeHospital.lat || activeHospital.latitude || 17.3744),
          lng: Number(activeHospital.lng || activeHospital.longitude || 78.4745),
        },
      ];

      const res = await fetchRoadRoute(waypoints);
      if (isMounted) {
        setRouteResult(res);
        setEtaSeconds(res.durationMinutes * 60);
        setIsLoadingRoute(false);
      }
    };

    calculateRoute();
    return () => {
      isMounted = false;
    };
  }, [selectedAmbulanceId, selectedHospitalId, fleet, facilities]);

  // Calculate moving coordinates along the road route geometry
  const routeCoords = routeResult.coordinates && routeResult.coordinates.length > 1
    ? routeResult.coordinates
    : [
        [Number(activeAmbulance.lat || 17.3985), Number(activeAmbulance.lng || 78.4735)],
        [patientLocation.lat, patientLocation.lng],
        [Number(activeHospital.lat || 17.3744), Number(activeHospital.lng || 78.4745)],
      ];

  const coordIndex = Math.min(
    routeCoords.length - 1,
    Math.max(0, Math.floor((progressPct / 100) * (routeCoords.length - 1)))
  );

  const currentLat = routeCoords[coordIndex] ? routeCoords[coordIndex][0] : Number(activeAmbulance.lat || 17.3985);
  const currentLng = routeCoords[coordIndex] ? routeCoords[coordIndex][1] : Number(activeAmbulance.lng || 78.4735);

  // Simulation timer
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setProgressPct((prev) => {
        if (prev >= 100) {
          setIsPlaying(false);
          return 100;
        }
        return Math.min(100, prev + 0.8 * speedMultiplier);
      });

      setEtaSeconds((prev) => Math.max(0, prev - Math.round(1.5 * speedMultiplier)));

      setVehicleSpeed(Math.floor(48 + Math.random() * 12));
      setVitals((prev) => ({
        ...prev,
        heartRate: Math.floor(86 + Math.random() * 5),
        spo2: Math.min(99, Math.floor(96 + Math.random() * 3)),
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlaying, speedMultiplier]);

  // Periodic GPS backend sync (Milestone 8.1 FIX 4: Throttled every ~8 seconds to avoid flooding)
  useEffect(() => {
    if (!isPlaying) return;
    const now = Date.now();
    if (now - lastSyncTimestampRef.current < 8000) return;

    lastSyncTimestampRef.current = now;
    const ambDbId = activeAmbulance.dbId || (typeof activeAmbulance.id === 'number' ? activeAmbulance.id : 1);

    setSyncStatus('SYNCING');
    AmbulanceService.updateLocation(ambDbId, {
      latitude: Number(currentLat.toFixed(5)),
      longitude: Number(currentLng.toFixed(5)),
      speed_kmh: vehicleSpeed,
    })
      .then(() => {
        setLastSyncTime(new Date().toLocaleTimeString());
        setSyncStatus('SYNCED');
      })
      .catch((err) => {
        console.warn('GPS location sync note:', err.friendlyMessage || err);
        setSyncStatus('OFFLINE');
      });
  }, [Math.floor(progressPct / 5), isPlaying, currentLat, currentLng, vehicleSpeed, activeAmbulance]);

  const handleReset = () => {
    setProgressPct(0);
    setEtaSeconds(routeResult.durationMinutes * 60 || 360);
    setIsPlaying(true);
  };

  const getTripPhase = () => {
    if (progressPct < 45) return { label: 'EN ROUTE TO PATIENT', color: 'rose' };
    if (progressPct < 60) return { label: 'ON SCENE (TRIAGE & PICKUP)', color: 'amber' };
    if (progressPct < 100) return { label: 'TRANSPORTING TO TRAUMA CENTER', color: 'indigo' };
    return { label: 'ARRIVED AT HOSPITAL', color: 'emerald' };
  };

  const phase = getTripPhase();

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const mapAmbulanceMarker = [
    {
      id: activeAmbulance.ambulanceId || activeAmbulance.id,
      vehicleNumber: activeAmbulance.vehicleNumber,
      type: activeAmbulance.type,
      status: 'EN_ROUTE',
      lat: currentLat,
      lng: currentLng,
      speedKmh: vehicleSpeed,
      driverName: activeAmbulance.driverName,
    },
  ];

  const mapHospitalMarker = [
    {
      id: activeHospital.id || `HOSP-${activeHospital.dbId}`,
      name: activeHospital.name || activeHospital.facility_name,
      type: activeHospital.type || activeHospital.facility_type,
      lat: Number(activeHospital.lat || activeHospital.latitude || 17.37),
      lng: Number(activeHospital.lng || activeHospital.longitude || 78.47),
      availableIcuBeds: activeHospital.availableIcuBeds ?? 5,
      availableGeneralBeds: activeHospital.availableGeneralBeds ?? 20,
      traumaLevel: activeHospital.traumaLevel || activeHospital.trauma_level || 'Level 2 Trauma Center',
    },
  ];

  return (
    <div className="space-y-6">
      <DemoNoticeBanner />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Live Route &amp; Dynamic Road Telemetry
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            OSRM road network routing with Haversine fallback, real-time telemetry, and SQLite GPS synchronization.
          </p>
        </div>

        {/* Phase & Routing Mode Pill */}
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`text-xs font-black px-3.5 py-1.5 rounded-xl border flex items-center gap-2 ${
              phase.color === 'emerald'
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : phase.color === 'amber'
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-current" />
            {phase.label}
          </span>

          <span
            className={`text-xs font-bold px-3 py-1.5 rounded-xl border flex items-center gap-1.5 ${
              routeResult.isRoadNetwork
                ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${routeResult.isRoadNetwork ? 'bg-sky-400' : 'bg-amber-400'}`} />
            {routeResult.isRoadNetwork ? 'OSRM Road Snapped' : 'Haversine Fallback'}
          </span>
        </div>
      </div>

      {/* Selectors for Unit & Hospital */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-900/70 p-4 rounded-xl border border-slate-800">
        <div>
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Active Ambulance Unit (AMB001–AMB005)
          </label>
          <select
            value={selectedAmbulanceId}
            onChange={(e) => setSelectedAmbulanceId(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500 font-semibold"
          >
            {fleet.map((a) => (
              <option key={a.ambulanceId || a.id} value={a.ambulanceId || a.id}>
                {a.ambulanceId} ({a.type}) — {a.vehicleNumber} [{a.driverName} • {a.baseStation}]
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Destination Facility (From Healthcare Facilities API)
          </label>
          <select
            value={selectedHospitalId}
            onChange={(e) => setSelectedHospitalId(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500 font-semibold"
          >
            {facilities.slice(0, 50).map((h) => (
              <option key={h.id || h.dbId} value={h.id || h.dbId}>
                {h.name || h.facility_name} [{h.type || h.facility_type} • {h.availableIcuBeds || 5} ICU Beds]
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Telemetry Dashboard HUD Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Dynamic ETA */}
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl relative overflow-hidden">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-emerald-400" /> Dynamic ETA
          </span>
          <div className="text-2xl sm:text-3xl font-black text-emerald-400 mt-2 font-mono">
            {formatTime(etaSeconds)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {routeResult.isRoadNetwork ? 'Road-network transit' : 'Estimated transit (fallback)'}
          </div>
        </div>

        {/* Road Distance & Routing Provider */}
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl relative overflow-hidden">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-sky-400" /> Road Distance
          </span>
          <div className="text-2xl sm:text-3xl font-black text-sky-400 mt-2 font-mono">
            {routeResult.distanceKm} <span className="text-sm font-normal text-slate-400">km</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1 truncate" title={routeResult.provider}>
            {routeResult.provider}
          </div>
        </div>

        {/* Vehicle Speed */}
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl relative overflow-hidden">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Gauge className="w-3.5 h-3.5 text-amber-400" /> Speed &amp; Siren
          </span>
          <div className="text-2xl sm:text-3xl font-black text-amber-400 mt-2 font-mono">
            {vehicleSpeed} <span className="text-sm font-normal text-slate-400">km/h</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Siren &amp; Strobe Engaged</div>
        </div>

        {/* GPS Sync Status (Milestone 8.1 FIX 4) */}
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl relative overflow-hidden">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-indigo-400" /> SQLite GPS Sync
          </span>
          <div className="text-sm sm:text-base font-black text-white mt-2 font-mono truncate">
            {currentLat.toFixed(4)}°, {currentLng.toFixed(4)}°
          </div>
          <div className="text-[11px] mt-1 flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full ${
                syncStatus === 'SYNCED'
                  ? 'bg-emerald-400'
                  : syncStatus === 'SYNCING'
                  ? 'bg-sky-400 animate-spin'
                  : 'bg-amber-400'
              }`}
            />
            <span className="text-slate-300">
              {syncStatus === 'SYNCED'
                ? `Saved to SQLite (${lastSyncTime || 'Now'})`
                : syncStatus === 'SYNCING'
                ? 'Syncing to backend...'
                : 'Simulated tracking pulse'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Live Map + Simulation Controller */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map Column */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4">
            <div className="h-[400px] sm:h-[460px] rounded-xl overflow-hidden border border-slate-800 shadow-inner">
              <LeafletMap
                center={[currentLat, currentLng]}
                zoom={14}
                ambulances={mapAmbulanceMarker}
                hospitals={mapHospitalMarker}
                routeCoordinates={routeCoords}
                isRoadNetwork={routeResult.isRoadNetwork}
                routingProvider={routeResult.provider}
              />
            </div>

            {/* Simulation Playback Bar */}
            <div className="mt-4 p-3 bg-slate-800/60 rounded-xl border border-slate-700/80 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="p-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold transition-all"
                  title={isPlaying ? 'Pause' : 'Play'}
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>
                <button
                  onClick={handleReset}
                  className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 font-bold transition-all"
                  title="Reset Route"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-1 ml-2 text-xs font-bold text-slate-400">
                  <span>Speed:</span>
                  {[1, 2, 5].map((spd) => (
                    <button
                      key={spd}
                      onClick={() => setSpeedMultiplier(spd)}
                      className={`px-2 py-0.5 rounded text-[11px] ${
                        speedMultiplier === spd ? 'bg-sky-600 text-white' : 'bg-slate-700 text-slate-300'
                      }`}
                    >
                      {spd}x
                    </button>
                  ))}
                </div>
              </div>

              {/* Progress Slider */}
              <div className="flex-1 max-w-xs min-w-[140px] flex items-center gap-2 text-xs text-slate-400">
                <span className="font-mono text-[11px]">{progressPct.toFixed(0)}%</span>
                <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-rose-500 to-emerald-400 transition-all duration-300"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Side Panel: Turn-by-Turn Steps & Hospital Handoff */}
        <div className="space-y-4">
          {/* Navigation Steps */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 space-y-3">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Navigation className="w-4 h-4 text-rose-500" />
                Turn-by-Turn Waypoint Stream
              </span>
              <span className="text-[10px] text-slate-500 lowercase font-mono">
                {routeResult.isRoadNetwork ? 'OSRM active' : 'fallback mode'}
              </span>
            </h3>

            <div className="space-y-2.5 text-xs">
              {[
                { step: '1', instruction: `Depart base hub: ${activeAmbulance.baseStation || 'Central Hub'}`, dist: '0.4 km', done: progressPct > 15 },
                { step: '2', instruction: 'Take arterial corridor towards Nampally route', dist: '1.8 km', done: progressPct > 35 },
                { step: '3', instruction: `Arrive at scene: ${patientLocation.address}`, dist: '0.0 km', done: progressPct >= 50 },
                { step: '4', instruction: 'Patient secured; Initiate transit to trauma center', dist: `${Math.round(routeResult.distanceKm * 0.6 * 10) / 10} km`, done: progressPct > 65 },
                { step: '5', instruction: `Enter emergency bay: ${activeHospital.name || activeHospital.facility_name}`, dist: '0.2 km', done: progressPct >= 95 },
              ].map((s) => (
                <div
                  key={s.step}
                  className={`p-2.5 rounded-xl border flex items-start gap-2.5 transition-all ${
                    s.done
                      ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
                      : 'bg-slate-800/40 border-slate-800 text-slate-300'
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                      s.done ? 'bg-emerald-500 text-slate-950' : 'bg-slate-700 text-slate-300'
                    }`}
                  >
                    {s.step}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-white leading-tight">{s.instruction}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{s.dist}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Hospital Readiness Card */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 space-y-2.5 text-xs">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-indigo-400" />
              Hospital Receiving Team Alerted
            </h3>

            <div className="p-3 rounded-xl bg-indigo-950/30 border border-indigo-500/30">
              <div className="font-bold text-indigo-200 text-sm">{activeHospital.name || activeHospital.facility_name}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">{activeHospital.address}</div>
              <div className="mt-2 flex items-center justify-between text-[11px] text-emerald-400 font-semibold pt-2 border-t border-indigo-900/60">
                <span>ICU Beds: {activeHospital.availableIcuBeds || 5} Open</span>
                <span>Trauma Team: Standby</span>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1">
                <Phone className="w-3.5 h-3.5" /> Emergency Desk:
              </span>
              <span className="font-mono text-white font-bold">{activeHospital.emergencyPhone || activeHospital.emergency_phone || '040-24600121'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RouteEtaPage;
