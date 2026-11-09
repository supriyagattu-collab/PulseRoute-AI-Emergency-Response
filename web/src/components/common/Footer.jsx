import React from 'react';
import { ShieldCheck, Cpu, MapPin, HeartPulse } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="border-t border-slate-800/80 bg-slate-950/80 text-slate-400 py-8 px-4 sm:px-6 lg:px-8 mt-12">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-rose-600/20 border border-rose-500/30 flex items-center justify-center">
            <HeartPulse className="w-4 h-4 text-rose-400" />
          </div>
          <div>
            <div className="text-sm font-bold text-white tracking-wide">
              PulseRoute AI • Emergency Response & Ambulance Routing
            </div>
            <div className="text-xs text-slate-500">
              B.Tech CSE (AI & ML) Capstone Engineering Prototype
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4 text-xs">
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300">
            <Cpu className="w-3.5 h-3.5 text-rose-400" /> ML Priority Triage
          </span>
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300">
            <MapPin className="w-3.5 h-3.5 text-sky-400" /> OpenStreetMap / Leaflet
          </span>
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Role-Based Access Control
          </span>
        </div>

        <div className="text-right text-xs text-slate-500">
          <p>Simulated Telemetry & Triage Engine</p>
          <p className="text-[11px] text-slate-600">For Educational & Evaluation Purposes Only</p>
        </div>
      </div>
    </footer>
  );
};
