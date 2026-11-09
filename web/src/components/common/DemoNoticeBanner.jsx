import React from 'react';
import { AlertTriangle, Info, PhoneCall } from 'lucide-react';

export const DemoNoticeBanner = ({ compact = false }) => {
  if (compact) {
    return (
      <div className="bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 rounded-lg flex items-center justify-between gap-2 text-[11px] text-amber-300">
        <div className="flex items-center gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>
            <strong>Demo Simulation:</strong> Powered by <code className="text-amber-200">pulseroute_health_facilities.csv</code> &amp; <code className="text-amber-200">pulseroute_ambulances_demo.csv</code>. Not connected to real emergency services.
          </span>
        </div>
        <div className="flex items-center gap-1 font-bold text-rose-400 shrink-0">
          <PhoneCall className="w-3 h-3" /> Real Emergency: Dial 108 / 112
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-amber-500/15 via-rose-500/10 to-amber-500/15 border border-amber-500/30 rounded-xl p-3 sm:p-4 mb-6 shadow-lg shadow-amber-950/20">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-amber-400 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs sm:text-sm font-bold text-amber-200 uppercase tracking-wide">
                Simulation &amp; Academic Demonstration Notice
              </h4>
              <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                Milestone 3
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
              PulseRoute is an experimental AI routing and emergency dispatch prototype utilizing local Telangana dataset records (
              <span className="text-amber-300 font-mono font-medium">pulseroute_health_facilities.csv</span> and{' '}
              <span className="text-amber-300 font-mono font-medium">pulseroute_ambulances_demo.csv</span>
              ). <strong>It is NOT connected to live emergency services.</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-rose-950/60 border border-rose-500/40 px-3 py-2 rounded-lg self-stretch sm:self-auto justify-center shrink-0">
          <PhoneCall className="w-4 h-4 text-rose-400 animate-bounce" />
          <div className="text-left">
            <div className="text-[10px] uppercase font-bold text-rose-300 tracking-wider">Real Emergency Call</div>
            <div className="text-xs font-black text-rose-200">Dial 108 or 112</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DemoNoticeBanner;
