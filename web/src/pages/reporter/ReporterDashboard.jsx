import React, { useState } from 'react';
import { useEmergency } from '../../context/EmergencyContext';
import { useAuth } from '../../context/AuthContext';
import { LeafletMap } from '../../components/common/LeafletMap';
import { PriorityBadge, StatusBadge, TierBadge } from '../../components/common/Badge';
import {
  AlertTriangle,
  PhoneCall,
  MapPin,
  HeartPulse,
  Navigation,
  Sparkles,
  CheckCircle2,
  Clock,
  User,
  Activity,
  PlusCircle,
} from 'lucide-react';

export const ReporterDashboard = () => {
  const { currentUser } = useAuth();
  const {
    activeEmergency,
    ambulances,
    hospitals,
    createEmergency,
    isSimulatingGps,
  } = useEmergency();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [patientName, setPatientName] = useState('Self / Family Member');
  const [emergencyType, setEmergencyType] = useState('CARDIAC');
  const [consciousness, setConsciousness] = useState('ALERT');
  const [chestPain, setChestPain] = useState(true);
  const [severeBleeding, setSevereBleeding] = useState(false);
  const [spO2, setSpO2] = useState(91);
  const [heartRate, setHeartRate] = useState(115);
  const [bloodPressure, setBloodPressure] = useState('145/95');
  const [address, setAddress] = useState('12th Main Road, HAL 2nd Stage, Indiranagar, Bangalore');
  const [selectedCoords, setSelectedCoords] = useState({ lat: 12.9719, lng: 77.6412 });
  const [notes, setNotes] = useState('Patient experiencing heavy chest discomfort and dizziness.');

  // Live Simulated AI Triage Preview calculation
  const calculatePreviewPriority = () => {
    let score = 0;
    if (consciousness === 'UNRESPONSIVE') score += 40;
    else if (consciousness !== 'ALERT') score += 25;
    if (chestPain) score += 30;
    if (severeBleeding) score += 25;
    if (Number(spO2) < 90) score += 25;
    if (Number(heartRate) > 130 || Number(heartRate) < 50) score += 20;

    if (score >= 45 || emergencyType === 'CARDIAC') {
      return { priority: 'P1', label: 'P1 Critical (Code Red)', tier: 'ALS', eta: 6 };
    }
    if (score >= 25 || emergencyType === 'TRAUMA' || emergencyType === 'RESPIRATORY') {
      return { priority: 'P2', label: 'P2 Urgent (Code Orange)', tier: 'ALS', eta: 8 };
    }
    return { priority: 'P3', label: 'P3 Moderate (Code Yellow)', tier: 'BLS', eta: 12 };
  };

  const preview = calculatePreviewPriority();

  const handleSubmitEmergency = (e) => {
    e.preventDefault();
    createEmergency({
      patientName,
      reporterName: currentUser?.fullName || 'Priya Sharma',
      reporterPhone: currentUser?.phone || '+91 98765 43210',
      emergencyType,
      vitals: {
        consciousness,
        chestPain,
        severeBleeding,
        spO2: Number(spO2),
        heartRate: Number(heartRate),
        bloodPressure,
      },
      pickupLocation: {
        address,
        lat: selectedCoords.lat,
        lng: selectedCoords.lng,
      },
      notes,
    });
    setIsFormOpen(false);
  };

  // Find assigned ambulance & destination hospital for the active emergency
  const assignedAmbulance = ambulances.find((a) => a.id === activeEmergency?.assignedAmbulanceId);
  const assignedHospital = hospitals.find((h) => h.id === activeEmergency?.assignedHospitalId);

  // Compute route coordinates between ambulance, incident, and hospital
  const routeCoords =
    assignedAmbulance && activeEmergency
      ? [
          [assignedAmbulance.lat, assignedAmbulance.lng],
          [activeEmergency.pickupLocation.lat, activeEmergency.pickupLocation.lng],
          assignedHospital ? [assignedHospital.lat, assignedHospital.lng] : null,
        ].filter(Boolean)
      : null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-white tracking-tight">Citizen Emergency Hub</h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
              Live SOS Portal
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Logged in as <span className="text-white font-medium">{currentUser?.fullName}</span> • Instant Ambulance Dispatch
          </p>
        </div>

        <button
          onClick={() => setIsFormOpen(!isFormOpen)}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/30 flex items-center gap-2 transition-all"
        >
          {isFormOpen ? 'Close Form' : <><PlusCircle className="w-4 h-4" /> Report New Emergency</>}
        </button>
      </div>

      {/* SOS Form Modal / Section */}
      {isFormOpen && (
        <div className="glass-panel-elevated p-6 rounded-2xl border border-rose-500/40 shadow-2xl relative animate-in fade-in zoom-in-95">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-500 animate-pulse" />
              <h2 className="text-base font-bold text-white">Emergency Intake & AI Triage Screening</h2>
            </div>
            <span className="text-xs text-rose-400 font-mono">SIMULATED INTAKE</span>
          </div>

          <form onSubmit={handleSubmitEmergency} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Patient Name / Identifier</label>
                <input
                  type="text"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-rose-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Emergency Category</label>
                <select
                  value={emergencyType}
                  onChange={(e) => setEmergencyType(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-rose-500"
                >
                  <option value="CARDIAC">Cardiac Arrest / Heart Symptoms</option>
                  <option value="TRAUMA">Road Accident / Severe Trauma</option>
                  <option value="RESPIRATORY">Respiratory Distress / Asthma</option>
                  <option value="STROKE">Stroke / Sudden Paralysis</option>
                  <option value="BURN">Severe Burn / Blast</option>
                  <option value="MATERNAL">Pregnancy / Labor Complication</option>
                  <option value="OTHER">Other Acute Emergency</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Consciousness Level (AVPU)</label>
                <select
                  value={consciousness}
                  onChange={(e) => setConsciousness(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-rose-500"
                >
                  <option value="ALERT">Alert (Awake and responsive)</option>
                  <option value="VERBAL">Verbal (Responds only to voice)</option>
                  <option value="PAIN">Pain (Responds only to pinch/pain)</option>
                  <option value="UNRESPONSIVE">Unresponsive (Completely unconscious)</option>
                </select>
              </div>
            </div>

            {/* Vitals Row */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Chest Pain?</label>
                <button
                  type="button"
                  onClick={() => setChestPain(!chestPain)}
                  className={`w-full py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    chestPain ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {chestPain ? 'YES (Acute)' : 'NO'}
                </button>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Severe Bleeding?</label>
                <button
                  type="button"
                  onClick={() => setSevereBleeding(!severeBleeding)}
                  className={`w-full py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    severeBleeding ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {severeBleeding ? 'YES (Arterial)' : 'NO'}
                </button>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Pulse Rate (BPM)</label>
                <input
                  type="number"
                  value={heartRate}
                  onChange={(e) => setHeartRate(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">SpO2 Oxygen (%)</label>
                <input
                  type="number"
                  value={spO2}
                  onChange={(e) => setSpO2(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Blood Pressure</label>
                <input
                  type="text"
                  value={bloodPressure}
                  onChange={(e) => setBloodPressure(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white"
                />
              </div>
            </div>

            {/* Location & Notes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Pickup Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white"
                  required
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Click on map below to adjust coordinates: [{selectedCoords.lat.toFixed(4)}, {selectedCoords.lng.toFixed(4)}]
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Symptom Notes / Scene Details</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white"
                />
              </div>
            </div>

            {/* AI Triage Live Prediction Box */}
            <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-600/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
                  <Sparkles className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-300 flex items-center gap-2">
                    AI Triage Classifier Preview:
                    <PriorityBadge priority={preview.priority} label={preview.label} />
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Recommended Unit: <span className="font-bold text-white">{preview.tier} (Advanced Life Support)</span> • Est. ETA: <span className="text-emerald-400 font-bold">~{preview.eta} mins</span>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs shadow-lg shadow-rose-600/40 transition-all flex items-center gap-2"
              >
                <HeartPulse className="w-4 h-4" /> Dispatch Ambulance Now
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Active Incident Tracking Board */}
      {activeEmergency ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Tracking Details Card */}
          <div className="lg:col-span-1 space-y-4">
            <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Emergency Status</span>
                <StatusBadge status={activeEmergency.status} />
              </div>

              {/* Big ETA Callout */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-rose-950/60 to-slate-900 border border-rose-500/30 text-center">
                <div className="text-xs font-medium text-rose-300 uppercase tracking-widest flex items-center justify-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> Estimated Arrival
                </div>
                <div className="text-4xl font-black text-white mt-1">
                  {activeEmergency.etaMinutes > 0 ? `${activeEmergency.etaMinutes} min` : 'ARRIVED'}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Live traffic routing active via OpenStreetMap
                </div>
              </div>

              {/* Priority and Incident Profile */}
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Priority Tier:</span>
                  <PriorityBadge priority={activeEmergency.priority} label={activeEmergency.priorityLabel} />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Patient:</span>
                  <span className="font-semibold text-white">{activeEmergency.patientName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Category:</span>
                  <span className="font-semibold text-rose-400">{activeEmergency.emergencyType}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Pickup:</span>
                  <span className="font-medium text-slate-300 text-right truncate max-w-[180px]">
                    {activeEmergency.pickupLocation.address}
                  </span>
                </div>
              </div>

              {/* Assigned Ambulance Card */}
              {assignedAmbulance ? (
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <Navigation className="w-3.5 h-3.5 text-rose-400" />
                      {assignedAmbulance.vehicleNumber}
                    </span>
                    <TierBadge tier={assignedAmbulance.type} />
                  </div>
                  <div className="text-slate-400">
                    Driver: <span className="text-white font-medium">{assignedAmbulance.driverName}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Speed: {assignedAmbulance.speedKmh} km/h</span>
                    <span>O2 Level: {assignedAmbulance.batteryOxygenPct}%</span>
                  </div>
                  <a
                    href={`tel:${assignedAmbulance.driverPhone}`}
                    className="w-full mt-2 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <PhoneCall className="w-3.5 h-3.5 text-emerald-400" /> Call Ambulance Driver
                  </a>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs">
                  Searching for closest available ambulance in dispatch zone...
                </div>
              )}

              {/* Destination Hospital */}
              {assignedHospital && (
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1 text-xs">
                  <div className="text-[11px] font-bold text-sky-400 uppercase">Receiving Emergency Center</div>
                  <div className="font-semibold text-white">{assignedHospital.name}</div>
                  <div className="text-slate-400 text-[11px]">{assignedHospital.address}</div>
                  <div className="text-slate-400 text-[11px] pt-1">
                    Available ICU Beds: <span className="text-rose-400 font-bold">{assignedHospital.availableIcuBeds}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Live Telemetry Map Card */}
          <div className="lg:col-span-2 space-y-4">
            <div className="glass-panel p-4 rounded-2xl border border-slate-800">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                    Live Telemetry Map (Bangalore Central)
                  </h3>
                </div>
                <span className="text-[11px] text-slate-400">
                  {isSimulatingGps ? 'GPS Broadcast: Active' : 'GPS Broadcast: Paused'}
                </span>
              </div>

              <LeafletMap
                center={[activeEmergency.pickupLocation.lat, activeEmergency.pickupLocation.lng]}
                zoom={13}
                ambulances={assignedAmbulance ? [assignedAmbulance] : ambulances}
                emergencies={[activeEmergency]}
                hospitals={assignedHospital ? [assignedHospital] : hospitals}
                routeCoordinates={routeCoords}
                height="500px"
                onSelectLocation={(coords) => setSelectedCoords(coords)}
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="glass-panel p-12 rounded-2xl text-center border border-slate-800">
          <Activity className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white">No Active Emergency In Progress</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Click the "Report New Emergency" button above or trigger a simulated SOS to watch the full emergency routing workflow.
          </p>
        </div>
      )}
    </div>
  );
};
