import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEmergency } from '../../context/EmergencyContext';
import { useAuth } from '../../context/AuthContext';
import { LeafletMap } from '../../components/common/LeafletMap';
import { PriorityBadge } from '../../components/common/Badge';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import {
  AlertTriangle,
  HeartPulse,
  Sparkles,
  MapPin,
  CheckCircle2,
  Clock,
  ShieldAlert,
} from 'lucide-react';

export const ReporterNewEmergency = () => {
  const { currentUser } = useAuth();
  const { createEmergency, evaluateTriage } = useEmergency();
  const navigate = useNavigate();

  const [patientName, setPatientName] = useState('Priya Sharma (Self)');
  const [emergencyType, setEmergencyType] = useState('CARDIAC');
  const [consciousness, setConsciousness] = useState('ALERT');
  const [chestPain, setChestPain] = useState(true);
  const [severeBleeding, setSevereBleeding] = useState(false);
  const [spO2, setSpO2] = useState(91);
  const [heartRate, setHeartRate] = useState(118);
  const [bloodPressure, setBloodPressure] = useState('145/95');
  const [address, setAddress] = useState('Indiranagar 100ft Road, Bangalore');
  const [selectedCoords, setSelectedCoords] = useState({ lat: 12.9719, lng: 77.6412 });
  const [notes, setNotes] = useState('Severe chest pain radiating to left arm.');
  const [isSosConfirmOpen, setIsSosConfirmOpen] = useState(false);

  const preview = evaluateTriage(
    {
      consciousness,
      chestPain,
      severeBleeding,
      spO2,
      heartRate,
    },
    emergencyType
  );

  const handleFormSubmit = (e) => {
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
    navigate('/reporter/tracking');
  };

  const handleOneTapSos = () => {
    createEmergency({
      patientName: `${currentUser?.fullName || 'Citizen'} (Instant SOS)`,
      reporterName: currentUser?.fullName || 'Priya Sharma',
      reporterPhone: currentUser?.phone || '+91 98765 43210',
      emergencyType: 'CARDIAC',
      vitals: {
        consciousness: 'ALERT',
        chestPain: true,
        severeBleeding: false,
        spO2: 90,
        heartRate: 130,
        bloodPressure: '150/100',
      },
      pickupLocation: {
        address: 'Current Geolocation (Indiranagar, Bangalore)',
        lat: 12.9719,
        lng: 77.6412,
      },
      notes: 'Instant One-Tap SOS triggered by citizen.',
    });
    navigate('/reporter/tracking');
  };

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Report New Emergency</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Submit patient symptoms and geolocation for instantaneous AI-assisted ambulance assignment
          </p>
        </div>

        {/* Big One-Tap SOS Quick Action */}
        <button
          onClick={() => setIsSosConfirmOpen(true)}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-black text-xs shadow-lg shadow-rose-600/40 flex items-center gap-2 transform hover:scale-105 transition-all"
        >
          <span className="w-2 h-2 rounded-full bg-white animate-ping" />
          ⚡ ONE-TAP CRITICAL SOS
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Form */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleFormSubmit} className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-5">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <HeartPulse className="w-4 h-4 text-rose-500" /> Patient Profile & Category
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Patient Name / Identifier</label>
                <input
                  type="text"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Emergency Category</label>
                <select
                  value={emergencyType}
                  onChange={(e) => setEmergencyType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs"
                >
                  <option value="CARDIAC">Cardiac Emergency / Chest Pain</option>
                  <option value="TRAUMA">Road Traffic Collision / Severe Trauma</option>
                  <option value="RESPIRATORY">Breathing Difficulty / Hypoxia</option>
                  <option value="INJURY">Fall / Fracture / Physical Injury</option>
                  <option value="STROKE">Stroke / Sudden Paralysis</option>
                  <option value="BURN">Fire-related / Medical Burns</option>
                  <option value="OTHER">Other Acute Medical Emergency</option>
                </select>
              </div>
            </div>

            {/* Vitals Grid */}
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Vitals & Clinical Indicators (AVPU Scale)
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <label className="block text-[10px] text-slate-500 mb-1">Consciousness</label>
                  <select
                    value={consciousness}
                    onChange={(e) => setConsciousness(e.target.value)}
                    className="w-full px-2 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs"
                  >
                    <option value="ALERT">Alert</option>
                    <option value="VERBAL">Verbal</option>
                    <option value="PAIN">Pain</option>
                    <option value="UNRESPONSIVE">Unresponsive</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-500 mb-1">Acute Chest Pain?</label>
                  <button
                    type="button"
                    onClick={() => setChestPain(!chestPain)}
                    className={`w-full py-1.5 rounded-lg font-bold ${
                      chestPain ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {chestPain ? 'YES' : 'NO'}
                  </button>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-500 mb-1">Severe Bleeding?</label>
                  <button
                    type="button"
                    onClick={() => setSevereBleeding(!severeBleeding)}
                    className={`w-full py-1.5 rounded-lg font-bold ${
                      severeBleeding ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {severeBleeding ? 'YES' : 'NO'}
                  </button>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-500 mb-1">SpO2 Oxygen (%)</label>
                  <input
                    type="number"
                    value={spO2}
                    onChange={(e) => setSpO2(Number(e.target.value))}
                    className="w-full px-2 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Location & Notes */}
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Pickup Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Incident Notes / Landmarks</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs resize-none"
                />
              </div>
            </div>

            {/* Submit */}
            <div className="pt-2 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">
                Click map to select exact GPS coordinates
              </span>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/30 transition-all flex items-center gap-2"
              >
                <HeartPulse className="w-4 h-4" /> Dispatch Ambulance
              </button>
            </div>
          </form>
        </div>

        {/* Right Col: Interactive Map Picker & AI Preview */}
        <div className="space-y-5">
          {/* AI Live Preview Card */}
          <div className="glass-panel p-5 rounded-2xl border border-purple-500/30 space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Simulated AI Triage Assessment
              </h3>
            </div>

            <div className="flex items-center justify-between py-2 border-y border-slate-800">
              <span className="text-xs text-slate-400">Assessed Priority:</span>
              <PriorityBadge priority={preview.priority} label={preview.priorityLabel} />
            </div>

            <div className="text-xs text-slate-400 space-y-1">
              <div>
                Recommended Vehicle: <strong className="text-white">{preview.vehicleTier} Unit</strong>
              </div>
              <div>
                Predicted Transit Time: <strong className="text-emerald-400">~6-8 mins</strong>
              </div>
            </div>
          </div>

          {/* Location Picker Map */}
          <div className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-white flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-rose-500" /> Click to Set Pickup Pin
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                [{selectedCoords.lat.toFixed(4)}, {selectedCoords.lng.toFixed(4)}]
              </span>
            </div>

            <LeafletMap
              center={[selectedCoords.lat, selectedCoords.lng]}
              zoom={13}
              selectedLocation={selectedCoords}
              onSelectLocation={(coords) => setSelectedCoords(coords)}
              height="280px"
            />
          </div>
        </div>
      </div>

      {/* Confirmation Modal for One-Tap SOS */}
      <ConfirmDialog
        isOpen={isSosConfirmOpen}
        onClose={() => setIsSosConfirmOpen(false)}
        onConfirm={handleOneTapSos}
        title="Trigger Instant One-Tap SOS?"
        message="This will instantly dispatch the closest available Advanced Life Support (ALS) ambulance to your detected location."
        confirmText="Confirm SOS Dispatch"
        type="danger"
      />
    </div>
  );
};
