import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useEmergency } from '../context/EmergencyContext';
import {
  Activity,
  Ambulance,
  Building2,
  ShieldAlert,
  ArrowRight,
  Clock,
  Cpu,
  MapPin,
  CheckCircle2,
  TrendingDown,
  Sparkles,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  LogIn,
  UserPlus,
} from 'lucide-react';

export const LandingPage = () => {
  const { switchRole } = useAuth();
  const { emergencies, ambulances, hospitals } = useEmergency();
  const navigate = useNavigate();

  const [openFaq, setOpenFaq] = useState(null);

  const handleQuickLaunch = (roleKey, targetPath) => {
    switchRole(roleKey);
    navigate(targetPath);
  };

  const activeEmergenciesCount = emergencies.filter((e) => e.status !== 'RESOLVED').length;
  const availableAmbulancesCount = ambulances.filter((a) => a.status === 'AVAILABLE').length;

  const faqs = [
    {
      q: 'How does the AI Triage model classify urgency?',
      a: 'The triage system processes real-time patient indicators (AVPU consciousness scale, heart rate, oxygen saturation, acute chest pain, and severe hemorrhaging) using multi-class decision trees to estimate priority from Code Red (P1 Critical) to Code Green (P4 Routine).',
    },
    {
      q: 'Is this system connected to real-world 108/911 emergency services?',
      a: 'No. This is an engineering capstone prototype built for educational demonstration, placement interviews, and research. All GPS telematics, dispatch notifications, and hospital beds are realistically simulated.',
    },
    {
      q: 'How does ambulance-to-incident matching work?',
      a: 'The dispatch algorithm evaluates distance, vehicle equipment tier (ALS vs BLS), and driver availability to minimize response times and avoid diverting under-equipped units to critical cardiac cases.',
    },
    {
      q: 'Can hospital emergency staff prepare trauma bays before the ambulance arrives?',
      a: 'Yes! The Hospital Dashboard provides live telemetry of incoming ambulances, expected arrival ETAs, and patient pre-arrival vitals so ICU and cardiac teams can mobilize in advance.',
    },
  ];

  return (
    <div className="space-y-16 pb-12">
      {/* Top Public Header Bar for Landing Page */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-rose-600 flex items-center justify-center text-white shadow-lg shadow-rose-600/30">
            <Activity className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <span className="font-extrabold text-base text-white tracking-tight">PulseRoute</span>
            <span className="text-[10px] ml-1 px-1.5 py-0.5 rounded font-black bg-rose-600 text-white">AI</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-white font-bold text-xs flex items-center gap-1.5 transition-colors"
          >
            <LogIn className="w-3.5 h-3.5 text-slate-400" /> Sign In
          </Link>
          <Link
            to="/register"
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-rose-600/30 transition-all"
          >
            <UserPlus className="w-3.5 h-3.5" /> Register
          </Link>
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-8 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-rose-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 left-1/4 w-80 h-80 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold mb-6">
            <Sparkles className="w-3.5 h-3.5 text-rose-400" />
            AI-Powered Smart Emergency Telematics & Dispatch
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight sm:leading-tight mb-6">
            Seconds Save Lives. <br />
            <span className="bg-gradient-to-r from-rose-400 via-rose-500 to-amber-400 bg-clip-text text-transparent">
              Intelligent Routing
            </span>{' '}
            For Medical Emergencies.
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-300 font-normal mb-8 leading-relaxed">
            A cohesive platform connecting <span className="text-white font-semibold">Citizens</span>,{' '}
            <span className="text-white font-semibold">Ambulances</span>,{' '}
            <span className="text-white font-semibold">Hospital Trauma Centers</span>, and{' '}
            <span className="text-white font-semibold">Central Dispatchers</span> with real-time AI triage and dynamic GPS navigation.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/dashboard"
              className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold text-sm shadow-xl shadow-rose-600/30 flex items-center gap-2 transform hover:-translate-y-0.5 transition-all"
            >
              <Activity className="w-4 h-4 animate-pulse" />
              Launch Milestone 3 Dashboard
            </Link>
            <Link
              to="/report-emergency"
              className="px-5 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold text-sm border border-slate-700 flex items-center gap-2 transform hover:-translate-y-0.5 transition-all"
            >
              <Ambulance className="w-4 h-4 text-rose-400" />
              Report Emergency (SOS)
            </Link>
            <Link
              to="/hospital-recommendations"
              className="px-5 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold text-sm border border-slate-700 flex items-center gap-2 transform hover:-translate-y-0.5 transition-all"
            >
              <Building2 className="w-4 h-4 text-indigo-400" />
              Hospital Recommender
            </Link>
          </div>
        </div>
      </section>


      {/* Live System Pulse Metrics */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="glass-panel p-5 rounded-2xl border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Average Response</span>
              <TrendingDown className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white">7.4 min</div>
            <div className="text-xs text-emerald-400 mt-1 flex items-center gap-1">
              <span>↓ 38% faster than conventional</span>
            </div>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Active Emergencies</span>
              <Activity className="w-4 h-4 text-rose-400 animate-pulse" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white">{activeEmergenciesCount}</div>
            <div className="text-xs text-rose-300 mt-1">Under active dispatch</div>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Fleet Readiness</span>
              <Ambulance className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white">
              {availableAmbulancesCount}/{ambulances.length}
            </div>
            <div className="text-xs text-slate-400 mt-1">Available for instant dispatch</div>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Hospital Sync</span>
              <Building2 className="w-4 h-4 text-sky-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white">{hospitals.length} Centers</div>
            <div className="text-xs text-sky-400 mt-1">Live bed telemetry online</div>
          </div>
        </div>
      </section>

      {/* Role-Based Gateway Cards */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-white">Interactive Role Dashboards</h2>
          <p className="text-sm text-slate-400">
            Click any role to test the specialized interface and live mock workflows
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Reporter */}
          <div className="glass-panel hover:glass-panel-elevated p-6 rounded-2xl border border-slate-800 hover:border-rose-500/50 transition-all flex flex-col justify-between group">
            <div>
              <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mb-4 text-rose-400 group-hover:scale-110 transition-transform">
                <Activity className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Citizen / Reporter</h3>
              <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                One-tap SOS, intelligent symptom triage intake, and real-time ambulance ETA tracking.
              </p>
            </div>
            <button
              onClick={() => handleQuickLaunch('REPORTER', '/reporter/dashboard')}
              className="w-full py-2.5 px-3 rounded-lg bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-all"
            >
              Launch SOS Portal <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Driver */}
          <div className="glass-panel hover:glass-panel-elevated p-6 rounded-2xl border border-slate-800 hover:border-amber-500/50 transition-all flex flex-col justify-between group">
            <div>
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-4 text-amber-400 group-hover:scale-110 transition-transform">
                <Ambulance className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Ambulance Driver</h3>
              <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                Dispatch alerts, turn-by-turn navigation map, and tactile status toggle (En-Route, On-Scene, Hospital).
              </p>
            </div>
            <button
              onClick={() => handleQuickLaunch('DRIVER', '/driver/dashboard')}
              className="w-full py-2.5 px-3 rounded-lg bg-amber-600/20 hover:bg-amber-600 text-amber-300 hover:text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-all"
            >
              Launch Driver Nav <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Hospital Staff */}
          <div className="glass-panel hover:glass-panel-elevated p-6 rounded-2xl border border-slate-800 hover:border-sky-500/50 transition-all flex flex-col justify-between group">
            <div>
              <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center mb-4 text-sky-400 group-hover:scale-110 transition-transform">
                <Building2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Hospital ER Staff</h3>
              <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                Live incoming trauma pipeline, pre-arrival patient vitals, and ICU/general emergency bed management.
              </p>
            </div>
            <button
              onClick={() => handleQuickLaunch('HOSPITAL', '/hospital/dashboard')}
              className="w-full py-2.5 px-3 rounded-lg bg-sky-600/20 hover:bg-sky-600 text-sky-300 hover:text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-all"
            >
              Launch ER Hub <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Control Room Admin */}
          <div className="glass-panel hover:glass-panel-elevated p-6 rounded-2xl border border-slate-800 hover:border-emerald-500/50 transition-all flex flex-col justify-between group">
            <div>
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mb-4 text-emerald-400 group-hover:scale-110 transition-transform">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Command Admin</h3>
              <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                City-wide fleet telemetry map, active emergency queue, manual override, and response analytics.
              </p>
            </div>
            <button
              onClick={() => handleQuickLaunch('ADMIN', '/admin/dashboard')}
              className="w-full py-2.5 px-3 rounded-lg bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-all"
            >
              Launch Dispatch HQ <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300 text-xs font-semibold mb-2">
            <HelpCircle className="w-3.5 h-3.5 text-rose-500" /> Frequently Asked Questions
          </div>
          <h2 className="text-2xl font-bold text-white">System Architecture & Viva Queries</h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="glass-panel rounded-2xl border border-slate-800 overflow-hidden"
            >
              <button
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="w-full p-4 text-left flex items-center justify-between text-xs sm:text-sm font-bold text-white hover:text-rose-300 transition-colors"
              >
                <span>{faq.q}</span>
                {openFaq === idx ? (
                  <ChevronUp className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                )}
              </button>
              {openFaq === idx && (
                <div className="px-4 pb-4 text-xs text-slate-300 leading-relaxed border-t border-slate-800/60 pt-3">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
