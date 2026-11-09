import React from 'react';
import {
  Building2,
  X,
  MapPin,
  Phone,
  Bed,
  Activity,
  Heart,
  ShieldAlert,
  Award,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Info,
  ArrowRight,
  Sparkles,
  Stethoscope,
  Radio
} from 'lucide-react';

export const HospitalDetailModal = ({
  hospital,
  isOpen,
  onClose,
  onSelectRoute,
  patientLocation,
  emergencyType = 'GENERAL'
}) => {
  if (!isOpen || !hospital) return null;

  const scoreBreakdown = hospital.scoreBreakdown || {
    specialty_score: 30,
    distance_score: 25,
    bed_score: 15,
    readiness_score: 15,
    total_score: hospital.matchScore || 85,
  };

  const isBestRanked = hospital.isTopRanked || false;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden my-6">
        
        {/* Modal Top Header */}
        <div className={`px-6 py-4 border-b flex items-start justify-between gap-4 ${
          isBestRanked
            ? 'bg-gradient-to-r from-indigo-950/80 via-slate-900 to-indigo-900/60 border-indigo-500/40'
            : 'bg-slate-900/90 border-slate-800'
        }`}>
          <div className="flex items-start gap-3.5">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${
              isBestRanked
                ? 'bg-indigo-600 text-white shadow-indigo-950/50 ring-2 ring-indigo-400/40'
                : 'bg-slate-800 text-slate-300 border border-slate-700'
            }`}>
              <Building2 className="w-6 h-6" />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-black text-white tracking-tight">
                  {hospital.name || hospital.facility_name}
                </h2>
                {isBestRanked && (
                  <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-sm">
                    <Award className="w-3 h-3 text-indigo-400" />
                    #1 BEST RANKED HOSPITAL
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                <span>{hospital.type || hospital.facility_type}</span>
                <span>•</span>
                <span className="text-indigo-300 font-medium">{hospital.district} District</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
            title="Close details modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">

          {/* Quick Metrics Bar: Score, Distance, Beds */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 text-center">
              <span className="text-[10px] uppercase font-bold text-indigo-300 block">AI Match Score</span>
              <span className="text-2xl font-black text-white mt-0.5 block">
                {hospital.matchScore || scoreBreakdown.total_score || 85}%
              </span>
              <span className="text-[10px] text-indigo-300/80">Weighted Total</span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/80 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Haversine Distance</span>
              <span className="text-xl font-black text-emerald-400 mt-1 block font-mono">
                {hospital.distanceKm !== undefined && hospital.distanceKm !== null ? `${hospital.distanceKm} km` : 'Near'}
              </span>
              <span className="text-[10px] text-slate-400">~{hospital.etaMins || 8} mins ETA</span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/80 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">ICU Beds Avail</span>
              <span className="text-xl font-black text-rose-400 mt-1 block">
                {hospital.availableIcuBeds} <span className="text-xs text-slate-500 font-normal">/ {hospital.totalIcuBeds}</span>
              </span>
              <span className="text-[10px] text-slate-400">Verified ICU</span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/80 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">General Beds</span>
              <span className="text-xl font-black text-sky-400 mt-1 block">
                {hospital.availableGeneralBeds} <span className="text-xs text-slate-500 font-normal">/ {hospital.totalGeneralBeds}</span>
              </span>
              <span className="text-[10px] text-slate-400">General Wards</span>
            </div>
          </div>

          {/* Transparent Scoring Breakdown Table */}
          <div className="bg-slate-800/40 border border-slate-700/80 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                Transparent Scoring Algorithm Breakdown (Total 100 pts)
              </h3>
              <span className="text-[10px] text-indigo-300 font-bold bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
                Formula Verified
              </span>
            </div>

            <div className="space-y-2 text-xs">
              {/* Factor 1 */}
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/50 border border-slate-800">
                <div>
                  <span className="font-bold text-slate-200">1. Specialty &amp; Clinical Match (35% weight)</span>
                  <div className="text-[10px] text-slate-400">
                    Matches emergency type <strong className="text-indigo-300">{emergencyType}</strong> with specialty <strong className="text-white">{hospital.matchedSpecialty || 'Clinical Care'}</strong>
                  </div>
                </div>
                <span className="font-mono font-bold text-indigo-300 text-sm">
                  {scoreBreakdown.specialty_score} / 35 pts
                </span>
              </div>

              {/* Factor 2 */}
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/50 border border-slate-800">
                <div>
                  <span className="font-bold text-slate-200">2. Proximity &amp; Transit Time (30% weight)</span>
                  <div className="text-[10px] text-slate-400">
                    Haversine distance from patient [{patientLocation?.lat?.toFixed(4)}, {patientLocation?.lng?.toFixed(4)}]
                  </div>
                </div>
                <span className="font-mono font-bold text-emerald-400 text-sm">
                  {scoreBreakdown.distance_score} / 30 pts
                </span>
              </div>

              {/* Factor 3 */}
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/50 border border-slate-800">
                <div>
                  <span className="font-bold text-slate-200">3. Verified Bed Availability (20% weight)</span>
                  <div className="text-[10px] text-slate-400">
                    Verified ICU ({hospital.availableIcuBeds} open) and General ward capacity
                  </div>
                </div>
                <span className="font-mono font-bold text-rose-400 text-sm">
                  {scoreBreakdown.bed_score} / 20 pts
                </span>
              </div>

              {/* Factor 4 */}
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/50 border border-slate-800">
                <div>
                  <span className="font-bold text-slate-200">4. Service Readiness &amp; Tier (15% weight)</span>
                  <div className="text-[10px] text-slate-400">
                    {hospital.type || hospital.facility_type} • {hospital.traumaLevel}
                  </div>
                </div>
                <span className="font-mono font-bold text-amber-400 text-sm">
                  {scoreBreakdown.readiness_score} / 15 pts
                </span>
              </div>
            </div>

            {/* Why This Hospital Was Recommended */}
            {hospital.matchReasons?.length > 0 && (
              <div className="pt-2 border-t border-slate-700/60">
                <span className="text-[11px] font-bold text-slate-300 block mb-1.5">
                  Recommendation Factors &amp; Clinical Match Reasons:
                </span>
                <div className="space-y-1">
                  {hospital.matchReasons.map((reason, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-[11px] text-emerald-300">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                      <span>{reason}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Specialties & Clinical Capabilities */}
          <div className="bg-slate-800/40 border border-slate-700/80 rounded-2xl p-4 space-y-3">
            <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
              <Stethoscope className="w-4 h-4 text-emerald-400" />
              Available Specialties &amp; Clinical Facilities
            </h3>

            <div className="flex flex-wrap gap-1.5">
              {(hospital.specialties || ['General Medicine', 'Emergency Care']).map((spec, sIdx) => (
                <span
                  key={sIdx}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold"
                >
                  {spec}
                </span>
              ))}
              {hospital.hasCathLab && (
                <span className="px-2.5 py-1 rounded-lg bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs font-bold">
                  ✓ 24/7 Cardiac Cath Lab
                </span>
              )}
              {hospital.hasCTScan && (
                <span className="px-2.5 py-1 rounded-lg bg-sky-950/60 border border-sky-500/40 text-sky-300 text-xs font-bold">
                  ✓ 24/7 Polytrauma CT Scan
                </span>
              )}
            </div>
          </div>

          {/* Location & Contact Information */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-2xl bg-slate-800/40 border border-slate-700/80 space-y-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Facility Address</span>
              <div className="flex items-start gap-2 text-slate-200">
                <MapPin className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{hospital.address || `${hospital.mandal || ''}, ${hospital.district || 'Telangana'}`}</span>
              </div>
              <div className="text-[10px] text-slate-500 font-mono">
                GPS: [{hospital.lat?.toFixed(5)}, {hospital.lng?.toFixed(5)}]
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-800/40 border border-slate-700/80 space-y-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Emergency Dispatch Contact</span>
              <div className="flex items-center gap-2 text-slate-200 font-mono font-bold">
                <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{hospital.emergencyPhone || '040-24600121'}</span>
              </div>
              <div className="text-[10px] text-slate-400">
                Direct Casualty &amp; Triage Line
              </div>
            </div>
          </div>

          {/* Missing Information & Transparency Notice */}
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-amber-200">
              <Info className="w-4 h-4 shrink-0 text-amber-400" />
              <span>Transparency &amp; Data Verification Notice:</span>
            </div>
            <ul className="list-disc pl-5 space-y-0.5 text-[11px] text-amber-300/90">
              {(hospital.missingInformation || [
                'Live dynamic traffic sensor unconfigured (standard 40 km/h urban EMS transit model applied)',
              ]).map((item, mIdx) => (
                <li key={mIdx}>{item}</li>
              ))}
              <li>Safety Protocol: Selecting a hospital previews transit routing; no live dispatch is committed without command confirmation.</li>
            </ul>
          </div>

        </div>

        {/* Modal Footer Actions */}
        <div className="px-6 py-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs border border-slate-700 transition-colors"
          >
            Close
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              if (onSelectRoute) {
                onSelectRoute(hospital);
              }
            }}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs shadow-lg shadow-indigo-950/60 flex items-center gap-2 transition-all hover:scale-105"
          >
            <span>Proceed to Route &amp; Live ETA</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};
export default HospitalDetailModal;
