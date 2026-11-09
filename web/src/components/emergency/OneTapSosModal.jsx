import React, { useState, useEffect, useRef } from 'react';
import {
  AlertTriangle,
  MapPin,
  Phone,
  User,
  HeartPulse,
  Car,
  Activity,
  Baby,
  ShieldAlert,
  HelpCircle,
  Navigation,
  CheckCircle2,
  X,
  Loader2,
  RefreshCw,
  Info,
  Clock,
  Sparkles,
  AlertCircle,
  Building2
} from 'lucide-react';
import { EmergencyService, API_BASE_URL } from '../../services/api';

// Verified Hyderabad Demo Landmarks for quick testing & GPS fallback
const HYDERABAD_LANDMARKS = [
  { name: 'Hyderabad Central (Abids)', lat: 17.3980, lng: 78.4730, address: 'Nampally Station Road, Abids, Hyderabad' },
  { name: 'Charminar / Old City', lat: 17.3616, lng: 78.4747, address: 'Near Charminar, Old City, Hyderabad' },
  { name: 'HITEC City (Cyber Towers)', lat: 17.4504, lng: 78.3808, address: 'Cyber Towers, HITEC City, Hyderabad' },
  { name: 'Secunderabad Station', lat: 17.4399, lng: 78.4983, address: 'Station Road, Secunderabad, Hyderabad' },
  { name: 'Banjara Hills (Rd No. 1)', lat: 17.4156, lng: 78.4350, address: 'Road No. 1, Banjara Hills, Hyderabad' },
];

export const OneTapSosModal = ({
  isOpen,
  onClose,
  onEmergencyCreated,
  onLocationPreview,
  onNavigateToRecommendations,
  initialCoordinates = { lat: 17.4065, lng: 78.4772 }
}) => {
  // Form state
  const [emergencyType, setEmergencyType] = useState('CARDIAC');
  const [severity, setSeverity] = useState('CRITICAL');
  const [patientName, setPatientName] = useState('Citizen Reporter');
  const [contactPhone, setContactPhone] = useState('+91 98490 12345');
  const [patientAge, setPatientAge] = useState('');
  const [gender, setGender] = useState('UNKNOWN');
  const [symptoms, setSymptoms] = useState('');
  const [incidentAddress, setIncidentAddress] = useState('Hyderabad Metro Area');
  const [lat, setLat] = useState(initialCoordinates.lat);
  const [lng, setLng] = useState(initialCoordinates.lng);

  // Optional vitals
  const [consciousness, setConsciousness] = useState('CONSCIOUS');
  const [breathing, setBreathing] = useState('DIFFICULT');
  const [showAdditionalDetails, setShowAdditionalDetails] = useState(false);

  // Geolocation state
  const [gpsStatus, setGpsStatus] = useState('IDLE'); // 'IDLE' | 'ACQUIRING' | 'ACQUIRED' | 'DENIED' | 'UNAVAILABLE' | 'TIMEOUT'
  const [gpsAccuracy, setGpsAccuracy] = useState(null);
  const [gpsErrorMsg, setGpsErrorMsg] = useState(null);
  const [manualLocationMode, setManualLocationMode] = useState(false);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [confirmedEmergency, setConfirmedEmergency] = useState(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Request browser GPS whenever modal opens
  useEffect(() => {
    if (isOpen && !confirmedEmergency) {
      triggerGpsAcquisition();
    }
  }, [isOpen]);

  // Sync location preview with parent map
  const notifyLocationChange = (newLat, newLng, newAddress) => {
    if (onLocationPreview) {
      onLocationPreview({
        lat: Number(newLat),
        lng: Number(newLng),
        address: newAddress || incidentAddress
      });
    }
  };

  const triggerGpsAcquisition = () => {
    if (!navigator.geolocation) {
      setGpsStatus('UNAVAILABLE');
      setGpsErrorMsg('Browser does not support Geolocation. Manual coordinates enabled.');
      setManualLocationMode(true);
      return;
    }

    setGpsStatus('ACQUIRING');
    setGpsErrorMsg(null);

    const geoOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (!isMountedRef.current) return;
        const currentLat = Number(position.coords.latitude.toFixed(6));
        const currentLng = Number(position.coords.longitude.toFixed(6));
        const accuracy = Math.round(position.coords.accuracy || 10);

        setLat(currentLat);
        setLng(currentLng);
        setGpsAccuracy(accuracy);
        setGpsStatus('ACQUIRED');
        const autoAddr = `GPS Location: ${currentLat.toFixed(4)}°N, ${currentLng.toFixed(4)}°E (±${accuracy}m accuracy)`;
        setIncidentAddress((prev) => (prev === 'Hyderabad Metro Area' ? autoAddr : prev));
        notifyLocationChange(currentLat, currentLng, autoAddr);
      },
      (error) => {
        if (!isMountedRef.current) return;
        setManualLocationMode(true);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setGpsStatus('DENIED');
            setGpsErrorMsg('GPS Permission Denied. You declined location access. Please use manual entry or select a landmark below.');
            break;
          case error.POSITION_UNAVAILABLE:
            setGpsStatus('UNAVAILABLE');
            setGpsErrorMsg('GPS Position Unavailable. Device cannot determine location. Manual entry enabled.');
            break;
          case error.TIMEOUT:
            setGpsStatus('TIMEOUT');
            setGpsErrorMsg('GPS Request Timed Out. Manual location entry enabled.');
            break;
          default:
            setGpsStatus('UNAVAILABLE');
            setGpsErrorMsg(`GPS Error (${error.message}). Manual entry enabled.`);
            break;
        }
      },
      geoOptions
    );
  };

  const handleLandmarkSelect = (landmark) => {
    setLat(landmark.lat);
    setLng(landmark.lng);
    setIncidentAddress(landmark.address);
    setGpsStatus('ACQUIRED');
    setGpsAccuracy(5);
    setGpsErrorMsg(null);
    notifyLocationChange(landmark.lat, landmark.lng, landmark.address);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return; // Prevent duplicate submissions

    // Basic validation
    if (!contactPhone.trim() || contactPhone.trim().length < 7) {
      setSubmitError('Please provide a valid emergency contact phone number (at least 7 digits).');
      return;
    }

    if (!patientName.trim()) {
      setSubmitError('Please provide a patient name or identifier.');
      return;
    }

    const numericLat = Number(lat);
    const numericLng = Number(lng);
    if (isNaN(numericLat) || numericLat < -90 || numericLat > 90 || isNaN(numericLng) || numericLng < -180 || numericLng > 180) {
      setSubmitError('Invalid GPS coordinates. Latitude must be between -90 and 90; Longitude between -180 and 180.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    const payload = {
      patient_name: patientName.trim(),
      contact_phone: contactPhone.trim(),
      patient_age: patientAge ? Number(patientAge) : null,
      gender: gender || 'UNKNOWN',
      emergency_type: emergencyType.toUpperCase(),
      severity: severity.toUpperCase(),
      consciousness: consciousness || null,
      breathing: breathing || null,
      incident_address: incidentAddress.trim() || `GPS: ${numericLat}, ${numericLng}`,
      latitude: numericLat,
      longitude: numericLng,
      symptoms: symptoms.trim() || `One-Tap SOS: ${emergencyType} (${severity})`,
      caller_name: 'One-Tap SOS Citizen Reporter',
    };

    try {
      // 1. Submit emergency report directly to FastAPI backend (/api/v1/emergencies)
      // Note: We do NOT automatically dispatch an ambulance without explicit dispatcher confirmation.
      const createdReport = await EmergencyService.createEmergency(payload);

      // 2. Set confirmed emergency state for modal display
      setConfirmedEmergency(createdReport);

      // 3. Inform parent dashboard to update state without reloading
      if (onEmergencyCreated) {
        onEmergencyCreated(createdReport);
      }
    } catch (err) {
      console.error('Failed to submit One-Tap SOS emergency:', err);
      setSubmitError(
        err.friendlyMessage ||
        'Failed to connect to PulseRoute backend at ' + API_BASE_URL + '. Verify FastAPI server is running on port 8000.'
      );
    } finally {
      if (isMountedRef.current) {
        setIsSubmitting(false);
      }
    }
  };

  const handleResetAndClose = () => {
    setConfirmedEmergency(null);
    setSubmitError(null);
    setIsSubmitting(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-rose-500/40 rounded-3xl shadow-2xl shadow-rose-950/50 overflow-hidden my-6">

        {/* Modal Top Header Bar */}
        <div className="bg-gradient-to-r from-rose-950/80 via-slate-900 to-red-950/80 px-6 py-4 border-b border-rose-500/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-600 flex items-center justify-center text-white shadow-lg shadow-rose-600/50 animate-pulse">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-white tracking-tight">ONE-TAP SOS EMERGENCY</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  CODE RED INTAKE
                </span>
              </div>
              <p className="text-xs text-rose-200/80">
                Direct GPS Dispatch Protocol • Tel: 108 / 112 Simulation
              </p>
            </div>
          </div>

          <button
            onClick={handleResetAndClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
            title="Close SOS Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">

          {/* CONFIRMATION SCREEN (When SOS has been submitted successfully) */}
          {confirmedEmergency ? (
            <div className="space-y-6 text-center py-4 animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500/40 text-emerald-400 mx-auto flex items-center justify-center shadow-lg shadow-emerald-950/50">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div>
                <span className="px-3 py-1 rounded-full text-xs font-mono font-black bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  INCIDENT #{confirmedEmergency.incidentCode || `EMG-${confirmedEmergency.id}`}
                </span>
                <h3 className="text-2xl font-black text-white tracking-tight mt-2">
                  Emergency Report Registered!
                </h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
                  Your incident has been written to the central SQLite database and prioritized for command dispatch.
                </p>
              </div>

              {/* Status Confirmation Card */}
              <div className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-4 text-left max-w-lg mx-auto space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-700/60 text-xs">
                  <span className="text-slate-400">Database Record ID:</span>
                  <span className="font-mono font-bold text-white">#{confirmedEmergency.dbId || confirmedEmergency.id}</span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-700/60 text-xs">
                  <span className="text-slate-400">Intake Status:</span>
                  <span className="px-2 py-0.5 rounded font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {confirmedEmergency.status || 'REPORTED'} (PENDING VERIFICATION)
                  </span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-700/60 text-xs">
                  <span className="text-slate-400">Triage Priority:</span>
                  <span className="font-bold text-rose-400">
                    {confirmedEmergency.severity || severity} • {confirmedEmergency.emergencyType || emergencyType}
                  </span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-700/60 text-xs">
                  <span className="text-slate-400">Patient / Phone:</span>
                  <span className="font-semibold text-slate-200">
                    {confirmedEmergency.patientName} ({confirmedEmergency.contactPhone})
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">GPS Coordinates:</span>
                  <span className="font-mono text-sky-400">
                    [{Number(confirmedEmergency.lat || confirmedEmergency.latitude).toFixed(4)}, {Number(confirmedEmergency.lng || confirmedEmergency.longitude).toFixed(4)}]
                  </span>
                </div>
              </div>

              {/* Safety notice banner */}
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs text-left max-w-lg mx-auto flex items-start gap-2.5">
                <Info className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
                <div>
                  <span className="font-bold">Safety Notice:</span> In this academic prototype, automatic live sirens and vehicle movement are simulated. Emergency status remains <strong>REPORTED</strong> awaiting command center assignment.
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleResetAndClose}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-700 transition-all"
                >
                  View on Dashboard Map
                </button>
                {onNavigateToRecommendations && (
                  <button
                    type="button"
                    onClick={() => {
                      const emg = confirmedEmergency;
                      handleResetAndClose();
                      onNavigateToRecommendations(emg);
                    }}
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-950/50 flex items-center gap-1.5 transition-all hover:scale-105"
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    <span>View Top 5 Hospitals</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setConfirmedEmergency(null);
                    triggerGpsAcquisition();
                  }}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-900/40 transition-all"
                >
                  Report Another Incident
                </button>
              </div>
            </div>
          ) : (
            /* ACTIVE SOS SUBMISSION FORM */
            <form onSubmit={handleSubmit} className="space-y-5">

              {/* SUBMISSION ERROR BANNER */}
              {submitError && (
                <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs flex items-start gap-2.5 animate-in slide-in-from-top-1">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                  <div>
                    <span className="font-bold">Submission Failed:</span> {submitError}
                  </div>
                </div>
              )}

              {/* 1. EMERGENCY TYPE SELECTOR */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                  <span>1. Emergency Category</span>
                  <span className="text-[11px] text-rose-400 lowercase font-normal">*required</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { key: 'CARDIAC', label: 'Cardiac', icon: HeartPulse, desc: 'Chest pain, arrest, palpitations', color: 'rose' },
                    { key: 'ACCIDENT', label: 'Accident', icon: Car, desc: 'Vehicular collision, road crash', color: 'amber' },
                    { key: 'STROKE', label: 'Stroke', icon: Activity, desc: 'Facial droop, paralysis, speech loss', color: 'purple' },
                    { key: 'MATERNITY', label: 'Maternity', icon: Baby, desc: 'Active labor, obstetric distress', color: 'pink' },
                    { key: 'TRAUMA', label: 'Trauma', icon: ShieldAlert, desc: 'Severe bleeding, fracture, fall', color: 'red' },
                    { key: 'GENERAL', label: 'General', icon: HelpCircle, desc: 'Severe breathing, fever, other', color: 'sky' },
                  ].map((item) => {
                    const Icon = item.icon;
                    const isSelected = emergencyType === item.key;
                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => setEmergencyType(item.key)}
                        className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between ${isSelected
                            ? 'bg-rose-950/60 border-rose-500 shadow-md shadow-rose-950/50'
                            : 'bg-slate-800/40 border-slate-700/60 hover:bg-slate-800 hover:border-slate-600'
                          }`}
                      >
                        <div className="flex items-center justify-between">
                          <Icon className={`w-5 h-5 ${isSelected ? 'text-rose-400' : 'text-slate-400'}`} />
                          {isSelected && <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />}
                        </div>
                        <div className="mt-2">
                          <div className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                            {item.label}
                          </div>
                          <div className="text-[10px] text-slate-400 truncate mt-0.5">{item.desc}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. SEVERITY LEVEL SELECTOR */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                  <span>2. Triage Severity Level</span>
                  <span className="text-[11px] text-slate-400 font-normal">Impacts ambulance tier dispatch</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { key: 'CRITICAL', label: 'Critical', sub: 'Life Threat (ALS)', bg: 'bg-rose-500/20 text-rose-300 border-rose-500/40 hover:bg-rose-500/30' },
                    { key: 'HIGH', label: 'High', sub: 'Urgent Care (ALS/BLS)', bg: 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30' },
                    { key: 'MEDIUM', label: 'Medium', sub: 'Stabilizing (BLS)', bg: 'bg-sky-500/20 text-sky-300 border-sky-500/40 hover:bg-sky-500/30' },
                    { key: 'LOW', label: 'Low', sub: 'Non-Immediate (BLS)', bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30' },
                  ].map((lvl) => {
                    const isSelected = severity === lvl.key;
                    return (
                      <button
                        key={lvl.key}
                        type="button"
                        onClick={() => setSeverity(lvl.key)}
                        className={`p-2.5 rounded-xl border text-center transition-all ${isSelected
                            ? `${lvl.bg} font-black ring-2 ring-rose-400`
                            : 'bg-slate-800/40 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                          }`}
                      >
                        <div className="text-xs font-bold">{lvl.label}</div>
                        <div className="text-[10px] opacity-80 mt-0.5">{lvl.sub}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. GPS GEOLOCATION & MANUAL LOCATION FALLBACK */}
              <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-rose-400" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      3. GPS Location Capture
                    </span>
                  </div>

                  {/* GPS Status Indicator Badge */}
                  <div className="flex items-center gap-2">
                    {gpsStatus === 'ACQUIRING' && (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30">
                        <Loader2 className="w-3 h-3 animate-spin text-sky-400" />
                        Acquiring GPS...
                      </span>
                    )}
                    {gpsStatus === 'ACQUIRED' && (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        GPS Locked {gpsAccuracy ? `(±${gpsAccuracy}m)` : ''}
                      </span>
                    )}
                    {(gpsStatus === 'DENIED' || gpsStatus === 'UNAVAILABLE' || gpsStatus === 'TIMEOUT') && (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        <AlertTriangle className="w-3 h-3 text-amber-400" />
                        Manual Mode
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={triggerGpsAcquisition}
                      disabled={gpsStatus === 'ACQUIRING'}
                      className="p-1.5 rounded-lg bg-slate-700/60 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                      title="Re-acquire Browser GPS"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${gpsStatus === 'ACQUIRING' ? 'animate-spin text-sky-400' : ''}`} />
                    </button>
                  </div>
                </div>

                {/* GPS error message notice */}
                {gpsErrorMsg && (
                  <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] flex items-start gap-2">
                    <Info className="w-3.5 h-3.5 shrink-0 text-amber-400 mt-0.5" />
                    <span>{gpsErrorMsg}</span>
                  </div>
                )}

                {/* Address Field */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                    Incident Landmark / Street Address <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={incidentAddress}
                    onChange={(e) => {
                      setIncidentAddress(e.target.value);
                      notifyLocationChange(lat, lng, e.target.value);
                    }}
                    placeholder="e.g. Abids, Nampally Station Road, Hyderabad"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                  />
                </div>

                {/* Latitude & Longitude Inputs */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="text-[10px] font-mono font-semibold text-slate-400 block mb-0.5">
                      Latitude (°N)
                    </label>
                    <input
                      type="number"
                      step="0.0001"
                      required
                      value={lat}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        setLat(val);
                        notifyLocationChange(val, lng, incidentAddress);
                      }}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono text-sky-300 focus:outline-none focus:border-rose-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-mono font-semibold text-slate-400 block mb-0.5">
                      Longitude (°E)
                    </label>
                    <input
                      type="number"
                      step="0.0001"
                      required
                      value={lng}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        setLng(val);
                        notifyLocationChange(lat, val, incidentAddress);
                      }}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono text-sky-300 focus:outline-none focus:border-rose-500"
                    />
                  </div>
                </div>

                {/* Quick Landmark Presets for Desktop / Denied GPS */}
                <div className="pt-2 border-t border-slate-700/60">
                  <div className="text-[10px] text-slate-400 mb-1.5 font-semibold">
                    Quick Hyderabad Metro Landmarks (Select if GPS unavailable):
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {HYDERABAD_LANDMARKS.map((lm) => (
                      <button
                        key={lm.name}
                        type="button"
                        onClick={() => handleLandmarkSelect(lm)}
                        className="px-2 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-[10px] font-medium text-slate-300 hover:text-white transition-colors"
                      >
                        {lm.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 4. PATIENT CONTACT FIELD */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    Emergency Contact Phone <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type="tel"
                      required
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      placeholder="+91 98490 00000"
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    Patient Name / Caller <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      required
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                      placeholder="e.g. Ramesh Kumar"
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                    />
                  </div>
                </div>
              </div>

              {/* 5. OPTIONAL ADDITIONAL DETAILS TOGGLE */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setShowAdditionalDetails(!showAdditionalDetails)}
                  className="text-xs font-semibold text-sky-400 hover:text-sky-300 flex items-center gap-1.5 transition-colors"
                >
                  <span>{showAdditionalDetails ? '− Hide' : '+ Add'} Optional Clinical Details (Age, Vitals, Symptoms)</span>
                </button>

                {showAdditionalDetails && (
                  <div className="mt-3 p-3.5 rounded-2xl bg-slate-800/30 border border-slate-700/60 space-y-3 animate-in fade-in duration-150">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-1">Age</label>
                        <input
                          type="number"
                          value={patientAge}
                          onChange={(e) => setPatientAge(e.target.value)}
                          placeholder="e.g. 52"
                          className="w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-1">Gender</label>
                        <select
                          value={gender}
                          onChange={(e) => setGender(e.target.value)}
                          className="w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                        >
                          <option value="UNKNOWN">Unknown</option>
                          <option value="MALE">Male</option>
                          <option value="FEMALE">Female</option>
                          <option value="OTHER">Other</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-1">Consciousness</label>
                        <select
                          value={consciousness}
                          onChange={(e) => setConsciousness(e.target.value)}
                          className="w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                        >
                          <option value="CONSCIOUS">Conscious</option>
                          <option value="SEMICONSCIOUS">Semi-Conscious</option>
                          <option value="UNRESPONSIVE">Unresponsive</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-1">Breathing</label>
                        <select
                          value={breathing}
                          onChange={(e) => setBreathing(e.target.value)}
                          className="w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                        >
                          <option value="NORMAL">Normal</option>
                          <option value="DIFFICULT">Difficult</option>
                          <option value="APNEA">Not Breathing</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">Observed Symptoms / Scene Notes</label>
                      <textarea
                        rows={2}
                        value={symptoms}
                        onChange={(e) => setSymptoms(e.target.value)}
                        placeholder="e.g. Severe chest pain radiating to left jaw, cold sweats, breathlessness"
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* 6. ACADEMIC & SAFETY PROTOCOL NOTICE */}
              <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 text-[11px] text-slate-300 flex items-start gap-2">
                <Info className="w-4 h-4 shrink-0 text-sky-400 mt-0.5" />
                <div>
                  <span className="font-bold text-white">Notice:</span> Submitting this form registers an emergency intake record in the PulseRoute SQLite database. In compliance with safety guidelines, real dispatch requires human command center verification. In a real emergency, please dial <strong>108</strong> or <strong>112</strong> immediately.
                </div>
              </div>

              {/* 7. SUBMIT BUTTON & ACTIONS */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleResetAndClose}
                  disabled={isSubmitting}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs border border-slate-700 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 hover:from-rose-500 hover:to-red-500 text-white font-black text-xs shadow-lg shadow-rose-950/60 transition-all flex items-center gap-2 disabled:opacity-50 hover:scale-[1.02]"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Transmitting SOS to FastAPI...</span>
                    </>
                  ) : (
                    <>
                      <ShieldAlert className="w-4 h-4" />
                      <span>CONFIRM & TRANSMIT ONE-TAP SOS</span>
                    </>
                  )}
                </button>
              </div>

            </form>
          )}

        </div>
      </div>
    </div>
  );
};
export default OneTapSosModal;

