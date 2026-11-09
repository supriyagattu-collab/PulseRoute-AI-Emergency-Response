import React, { useState } from 'react';
import { useEmergency } from '../../context/EmergencyContext';
import { PriorityBadge, TierBadge } from '../../components/common/Badge';
import {
  Sparkles,
  Cpu,
  Navigation,
  Building2,
  Ambulance,
  AlertTriangle,
  Info,
  Clock,
  Gauge,
  Sliders,
  CheckCircle,
} from 'lucide-react';

export const AiAssistancePage = () => {
  const { hospitals, ambulances, evaluateTriage } = useEmergency();

  // 1. Triage Tester Interactive State
  const [testCategory, setTestCategory] = useState('CARDIAC');
  const [testConsciousness, setTestConsciousness] = useState('VERBAL');
  const [testChestPain, setTestChestPain] = useState(true);
  const [testSevereBleeding, setTestSevereBleeding] = useState(false);
  const [testSpo2, setTestSpo2] = useState(88);
  const [testHeartRate, setTestHeartRate] = useState(135);

  const triageResult = evaluateTriage(
    {
      consciousness: testConsciousness,
      chestPain: testChestPain,
      severeBleeding: testSevereBleeding,
      spO2: testSpo2,
      heartRate: testHeartRate,
    },
    testCategory
  );

  // 2. Ambulance Matching Scoring Engine (Simulated Distance & Tier Utility)
  const rankedAmbulances = ambulances
    .map((amb) => {
      let score = 100;
      const reasons = [];

      // Availability check
      if (amb.status !== 'AVAILABLE') {
        score -= 50;
        reasons.push(`Currently ${amb.status} (-50 pts)`);
      } else {
        score += 20;
        reasons.push('Available immediately (+20 pts)');
      }

      // Tier matching
      if (amb.type === triageResult.vehicleTier) {
        score += 30;
        reasons.push(`Matches required ${triageResult.vehicleTier} tier (+30 pts)`);
      } else {
        score -= 20;
        reasons.push(`Mismatched tier (${amb.type} vs ${triageResult.vehicleTier}) (-20 pts)`);
      }

      // Simulated proximity penalty
      const simulatedDistKm = Number((2.5 + Math.random() * 5).toFixed(1));
      score -= Math.round(simulatedDistKm * 4);
      reasons.push(`Proximity: ~${simulatedDistKm} km`);

      return {
        ...amb,
        matchScore: Math.max(10, score),
        reasons,
        simulatedDistKm,
      };
    })
    .sort((a, b) => b.matchScore - a.matchScore);

  // 3. Hospital Recommendation Utility Function
  const rankedHospitals = hospitals
    .map((hosp) => {
      let utilityScore = 0;
      const criteria = [];

      // Bed availability weighting
      const icuWeight = hosp.availableIcuBeds * 12;
      utilityScore += icuWeight;
      criteria.push(`ICU Beds: ${hosp.availableIcuBeds} available (+${icuWeight} pts)`);

      const genWeight = hosp.availableGeneralBeds * 2;
      utilityScore += genWeight;
      criteria.push(`General Beds: ${hosp.availableGeneralBeds} available (+${genWeight} pts)`);

      // Facility capability
      if (testCategory === 'CARDIAC' && hosp.hasCathLab) {
        utilityScore += 25;
        criteria.push('Cardiac Cath Lab operational (+25 pts)');
      }
      if (testCategory === 'TRAUMA' && hosp.traumaLevel.includes('Level 1')) {
        utilityScore += 30;
        criteria.push('Level 1 Trauma capability (+30 pts)');
      }

      return {
        ...hosp,
        utilityScore,
        criteria,
      };
    })
    .sort((a, b) => b.utilityScore - a.utilityScore);

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="glass-panel p-6 rounded-3xl border border-purple-500/30 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 text-xs font-bold mb-2">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              Machine Learning & Decision Optimization Engine
            </div>
            <h1 className="text-2xl font-black text-white">AI Assistance & Recommendation Sandbox</h1>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Transparent, explainable decision algorithms for Emergency Priority Triage, Nearest Vehicle Allocation, and Multi-Criteria Hospital Ranking.
            </p>
          </div>

          <div className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-purple-300">
            Model: Multi-Class Decision Tree / RF (Simulated)
          </div>
        </div>
      </div>

      {/* Grid: Triage Tester vs Allocation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Module 1: Interactive Triage Classifier */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Cpu className="w-5 h-5 text-rose-500" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                1. Priority Triage Inference
              </h2>
            </div>
            <PriorityBadge priority={triageResult.priority} label={triageResult.priorityLabel} />
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Emergency Category</label>
              <select
                value={testCategory}
                onChange={(e) => setTestCategory(e.target.value)}
                className="w-full px-2.5 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white text-xs"
              >
                <option value="CARDIAC">Cardiac Emergency</option>
                <option value="TRAUMA">Road Trauma / Collision</option>
                <option value="RESPIRATORY">Severe Respiratory</option>
                <option value="INJURY">Minor Fall / Injury</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Consciousness (AVPU)</label>
              <select
                value={testConsciousness}
                onChange={(e) => setTestConsciousness(e.target.value)}
                className="w-full px-2.5 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white text-xs"
              >
                <option value="ALERT">Alert</option>
                <option value="VERBAL">Verbal Response Only</option>
                <option value="PAIN">Pain Response Only</option>
                <option value="UNRESPONSIVE">Unresponsive</option>
              </select>
            </div>
          </div>

          {/* Vitals Toggles */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
            <button
              onClick={() => setTestChestPain(!testChestPain)}
              className={`p-2 rounded-lg font-bold border transition-colors ${
                testChestPain
                  ? 'bg-rose-600/20 text-rose-300 border-rose-500/40'
                  : 'bg-slate-900 text-slate-500 border-slate-800'
              }`}
            >
              Chest Pain: {testChestPain ? 'YES' : 'NO'}
            </button>

            <button
              onClick={() => setTestSevereBleeding(!testSevereBleeding)}
              className={`p-2 rounded-lg font-bold border transition-colors ${
                testSevereBleeding
                  ? 'bg-rose-600/20 text-rose-300 border-rose-500/40'
                  : 'bg-slate-900 text-slate-500 border-slate-800'
              }`}
            >
              Hemorrhage: {testSevereBleeding ? 'YES' : 'NO'}
            </button>

            <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-500 block">SpO2 ({testSpo2}%)</span>
              <input
                type="range"
                min="75"
                max="100"
                value={testSpo2}
                onChange={(e) => setTestSpo2(Number(e.target.value))}
                className="w-full accent-rose-500"
              />
            </div>

            <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-500 block">Pulse ({testHeartRate} bpm)</span>
              <input
                type="range"
                min="40"
                max="180"
                value={testHeartRate}
                onChange={(e) => setTestHeartRate(Number(e.target.value))}
                className="w-full accent-rose-500"
              />
            </div>
          </div>

          {/* Explanation Box */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
            <div className="text-xs font-bold text-slate-300 flex items-center justify-between">
              <span>Model Decision Explainability:</span>
              <TierBadge tier={triageResult.vehicleTier} />
            </div>
            <ul className="space-y-1 text-[11px] text-slate-400">
              {triageResult.reasons.length > 0 ? (
                triageResult.reasons.map((r, i) => (
                  <li key={i} className="flex items-center gap-1.5 text-rose-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> {r}
                  </li>
                ))
              ) : (
                <li className="text-slate-500">Standard vitals. Routine priority recommended.</li>
              )}
            </ul>
          </div>
        </div>

        {/* Module 2: Ambulance Matching Recommender */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Ambulance className="w-5 h-5 text-amber-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                2. Optimal Vehicle Matching
              </h2>
            </div>
            <span className="text-xs text-slate-400">Ranked by Match Score</span>
          </div>

          <div className="space-y-3">
            {rankedAmbulances.slice(0, 3).map((amb, index) => (
              <div
                key={amb.id}
                className={`p-3.5 rounded-xl border transition-colors ${
                  index === 0
                    ? 'bg-amber-950/20 border-amber-500/40 shadow-sm'
                    : 'bg-slate-900/60 border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center ${
                        index === 0 ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-white'
                      }`}
                    >
                      #{index + 1}
                    </span>
                    <span className="font-bold text-xs text-white">{amb.vehicleNumber}</span>
                    <TierBadge tier={amb.type} />
                  </div>
                  <span className="text-xs font-black text-amber-400 font-mono">
                    Score: {amb.matchScore} pts
                  </span>
                </div>

                <div className="mt-2 text-[11px] text-slate-400 flex flex-wrap gap-2">
                  {amb.reasons.map((reason, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-300">
                      {reason}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Module 3: Hospital Utility Ranking */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-sky-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              3. Hospital Multi-Criteria Recommendation
            </h2>
          </div>
          <span className="text-xs text-slate-400">Trauma Level + Real-Time Bed Availability</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {rankedHospitals.map((hosp, rank) => (
            <div
              key={hosp.id}
              className={`p-4 rounded-xl border space-y-2 ${
                rank === 0
                  ? 'bg-sky-950/20 border-sky-500/40'
                  : 'bg-slate-900/60 border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider">
                    Recommendation #{rank + 1}
                  </span>
                  <h4 className="text-sm font-bold text-white">{hosp.name}</h4>
                </div>
                <span className="text-xs font-black text-sky-400 font-mono">
                  Utility: {hosp.utilityScore}
                </span>
              </div>

              <div className="text-xs text-slate-400">{hosp.traumaLevel}</div>

              <div className="pt-2 border-t border-slate-800/80 flex flex-wrap gap-1.5 text-[11px]">
                {hosp.criteria.map((c, i) => (
                  <span key={i} className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-300">
                    {c}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Scientific & Academic Disclaimer */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-start gap-3 text-xs text-slate-400">
        <Info className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-slate-200">Engineering & Viva Note: </span>
          The algorithms shown above evaluate multi-attribute utility theory (MAUT) and decision heuristic scoring. In Milestone 7, these heuristics will be coupled with Scikit-Learn trained classification pipelines.
        </div>
      </div>
    </div>
  );
};
