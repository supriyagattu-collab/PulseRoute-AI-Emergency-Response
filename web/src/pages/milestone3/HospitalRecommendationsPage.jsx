import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Building2,
  Heart,
  Car,
  Activity,
  Baby,
  Layers,
  Flame,
  ShieldAlert,
  Search,
  Filter,
  MapPin,
  Clock,
  Bed,
  CheckCircle2,
  Phone,
  ArrowRight,
  Sparkles,
  Award,
  AlertCircle,
  RefreshCw,
  Loader2,
  Info,
  Stethoscope,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Map as MapIcon
} from 'lucide-react';
import { DemoNoticeBanner } from '../../components/common/DemoNoticeBanner';
import { EmptyState } from '../../components/common/EmptyState';
import { LeafletMap } from '../../components/common/LeafletMap';
import { HospitalDetailModal } from '../../components/hospital/HospitalDetailModal';
import { FacilityService, API_BASE_URL } from '../../services/api';
import { HEALTH_FACILITIES, recommendHospitals } from '../../data/pulseRouteData';

// Quick Landmark Presets for Geolocation Testing
const QUICK_LANDMARKS = [
  { name: 'Nampally Central / Abids', lat: 17.3980, lng: 78.4730 },
  { name: 'Charminar / Old City', lat: 17.3616, lng: 78.4747 },
  { name: 'HITEC City Cyber Towers', lat: 17.4504, lng: 78.3808 },
  { name: 'Secunderabad Junction', lat: 17.4399, lng: 78.4983 },
  { name: 'Banjara Hills Rd No. 1', lat: 17.4156, lng: 78.4350 },
];

export const HospitalRecommendationsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // If navigated from an active emergency or SOS, pick up its location/type
  const incomingEmergency = location.state?.emergency || null;

  const [selectedCondition, setSelectedCondition] = useState(
    incomingEmergency?.emergencyType?.toUpperCase() || incomingEmergency?.type?.toUpperCase() || 'CARDIAC'
  );
  const [districtFilter, setDistrictFilter] = useState('ALL');
  const [facilityTypeFilter, setFacilityTypeFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const [patientLocation, setPatientLocation] = useState({
    name: incomingEmergency?.incidentAddress || incomingEmergency?.location || 'Nampally Central / Abids',
    lat: Number(incomingEmergency?.lat || incomingEmergency?.latitude || 17.3980),
    lng: Number(incomingEmergency?.lng || incomingEmergency?.longitude || 78.4730),
  });

  const [gpsStatus, setGpsStatus] = useState('IDLE');
  const [gpsMessage, setGpsMessage] = useState(null);

  const [facilities, setFacilities] = useState([]);
  const [uniqueDistricts, setUniqueDistricts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Selected hospital for detail modal
  const [selectedHospitalForModal, setSelectedHospitalForModal] = useState(null);
  const [showAllResults, setShowAllResults] = useState(false);
  const [showScoringGuide, setShowScoringGuide] = useState(false);

  // Fetch facilities from FastAPI backend using transparent AI ranking
  const fetchRecommendations = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // 1. Try dedicated recommendations endpoint first
      let data = [];
      try {
        data = await FacilityService.getRecommendations({
          patient_lat: patientLocation.lat,
          patient_lng: patientLocation.lng,
          emergency_type: selectedCondition,
          limit: showAllResults ? 25 : 5,
        });
      } catch (recErr) {
        // Fallback to search endpoint with condition and coordinates
        data = await FacilityService.searchFacilities({
          q: searchQuery || undefined,
          district: districtFilter !== 'ALL' ? districtFilter : undefined,
          type: facilityTypeFilter !== 'ALL' ? facilityTypeFilter : undefined,
          patient_lat: patientLocation.lat,
          patient_lng: patientLocation.lng,
          condition: selectedCondition,
          limit: showAllResults ? 25 : 5,
        });
      }

      if (data && data.length > 0) {
        setFacilities(data);
        const dists = Array.from(new Set(data.map((f) => f.district).filter(Boolean)));
        if (dists.length > 0) setUniqueDistricts((prev) => Array.from(new Set([...prev, ...dists])));
      } else {
        // Fallback to local deterministic client-side calculation
        const fallbackRanked = recommendHospitals({
          patientLat: patientLocation.lat,
          patientLng: patientLocation.lng,
          severity: 'CRITICAL',
          condition: selectedCondition,
        });
        setFacilities(fallbackRanked.slice(0, showAllResults ? 25 : 5));
      }
    } catch (err) {
      console.error('Failed to load facilities from backend:', err);
      setError(err.friendlyMessage || 'Backend recommendations offline. Showing verified local records.');
      const fallbackRanked = recommendHospitals({
        patientLat: patientLocation.lat,
        patientLng: patientLocation.lng,
        severity: 'CRITICAL',
        condition: selectedCondition,
      });
      setFacilities(fallbackRanked.slice(0, showAllResults ? 25 : 5));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, [selectedCondition, patientLocation.lat, patientLocation.lng, showAllResults, districtFilter, facilityTypeFilter]);

  // Initial load of district options
  useEffect(() => {
    const defaultDistricts = Array.from(new Set(HEALTH_FACILITIES.map((f) => f.district).filter(Boolean)));
    setUniqueDistricts((prev) => Array.from(new Set([...prev, ...defaultDistricts])));
  }, []);

  const triggerBrowserGps = () => {
    if (!navigator.geolocation) {
      setGpsStatus('UNAVAILABLE');
      setGpsMessage('Browser does not support geolocation.');
      return;
    }
    setGpsStatus('ACQUIRING');
    setGpsMessage(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const latitude = Number(pos.coords.latitude.toFixed(6));
        const longitude = Number(pos.coords.longitude.toFixed(6));
        setPatientLocation({
          name: `Browser GPS Location (±${Math.round(pos.coords.accuracy)}m)`,
          lat: latitude,
          lng: longitude,
        });
        setGpsStatus('ACQUIRED');
        setGpsMessage(`GPS Acquired: ${latitude.toFixed(4)}°N, ${longitude.toFixed(4)}°E`);
      },
      (err) => {
        setGpsStatus('DENIED');
        if (err.code === err.PERMISSION_DENIED) {
          setGpsMessage('GPS Permission Denied. Please choose a landmark preset below.');
        } else {
          setGpsMessage(`GPS unavailable (${err.message}). Using manual coordinates.`);
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleSelectHospitalForRoute = (hosp) => {
    navigate('/route-eta', { state: { selectedHospital: hosp, patientLocation } });
  };

  // Top 5 and Best-ranked hospital
  const topHospitals = facilities.slice(0, 5);
  const bestHospital = topHospitals[0] || null;

  // Prepare hospital pins for Leaflet Map
  const mapHospitalMarkers = topHospitals.map((h, idx) => ({
    id: h.id || h.dbId,
    name: `#${idx + 1} ${h.name || h.facility_name}`,
    type: `${h.matchedSpecialty || 'General'} • Match: ${h.matchScore || 85}%`,
    lat: Number(h.lat || h.latitude),
    lng: Number(h.lng || h.longitude),
    availableIcuBeds: h.availableIcuBeds,
    availableGeneralBeds: h.availableGeneralBeds,
    traumaLevel: h.traumaLevel || 'Level 2 Trauma',
    distanceKm: h.distanceKm,
    etaMins: h.etaMins,
  }));

  const patientMapMarker = [
    {
      id: 'patient-loc',
      patientName: `Patient (${selectedCondition})`,
      incidentAddress: patientLocation.name,
      lat: patientLocation.lat,
      lng: patientLocation.lng,
      severity: 'CRITICAL',
      status: 'AWAITING_HOSPITAL',
    },
  ];

  return (
    <div className="space-y-6">
      <DemoNoticeBanner />

      {/* Main Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              AI Hospital Recommendation &amp; Ranking Engine
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Transparent multi-factor ranking matching emergency conditions with clinical specialties, Haversine distance, and verified ICU bed availability.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={fetchRecommendations}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs transition-colors disabled:opacity-50"
            title="Refresh recommendations from API"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Sync</span>
          </button>
          <button
            onClick={() => setShowScoringGuide(!showScoringGuide)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-950/60 hover:bg-indigo-900/60 border border-indigo-500/30 text-indigo-300 font-bold text-xs transition-colors"
          >
            <Info className="w-3.5 h-3.5" />
            <span>{showScoringGuide ? 'Hide' : 'Explain'} Scoring Logic</span>
          </button>
        </div>
      </div>

      {/* Transparent Scoring Logic Explanation Banner (Expandable) */}
      {showScoringGuide && (
        <div className="p-5 rounded-2xl bg-indigo-950/30 border border-indigo-500/30 text-xs text-indigo-200 space-y-3 animate-in slide-in-from-top-2">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-sm text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              Transparent Multi-Factor Hospital Scoring Algorithm (Total 100 Points)
            </h3>
            <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono font-bold">
              Formula: Specialty(35%) + Distance(30%) + Beds(20%) + Readiness(15%)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-1">
            <div className="p-3 rounded-xl bg-slate-900/70 border border-indigo-500/20">
              <div className="font-bold text-indigo-300 mb-1">1. Clinical Specialty (35%)</div>
              <p className="text-[11px] text-slate-300">
                Matches emergency condition to department: Cath Lab for Cardiac, Level 1 Apex Trauma/CT for Accident, CT scan for Stroke, OBGYN/NICU for Maternity.
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/70 border border-indigo-500/20">
              <div className="font-bold text-emerald-300 mb-1">2. Haversine Distance (30%)</div>
              <p className="text-[11px] text-slate-300">
                Distance $d$ calculated via great-circle Haversine formula: $\max(0, 30 \times (1 - d/25))$. Linear penalty beyond immediate vicinity.
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/70 border border-indigo-500/20">
              <div className="font-bold text-rose-300 mb-1">3. Bed Capacity (20%)</div>
              <p className="text-[11px] text-slate-300">
                Verified ICU availability (&gt;5 open beds = 15 pts, 1-5 = 10 pts, 0 = 0 pts) + General ward capacity. Unverified beds marked unknown.
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/70 border border-indigo-500/20">
              <div className="font-bold text-amber-300 mb-1">4. Service Readiness (15%)</div>
              <p className="text-[11px] text-slate-300">
                Tertiary Apex Teaching Hospitals receive 15 pts, 24/7 Urban Primary Health Centers receive 10 pts, Primary Health Posts receive 6 pts.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error Alert Banner */}
      {error && (
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3 text-xs text-amber-300">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchRecommendations}
            className="px-2.5 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 font-bold text-amber-200 transition-colors"
          >
            Retry API
          </button>
        </div>
      )}

      {/* Geolocation & Condition Parameter Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* Left 2 Spans: 5 Clinical Condition Selectors */}
        <div className="lg:col-span-2 bg-slate-900/70 border border-slate-800 p-4 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-rose-500" />
              1. Select Emergency Type &amp; Target Specialty:
            </span>
            <span className="text-[11px] text-indigo-300 font-bold">
              Target: {
                selectedCondition === 'CARDIAC' ? 'Cardiology' :
                selectedCondition === 'ACCIDENT' ? 'Emergency/Trauma' :
                selectedCondition === 'STROKE' ? 'Neurology' :
                selectedCondition === 'MATERNITY' ? 'Obstetrics/Gynecology' : 'General Medicine'
              }
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {[
              { id: 'CARDIAC', label: 'Cardiac', specialty: 'Cardiology', icon: Heart, color: 'text-rose-400' },
              { id: 'ACCIDENT', label: 'Accident', specialty: 'Emergency/Trauma', icon: Car, color: 'text-amber-400' },
              { id: 'STROKE', label: 'Stroke', specialty: 'Neurology', icon: Activity, color: 'text-purple-400' },
              { id: 'MATERNITY', label: 'Maternity', specialty: 'Obstetrics/Gyn', icon: Baby, color: 'text-pink-400' },
              { id: 'GENERAL', label: 'General', specialty: 'General Medicine', icon: Layers, color: 'text-sky-400' },
            ].map((item) => {
              const Icon = item.icon;
              const isSelected = selectedCondition === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedCondition(item.id)}
                  className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1.5 ${
                    isSelected
                      ? 'bg-indigo-600 text-white border-indigo-400 shadow-lg shadow-indigo-950/60 font-bold ring-2 ring-indigo-400/50'
                      : 'bg-slate-800/40 border-slate-700/60 text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isSelected ? 'text-white' : item.color}`} />
                  <span className="text-xs font-bold">{item.label}</span>
                  <span className={`text-[10px] truncate max-w-full ${isSelected ? 'text-indigo-200' : 'text-slate-400'}`}>
                    → {item.specialty}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right 1 Span: Patient GPS Coordinate Setter */}
        <div className="bg-slate-900/70 border border-slate-800 p-4 rounded-2xl space-y-2.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-rose-400" />
              2. Patient GPS Location:
            </span>
            <button
              onClick={triggerBrowserGps}
              disabled={gpsStatus === 'ACQUIRING'}
              className="text-[11px] font-bold text-sky-400 hover:text-sky-300 flex items-center gap-1"
            >
              <RefreshCw className={`w-3 h-3 ${gpsStatus === 'ACQUIRING' ? 'animate-spin' : ''}`} />
              <span>Detect GPS</span>
            </button>
          </div>

          <div className="text-[11px] text-slate-300 truncate font-semibold">
            {patientLocation.name}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-slate-400 block mb-0.5">Latitude</label>
              <input
                type="number"
                step="0.0001"
                value={patientLocation.lat}
                onChange={(e) => setPatientLocation({ ...patientLocation, lat: parseFloat(e.target.value) || 0 })}
                className="w-full px-2 py-1 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono text-xs"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 block mb-0.5">Longitude</label>
              <input
                type="number"
                step="0.0001"
                value={patientLocation.lng}
                onChange={(e) => setPatientLocation({ ...patientLocation, lng: parseFloat(e.target.value) || 0 })}
                className="w-full px-2 py-1 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono text-xs"
              />
            </div>
          </div>

          {/* Quick Landmarks Pick */}
          <div className="pt-1.5 border-t border-slate-800 flex flex-wrap gap-1">
            {QUICK_LANDMARKS.map((lm) => (
              <button
                key={lm.name}
                type="button"
                onClick={() => setPatientLocation({ name: lm.name, lat: lm.lat, lng: lm.lng })}
                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-300 border border-slate-700 truncate"
              >
                {lm.name.split('/')[0]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content Layout: Top 5 Hospital Recommendations + Interactive Map */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Top 5 Recommendations Cards (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-indigo-400" />
              <h2 className="text-sm font-black text-white uppercase tracking-wider">
                Top 5 Recommended Hospitals for {selectedCondition}
              </h2>
            </div>
            <span className="text-[11px] px-2 py-0.5 rounded-full font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Ranked by AI Match Score
            </span>
          </div>

          {/* Loading Indicator */}
          {isLoading && (
            <div className="p-12 text-center rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
              <div className="text-sm font-bold text-white">Ranking Telangana Hospitals...</div>
              <div className="text-xs text-slate-400">Evaluating Haversine distances &amp; clinical capabilities</div>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && topHospitals.length === 0 && (
            <EmptyState
              icon={Building2}
              title="No Suitable Hospitals Located"
              description="No healthcare facilities matched your location within the service threshold."
              actionText="Reset to Hyderabad Center"
              onAction={() => setPatientLocation(QUICK_LANDMARKS[0])}
            />
          )}

          {/* Cards List */}
          {!isLoading && topHospitals.length > 0 && (
            <div className="space-y-3.5">
              {topHospitals.map((hosp, idx) => {
                const isBestRanked = idx === 0;
                return (
                  <div
                    key={hosp.id || hosp.dbId || idx}
                    className={`p-5 rounded-2xl border transition-all ${
                      isBestRanked
                        ? 'bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border-indigo-500/60 shadow-xl shadow-indigo-950/40 ring-1 ring-indigo-400/40'
                        : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {/* Top Row: Rank, Name, Best Badge */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        {/* Rank Badge */}
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0 shadow-md ${
                          isBestRanked
                            ? 'bg-indigo-600 text-white ring-2 ring-indigo-400/50'
                            : 'bg-slate-800 text-slate-300 border border-slate-700'
                        }`}>
                          #{idx + 1}
                        </div>

                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-base font-black text-white tracking-tight">
                              {hosp.name || hosp.facility_name}
                            </h3>
                            {isBestRanked && (
                              <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                                <Award className="w-3 h-3 text-indigo-400" />
                                BEST RANKED
                              </span>
                            )}
                          </div>

                          <div className="text-xs text-slate-400 mt-0.5 flex flex-wrap items-center gap-2">
                            <span>{hosp.type || hosp.facility_type}</span>
                            <span>•</span>
                            <span className="text-slate-300 truncate max-w-xs">{hosp.address || `${hosp.mandal || ''}, ${hosp.district}`}</span>
                          </div>
                        </div>
                      </div>

                      {/* Match Score Badge */}
                      <div className="text-right shrink-0">
                        <div className="px-3 py-1 rounded-xl bg-indigo-950/60 border border-indigo-500/40 text-center">
                          <span className="text-[10px] font-bold text-indigo-300 block uppercase">Score</span>
                          <span className="text-base font-black text-white">{hosp.matchScore || 85}%</span>
                        </div>
                      </div>
                    </div>

                    {/* Middle Row: Distance, Verified Beds, Specialty */}
                    <div className="grid grid-cols-3 gap-2 mt-3.5 pt-3 border-t border-slate-800/80 text-xs">
                      <div className="p-2 rounded-xl bg-slate-800/40 border border-slate-800">
                        <span className="text-[10px] text-slate-400 font-bold block">Haversine Distance</span>
                        <span className="text-sm font-black text-emerald-400 font-mono">
                          {hosp.distanceKm !== undefined && hosp.distanceKm !== null ? `${hosp.distanceKm} km` : 'Near'}
                        </span>
                        <span className="text-[10px] text-slate-500 block">~{hosp.etaMins}m ETA</span>
                      </div>

                      <div className="p-2 rounded-xl bg-slate-800/40 border border-slate-800">
                        <span className="text-[10px] text-slate-400 font-bold block">ICU Bed Status</span>
                        <span className="text-sm font-black text-rose-400">
                          {hosp.availableIcuBeds} <span className="text-xs text-slate-500 font-normal">/ {hosp.totalIcuBeds}</span>
                        </span>
                        <span className="text-[10px] text-slate-500 block">Verified ICU</span>
                      </div>

                      <div className="p-2 rounded-xl bg-slate-800/40 border border-slate-800">
                        <span className="text-[10px] text-slate-400 font-bold block">Matched Specialty</span>
                        <span className="text-xs font-bold text-indigo-300 truncate block mt-0.5">
                          {hosp.matchedSpecialty || 'Clinical Care'}
                        </span>
                        <span className="text-[10px] text-slate-500 block">35% Weight</span>
                      </div>
                    </div>

                    {/* Match Reasons Tags */}
                    {hosp.matchReasons?.length > 0 && (
                      <div className="mt-2.5 flex flex-wrap gap-1.5">
                        {hosp.matchReasons.slice(0, 3).map((reason, rIdx) => (
                          <span
                            key={rIdx}
                            className="px-2 py-0.5 rounded-md bg-emerald-950/40 border border-emerald-500/20 text-emerald-300 text-[10px] font-semibold"
                          >
                            ✓ {reason}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Bottom Action Buttons */}
                    <div className="mt-4 flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800/80">
                      <button
                        onClick={() => setSelectedHospitalForModal({ ...hosp, isTopRanked: isBestRanked })}
                        className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition-colors flex items-center gap-1.5"
                      >
                        <Info className="w-3.5 h-3.5 text-indigo-400" />
                        <span>View Details &amp; Breakdown</span>
                      </button>

                      <button
                        onClick={() => handleSelectHospitalForRoute(hosp)}
                        className={`px-4 py-2 rounded-xl font-black text-xs shadow-md transition-all flex items-center gap-1.5 ${
                          isBestRanked
                            ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-950/50 hover:scale-105'
                            : 'bg-slate-800 hover:bg-indigo-600 text-slate-200 hover:text-white border border-slate-700'
                        }`}
                      >
                        <span>Select &amp; Route Here</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Spatial Map & Overview (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <MapIcon className="w-4 h-4 text-rose-500" />
                Hospital Spatial Distribution
              </h3>
              <span className="text-[10px] text-slate-400">
                Centered at Patient GPS
              </span>
            </div>

            {/* Interactive Leaflet Map showing Patient and Top 5 Hospitals */}
            <div className="h-[360px] sm:h-[420px] rounded-xl overflow-hidden border border-slate-800 shadow-inner">
              <LeafletMap
                center={[patientLocation.lat, patientLocation.lng]}
                zoom={12}
                hospitals={mapHospitalMarkers}
                emergencies={patientMapMarker}
                selectedLocation={{ lat: patientLocation.lat, lng: patientLocation.lng }}
              />
            </div>

            {/* Map Legend */}
            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" /> Patient Location
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" /> Recommended Hospital
                </span>
              </div>
              <span className="text-slate-500 text-[10px]">Haversine Formula</span>
            </div>
          </div>

          {/* Quick Best Pick Summary Card */}
          {bestHospital && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-950/40 via-slate-900 to-indigo-950/30 border border-indigo-500/40 space-y-2">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-black text-white uppercase">
                  AI Recommendation Summary
                </span>
              </div>
              <p className="text-xs text-slate-300">
                <strong className="text-white">{bestHospital.name || bestHospital.facility_name}</strong> is ranked highest ({bestHospital.matchScore}%) for <strong>{selectedCondition}</strong> due to verified {bestHospital.matchedSpecialty} facilities, {bestHospital.availableIcuBeds} available ICU beds, and proximity ({bestHospital.distanceKm} km, ~{bestHospital.etaMins} mins ETA).
              </p>
            </div>
          )}
        </div>

      </div>

      {/* Hospital Detail Modal with Full Scoring Breakdown */}
      <HospitalDetailModal
        hospital={selectedHospitalForModal}
        isOpen={!!selectedHospitalForModal}
        onClose={() => setSelectedHospitalForModal(null)}
        onSelectRoute={handleSelectHospitalForRoute}
        patientLocation={patientLocation}
        emergencyType={selectedCondition}
      />

    </div>
  );
};

export default HospitalRecommendationsPage;
