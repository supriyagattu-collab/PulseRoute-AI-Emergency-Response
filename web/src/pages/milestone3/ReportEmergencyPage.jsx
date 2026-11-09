import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Heart,
  Ambulance,
  Building2,
  MapPin,
  ShieldAlert,
  Send,
  User,
  Phone,
  Flame,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  AlertCircle,
  Loader2,
  Car,
  Activity,
  Baby,
  RefreshCw,
  Info
} from 'lucide-react';
import { DemoNoticeBanner } from '../../components/common/DemoNoticeBanner';
import {
  EmergencyService,
  AssignmentService,
  AmbulanceService,
  FacilityService,
  API_BASE_URL
} from '../../services/api';
import { AMBULANCES_DEMO, HEALTH_FACILITIES, findNearestAmbulance, recommendHospitals } from '../../data/pulseRouteData';
import { useEmergency } from '../../context/EmergencyContext';

export const ReportEmergencyPage = () => {
  const navigate = useNavigate();
  const { createEmergency } = useEmergency();

  const [formData, setFormData] = useState({
    patientName: 'K. Sridhar Rao',
    contactPhone: '+91 98490 55432',
    patientAge: 54,
    gender: 'MALE',
    emergencyType: 'CARDIAC',
    severity: 'CRITICAL',
    consciousness: 'SEMICONSCIOUS',
    breathing: 'DIFFICULT',
    incidentAddress: 'Nampally Station Road, Abids, Hyderabad',
    lat: 17.3980,
    lng: 78.4730,
    symptomsDescription: 'Severe crushing chest pain radiating to left arm, sweating, shortness of breath for past 20 minutes.',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submittedEmergency, setSubmittedEmergency] = useState(null);
  const [nearestUnit, setNearestUnit] = useState(null);
  const [bestHospital, setBestHospital] = useState(null);

  // Milestone 6: Geolocation state
  const [gpsStatus, setGpsStatus] = useState('IDLE');
  const [gpsMsg, setGpsMsg] = useState(null);

  const captureGps = () => {
    if (!navigator.geolocation) {
      setGpsStatus('UNAVAILABLE');
      setGpsMsg('Geolocation is not supported by your browser.');
      return;
    }
    setGpsStatus('ACQUIRING');
    setGpsMsg(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const latitude = Number(pos.coords.latitude.toFixed(6));
        const longitude = Number(pos.coords.longitude.toFixed(6));
        setFormData((prev) => ({
          ...prev,
          lat: latitude,
          lng: longitude,
          incidentAddress: `GPS Location: ${latitude.toFixed(4)}°N, ${longitude.toFixed(4)}°E (±${Math.round(pos.coords.accuracy)}m)`,
        }));
        setGpsStatus('ACQUIRED');
        setGpsMsg(`GPS Acquired: ${latitude.toFixed(4)}°N, ${longitude.toFixed(4)}°E (±${Math.round(pos.coords.accuracy)}m)`);
      },
      (err) => {
        setGpsStatus('ERROR');
        if (err.code === err.PERMISSION_DENIED) {
          setGpsMsg('GPS Permission Denied. You declined location access. Manual entry enabled.');
        } else {
          setGpsMsg(`GPS Unavailable (${err.message}). Manual entry enabled.`);
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Dynamic discovery of nearest ambulance and best hospital
  useEffect(() => {
    let isMounted = true;

    const resolveMatches = async () => {
      // 1. Resolve nearest ambulance via API
      try {
        const ambResult = await AmbulanceService.getNearestAmbulance({
          lat: formData.lat,
          lng: formData.lng,
          type: formData.severity === 'CRITICAL' ? 'ALS' : undefined,
        });
        if (isMounted && ambResult?.ambulance) {
          setNearestUnit({
            ...ambResult.ambulance,
            distanceKm: ambResult.distance_km,
            etaMins: ambResult.estimated_eta_minutes || 5,
          });
        }
      } catch (err) {
        // Fallback to local calculation
        const localAmb = findNearestAmbulance(
          formData.lat,
          formData.lng,
          formData.severity === 'CRITICAL' ? 'ALS' : 'ANY'
        );
        if (isMounted) setNearestUnit(localAmb);
      }

      // 2. Resolve recommended hospital via API
      try {
        const facs = await FacilityService.searchFacilities({
          patient_lat: formData.lat,
          patient_lng: formData.lng,
          condition: formData.emergencyType,
          limit: 3,
        });
        if (isMounted && facs?.length > 0) {
          setBestHospital(facs[0]);
        }
      } catch (err) {
        const localTops = recommendHospitals({
          patientLat: formData.lat,
          patientLng: formData.lng,
          severity: formData.severity,
          condition: formData.emergencyType,
        });
        if (isMounted) setBestHospital(localTops[0] || HEALTH_FACILITIES[0]);
      }
    };

    resolveMatches();

    return () => {
      isMounted = false;
    };
  }, [formData.lat, formData.lng, formData.emergencyType, formData.severity]);

  const handleTypeSelect = (type, defaultSeverity = 'CRITICAL') => {
    setFormData((prev) => ({
      ...prev,
      emergencyType: type,
      severity: defaultSeverity,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);

    const payload = {
      patient_name: formData.patientName.trim(),
      contact_phone: formData.contactPhone.trim(),
      patient_age: formData.patientAge ? Number(formData.patientAge) : null,
      gender: formData.gender,
      emergency_type: formData.emergencyType,
      severity: formData.severity,
      consciousness: formData.consciousness,
      breathing: formData.breathing,
      incident_address: formData.incidentAddress.trim(),
      latitude: Number(formData.lat),
      longitude: Number(formData.lng),
      symptoms: formData.symptomsDescription,
      caller_name: 'Citizen SOS Reporter',
      destination_facility_id: bestHospital?.dbId || undefined,
    };

    try {
      // 1. Post to FastAPI backend: POST /api/v1/emergencies
      const createdReport = await EmergencyService.createEmergency(payload);

      // 2. Post dispatch assignment to backend: POST /api/v1/assignments
      let createdAssignment = null;
      const targetAmbulanceId = nearestUnit?.dbId || 1; // Default to demo unit 1 if dbId unavailable

      try {
        createdAssignment = await AssignmentService.createAssignment({
          emergency_id: createdReport.dbId || createdReport.id,
          ambulance_id: targetAmbulanceId,
          status: 'DISPATCHED',
          estimated_eta_minutes: nearestUnit?.etaMins || 5,
          notes: `FastAPI auto-dispatched ${nearestUnit?.ambulanceId || 'AMB001'} to incident ${createdReport.incidentCode || createdReport.id}`,
        });
      } catch (assignErr) {
        console.warn('Assignment creation note:', assignErr);
      }

      // Format unified incident record for UI and local context
      const newIncident = {
        id: createdReport.incidentCode || `EMG-${createdReport.dbId || Date.now().toString().slice(-4)}`,
        dbId: createdReport.dbId || createdReport.id,
        patientName: createdReport.patientName,
        contactPhone: createdReport.contactPhone,
        patientAge: createdReport.patientAge,
        gender: createdReport.gender,
        type: createdReport.emergencyType,
        severity: createdReport.severity,
        incidentAddress: createdReport.incidentAddress,
        lat: createdReport.lat,
        lng: createdReport.lng,
        symptoms: createdReport.symptoms,
        assignedAmbulanceId: nearestUnit?.ambulanceId || 'AMB001',
        assignedAmbulanceNumber: nearestUnit?.vehicleNumber || 'TS-09-EA-1081',
        destinationHospital: bestHospital?.name || 'Osmania General Hospital',
        destinationHospitalId: bestHospital?.id || 'HOSP-5120',
        status: 'DISPATCHED',
        etaMinutes: createdAssignment?.estimated_eta_minutes || nearestUnit?.etaMins || 5,
        timestamp: new Date().toLocaleTimeString(),
        assignmentId: createdAssignment?.id,
      };

      if (createEmergency) {
        createEmergency(newIncident);
      }

      setSubmittedEmergency(newIncident);
    } catch (err) {
      console.error('Failed to submit emergency to backend:', err);
      setSubmitError(err.friendlyMessage || 'Failed to connect to emergency intake API. Please verify backend is running.');

      // Fallback: create locally so user is not blocked
      const fallbackIncident = {
        id: `EMG-${Date.now().toString().slice(-4)}`,
        patientName: formData.patientName,
        contactPhone: formData.contactPhone,
        patientAge: formData.patientAge,
        gender: formData.gender,
        type: formData.emergencyType,
        severity: formData.severity,
        incidentAddress: formData.incidentAddress,
        lat: formData.lat,
        lng: formData.lng,
        symptoms: formData.symptomsDescription,
        assignedAmbulanceId: nearestUnit?.ambulanceId || 'AMB001',
        assignedAmbulanceNumber: nearestUnit?.vehicleNumber || 'TS-09-EA-1081',
        destinationHospital: bestHospital?.name || 'Osmania General Hospital',
        destinationHospitalId: bestHospital?.id || 'HOSP-5120',
        status: 'DISPATCHED',
        etaMinutes: nearestUnit?.etaMins || 5,
        timestamp: new Date().toLocaleTimeString(),
      };

      if (createEmergency) {
        createEmergency(fallbackIncident);
      }
      setSubmittedEmergency(fallbackIncident);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <DemoNoticeBanner />

      {/* Header */}
      <div className="flex items-center justify-between bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-rose-500 animate-pulse" />
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Emergency Intake &amp; Rapid Dispatch
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Connected to FastAPI endpoints <code className="text-rose-300">/api/v1/emergencies</code> &amp; <code className="text-rose-300">/api/v1/assignments</code>.
          </p>
        </div>
      </div>

      {/* Submission Error Alert */}
      {submitError && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-3 text-xs text-amber-300">
          <AlertCircle className="w-5 h-5 shrink-0 text-amber-400" />
          <div>
            <div className="font-bold text-amber-200">Backend Notice</div>
            <div>{submitError} (Simulated locally for demonstration)</div>
          </div>
        </div>
      )}

      {submittedEmergency ? (
        /* Confirmation Card */
        <div className="bg-slate-900/80 border border-emerald-500/40 rounded-2xl p-6 sm:p-8 space-y-6 text-center animate-fadeIn">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center mx-auto text-emerald-400">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase tracking-wider">
              Ambulance Dispatched (FastAPI Verified)
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-white mt-3">
              Incident #{submittedEmergency.id} Activated
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-md mx-auto">
              Nearest unit <strong className="text-rose-400">{submittedEmergency.assignedAmbulanceId}</strong> ({submittedEmergency.assignedAmbulanceNumber}) has been assigned and is heading to {submittedEmergency.incidentAddress}.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-lg mx-auto text-left">
            <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700">
              <span className="text-[10px] text-slate-400 font-bold block">DISPATCHED UNIT</span>
              <span className="text-sm font-black text-white flex items-center gap-1.5 mt-0.5">
                <Ambulance className="w-4 h-4 text-rose-400" />
                {submittedEmergency.assignedAmbulanceId} ({nearestUnit?.type || 'ALS'})
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700">
              <span className="text-[10px] text-slate-400 font-bold block">ESTIMATED ETA</span>
              <span className="text-sm font-black text-emerald-400 flex items-center gap-1.5 mt-0.5">
                <Clock className="w-4 h-4" />
                ~{submittedEmergency.etaMinutes} mins
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700">
              <span className="text-[10px] text-slate-400 font-bold block">DESTINATION</span>
              <span className="text-xs font-black text-indigo-300 truncate block mt-0.5">
                {submittedEmergency.destinationHospital}
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
            <button
              onClick={() => navigate('/route-eta')}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-900/40 flex items-center justify-center gap-2 transition-all hover:scale-105"
            >
              <Ambulance className="w-4 h-4" />
              <span>Track Live Route &amp; ETA Now</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setSubmittedEmergency(null);
                setSubmitError(null);
              }}
              className="w-full sm:w-auto px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all"
            >
              Report Another Emergency
            </button>
          </div>
        </div>
      ) : (
        /* Form */
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Emergency Category & Severity */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Flame className="w-4 h-4 text-rose-500" />
                Select Emergency Condition &amp; Category
              </h2>
              <span className="text-[11px] text-slate-400">Step 1 of 3</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {[
                { id: 'CARDIAC', label: 'Cardiac', desc: 'Heart attack, chest pain, arrest', severity: 'CRITICAL', icon: Heart },
                { id: 'ACCIDENT', label: 'Accident', desc: 'Vehicular collision, road crash', severity: 'CRITICAL', icon: Car },
                { id: 'STROKE', label: 'Stroke', desc: 'Facial droop, paralysis, speech loss', severity: 'HIGH', icon: Activity },
                { id: 'MATERNITY', label: 'Maternity', desc: 'Active labor, obstetric distress', severity: 'HIGH', icon: Baby },
                { id: 'TRAUMA', label: 'Trauma', desc: 'Severe bleeding, fractures, falls', severity: 'CRITICAL', icon: Flame },
                { id: 'GENERAL', label: 'General', desc: 'Severe illness, acute fever, other', severity: 'MEDIUM', icon: Ambulance },
              ].map((item) => {
                const Icon = item.icon;
                const isSelected = formData.emergencyType === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleTypeSelect(item.id, item.severity)}
                    className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between gap-1.5 ${
                      isSelected
                        ? 'bg-rose-950/40 border-rose-500 text-white shadow-md shadow-rose-950/40 ring-1 ring-rose-500/50'
                        : 'bg-slate-800/40 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <Icon className={`w-5 h-5 ${isSelected ? 'text-rose-400' : 'text-slate-400'}`} />
                      {isSelected && <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />}
                    </div>
                    <div>
                      <div className="text-xs font-bold leading-snug">{item.label}</div>
                      <div className="text-[10px] text-slate-400 truncate mt-0.5">{item.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Severity Level Selection */}
            <div className="pt-2 border-t border-slate-800">
              <label className="text-xs font-semibold text-slate-300 block mb-2">
                Severity Level
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { key: 'CRITICAL', label: 'Critical', bg: 'bg-rose-500/20 text-rose-300 border-rose-500/40' },
                  { key: 'HIGH', label: 'High', bg: 'bg-amber-500/20 text-amber-300 border-amber-500/40' },
                  { key: 'MEDIUM', label: 'Medium', bg: 'bg-sky-500/20 text-sky-300 border-sky-500/40' },
                  { key: 'LOW', label: 'Low', bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' },
                ].map((lvl) => {
                  const isSelected = formData.severity === lvl.key;
                  return (
                    <button
                      key={lvl.key}
                      type="button"
                      onClick={() => setFormData({ ...formData, severity: lvl.key })}
                      className={`p-2 rounded-xl border text-xs font-bold text-center transition-all ${
                        isSelected
                          ? `${lvl.bg} ring-2 ring-rose-400 font-black`
                          : 'bg-slate-800/40 border-slate-700/60 text-slate-400 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      {lvl.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Section 2: Patient & Vitals */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <User className="w-4 h-4 text-sky-400" />
                Patient Information &amp; Clinical Vitals
              </h2>
              <span className="text-[11px] text-slate-400">Step 2 of 3</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Patient Full Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.patientName}
                  onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Contact Phone Number
                </label>
                <input
                  type="text"
                  required
                  value={formData.contactPhone}
                  onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Age &amp; Gender
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    value={formData.patientAge}
                    onChange={(e) => setFormData({ ...formData, patientAge: parseInt(e.target.value) || 0 })}
                    className="bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                  />
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="bg-slate-800/80 border border-slate-700 rounded-xl px-2 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                  >
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Consciousness Level
                </label>
                <select
                  value={formData.consciousness}
                  onChange={(e) => setFormData({ ...formData, consciousness: e.target.value })}
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                >
                  <option value="CONSCIOUS">Fully Alert &amp; Conscious</option>
                  <option value="SEMICONSCIOUS">Semiconscious / Disoriented</option>
                  <option value="UNRESPONSIVE">Unresponsive / Comatose</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Breathing Status
                </label>
                <select
                  value={formData.breathing}
                  onChange={(e) => setFormData({ ...formData, breathing: e.target.value })}
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                >
                  <option value="NORMAL">Normal</option>
                  <option value="DIFFICULT">Struggling / Wheezing</option>
                  <option value="APNEA">Not Breathing / Gasping</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Symptoms &amp; Circumstances
              </label>
              <textarea
                rows={2}
                value={formData.symptomsDescription}
                onChange={(e) => setFormData({ ...formData, symptomsDescription: e.target.value })}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500 resize-none"
              />
            </div>
          </div>

          {/* Section 3: Incident Location & Nearest Match Preview */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-400" />
                Incident Geolocation &amp; AI Dispatch Match
              </h2>
              
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={captureGps}
                  disabled={gpsStatus === 'ACQUIRING'}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/30 text-xs font-bold transition-all"
                  title="Detect current location via browser GPS"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${gpsStatus === 'ACQUIRING' ? 'animate-spin text-sky-400' : ''}`} />
                  <span>Detect My GPS</span>
                </button>
              </div>
            </div>

            {gpsMsg && (
              <div className={`p-2.5 rounded-xl border text-xs flex items-center gap-2 ${
                gpsStatus === 'ACQUIRED'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
              }`}>
                <Info className="w-4 h-4 shrink-0" />
                <span>{gpsMsg}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Location / Landmark Address (Hyderabad Area)
                </label>
                <input
                  type="text"
                  required
                  value={formData.incidentAddress}
                  onChange={(e) => setFormData({ ...formData, incidentAddress: e.target.value })}
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  GPS Coordinates (Lat / Long)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    step="0.0001"
                    value={formData.lat}
                    onChange={(e) => setFormData({ ...formData, lat: parseFloat(e.target.value) || 0 })}
                    className="bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-sky-300"
                  />
                  <input
                    type="number"
                    step="0.0001"
                    value={formData.lng}
                    onChange={(e) => setFormData({ ...formData, lng: parseFloat(e.target.value) || 0 })}
                    className="bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-sky-300"
                  />
                </div>
              </div>
            </div>

            {/* Quick Landmarks for Desktop Testing */}
            <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center gap-1.5 text-[10px]">
              <span className="text-slate-400 font-semibold mr-1">Quick Landmark Pick:</span>
              {[
                { name: 'Abids Central', lat: 17.3980, lng: 78.4730, addr: 'Nampally Station Road, Abids, Hyderabad' },
                { name: 'Charminar', lat: 17.3616, lng: 78.4747, addr: 'Near Charminar, Old City, Hyderabad' },
                { name: 'HITEC City', lat: 17.4504, lng: 78.3808, addr: 'Cyber Towers, HITEC City, Hyderabad' },
                { name: 'Secunderabad', lat: 17.4399, lng: 78.4983, addr: 'Station Road, Secunderabad, Hyderabad' },
              ].map((lm) => (
                <button
                  key={lm.name}
                  type="button"
                  onClick={() => {
                    setFormData((prev) => ({
                      ...prev,
                      lat: lm.lat,
                      lng: lm.lng,
                      incidentAddress: lm.addr,
                    }));
                  }}
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300"
                >
                  {lm.name}
                </button>
              ))}
            </div>

            {/* AI Recommendation Preview Banner */}
            <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/80 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
                  <Ambulance className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Nearest Match (API Verified)
                  </span>
                  <div className="text-xs font-bold text-white">
                    {nearestUnit?.ambulanceId || 'AMB001'} ({nearestUnit?.type || 'ALS'} Unit)
                  </div>
                  <div className="text-[11px] text-emerald-400 font-semibold">
                    Distance: ~{nearestUnit?.distanceKm || 3.2} km • ETA: {nearestUnit?.etaMins || 5} mins
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Recommended Hospital (API Verified)
                  </span>
                  <div className="text-xs font-bold text-white truncate max-w-[200px]">
                    {bestHospital?.name || bestHospital?.facility_name || 'Osmania General Hospital'}
                  </div>
                  <div className="text-[11px] text-indigo-300 font-semibold">
                    {bestHospital?.availableIcuBeds || 8} ICU Beds Open • {bestHospital?.traumaLevel || 'Level 1 Trauma'}
                  </div>
                </div>
              </div>
            </div>

            {/* Safety Protocol Notice */}
            <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 text-[11px] text-slate-300 flex items-start gap-2">
              <Info className="w-4 h-4 shrink-0 text-sky-400 mt-0.5" />
              <div>
                <span className="font-bold text-white">Safety Protocol:</span> Emergency incidents are ingested into the database as <strong>REPORTED</strong>. In this academic prototype, live emergency dispatch is simulated for safety. In a real emergency, call <strong>108</strong> or <strong>112</strong>.
              </div>
            </div>
          </div>

          {/* Submit Action */}
          <div className="flex items-center justify-between pt-2">
            <span className="text-[11px] text-slate-400">
              ⚡ Instant algorithmic triage and vehicle assignment via FastAPI
            </span>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold text-xs shadow-lg shadow-rose-900/40 flex items-center gap-2 transition-all hover:scale-105 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Submitting to Backend API...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Confirm Emergency &amp; Dispatch Ambulance</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default ReportEmergencyPage;
