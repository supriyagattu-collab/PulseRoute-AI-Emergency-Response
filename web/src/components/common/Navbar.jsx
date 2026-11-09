import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useEmergency } from '../../context/EmergencyContext';
import {
  Activity,
  Ambulance,
  Building2,
  ShieldAlert,
  Play,
  Pause,
  RotateCcw,
  FastForward,
  User,
  LogOut,
  Bell,
  Radio,
  ChevronDown,
} from 'lucide-react';

export const Navbar = () => {
  const { currentUser, role, switchRole, logout, isAuthenticated } = useAuth();
  const {
    isSimulatingGps,
    setIsSimulatingGps,
    advanceSimulationStep,
    resetAllData,
    notifications,
  } = useEmergency();
  const location = useLocation();
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);

  const roleColors = {
    REPORTER: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
    DRIVER: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    HOSPITAL: 'text-sky-400 bg-sky-500/10 border-sky-500/30',
    ADMIN: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
  };

  const navLinks = [
    { label: 'Citizen SOS', path: '/reporter', role: 'REPORTER', icon: Activity },
    { label: 'Driver Nav', path: '/driver', role: 'DRIVER', icon: Ambulance },
    { label: 'ER Hospital', path: '/hospital', role: 'HOSPITAL', icon: Building2 },
    { label: 'Command Admin', path: '/admin', role: 'ADMIN', icon: ShieldAlert },
  ];

  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-slate-800/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 to-rose-400 flex items-center justify-center shadow-lg shadow-rose-600/30 group-hover:scale-105 transition-transform">
              <Activity className="w-6 h-6 text-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-lg tracking-tight text-white">PulseRoute</span>
                <span className="text-xs px-1.5 py-0.5 rounded font-black bg-rose-600 text-white tracking-wider">AI</span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium tracking-wide">Emergency Response & Fleet Routing</p>
            </div>
          </Link>

          {/* Navigation Items */}
          <nav className="hidden lg:flex items-center gap-1 pl-4 border-l border-slate-800">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-slate-800 text-white shadow-sm border border-slate-700'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-rose-400' : 'text-slate-400'}`} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right Action Tools: Simulation Controllers & Role Switcher */}
        <div className="flex items-center gap-3">
          {/* Quick Simulation Bar (For college viva & live demo) */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs">
            <span className="text-[10px] uppercase font-bold text-slate-400 mr-1 flex items-center gap-1">
              <Radio className="w-3 h-3 text-emerald-400 animate-pulse" /> Sim GPS:
            </span>
            <button
              onClick={() => setIsSimulatingGps(!isSimulatingGps)}
              title={isSimulatingGps ? 'Pause GPS Telemetry' : 'Resume GPS Telemetry'}
              className="p-1 rounded hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
            >
              {isSimulatingGps ? <Pause className="w-3.5 h-3.5 text-amber-400" /> : <Play className="w-3.5 h-3.5 text-emerald-400" />}
            </button>
            <button
              onClick={advanceSimulationStep}
              title="Step Vehicle Movement forward"
              className="p-1 rounded hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
            >
              <FastForward className="w-3.5 h-3.5 text-sky-400" />
            </button>
            <button
              onClick={resetAllData}
              title="Reset Demo Scenario"
              className="p-1 rounded hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
            </button>
          </div>

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowNotifMenu(!showNotifMenu)}
              className="relative p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <Bell className="w-4 h-4" />
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center">
                  {notifications.length}
                </span>
              )}
            </button>

            {showNotifMenu && (
              <div className="absolute right-0 mt-2 w-80 glass-panel-elevated rounded-xl p-3 border border-slate-700 shadow-2xl z-50 animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-2">
                  <span className="text-xs font-bold text-white uppercase tracking-wider">Live System Feed</span>
                  <span className="text-[10px] text-slate-400">{notifications.length} alerts</span>
                </div>
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {notifications.map((n) => (
                    <div key={n.id} className="p-2 rounded bg-slate-900/80 border border-slate-800 text-xs">
                      <div className="font-semibold text-rose-300">{n.title}</div>
                      <div className="text-slate-300 text-[11px] mt-0.5">{n.message}</div>
                      <div className="text-[10px] text-slate-500 mt-1">{n.timestamp}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Quick Role Switcher Pill */}
          <div className="relative">
            <button
              onClick={() => setShowRoleMenu(!showRoleMenu)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${
                roleColors[role] || 'text-slate-300 bg-slate-800 border-slate-700'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>{role}</span>
              <ChevronDown className="w-3 h-3 opacity-70" />
            </button>

            {showRoleMenu && (
              <div className="absolute right-0 mt-2 w-64 glass-panel-elevated rounded-xl p-2 border border-slate-700 shadow-2xl z-50">
                <div className="px-3 py-1.5 border-b border-slate-800 mb-1">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Signed In As</div>
                  <div className="text-xs font-bold text-white truncate">{currentUser?.fullName}</div>
                  <div className="text-[11px] text-slate-400 truncate">{currentUser?.email}</div>
                </div>

                <div className="py-1">
                  <div className="text-[10px] uppercase font-bold text-slate-400 px-3 py-1">Switch Active Role</div>
                  {[
                    { r: 'REPORTER', label: 'Citizen / Reporter', path: '/reporter' },
                    { r: 'DRIVER', label: 'Ambulance Driver', path: '/driver' },
                    { r: 'HOSPITAL', label: 'Hospital ER Staff', path: '/hospital' },
                    { r: 'ADMIN', label: 'Admin / Control Room', path: '/admin' },
                  ].map((item) => (
                    <button
                      key={item.r}
                      onClick={() => {
                        switchRole(item.r);
                        setShowRoleMenu(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between transition-colors ${
                        role === item.r
                          ? 'bg-rose-600/20 text-rose-300 font-bold'
                          : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <span>{item.label}</span>
                      {role === item.r && <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />}
                    </button>
                  ))}
                </div>

                <div className="pt-1 border-t border-slate-800">
                  <button
                    onClick={() => {
                      logout();
                      setShowRoleMenu(false);
                    }}
                    className="w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium text-rose-400 hover:bg-rose-500/10 flex items-center gap-2"
                  >
                    <LogOut className="w-3 h-3" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
