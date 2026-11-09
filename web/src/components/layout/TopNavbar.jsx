import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useEmergency } from '../../context/EmergencyContext';
import {
  Menu,
  Bell,
  Play,
  Pause,
  RotateCcw,
  FastForward,
  ChevronRight,
  User,
  LogOut,
  ChevronDown,
  Radio,
  Sparkles,
  CheckCheck,
  ExternalLink,
} from 'lucide-react';

export const TopNavbar = ({ onOpenSidebar }) => {
  const { currentUser, role, switchRole, logout } = useAuth();
  const {
    isSimulatingGps,
    setIsSimulatingGps,
    advanceSimulationStep,
    resetAllData,
    notifications,
    markAllRead,
  } = useEmergency();

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const location = useLocation();
  const navigate = useNavigate();
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);

  // Generate readable breadcrumb trail
  const pathParts = location.pathname.split('/').filter(Boolean);
  const formatBreadcrumb = (str) =>
    str.replace('-', ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  const handleRoleSelect = (targetRole, defaultRoute) => {
    switchRole(targetRole);
    setShowRoleMenu(false);
    navigate(defaultRoute);
  };

  return (
    <header className="sticky top-0 z-30 h-16 glass-panel border-b border-slate-800 px-4 sm:px-6 flex items-center justify-between">
      {/* Left: Mobile Toggle & Breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenSidebar}
          className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white lg:hidden"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Breadcrumb Trail */}
        <nav aria-label="Breadcrumb" className="hidden sm:flex items-center gap-1.5 text-xs">
          <Link to="/" className="text-slate-400 hover:text-slate-200 transition-colors">
            PulseRoute
          </Link>
          {pathParts.map((part, index) => (
            <React.Fragment key={index}>
              <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
              <span
                className={`${
                  index === pathParts.length - 1 ? 'font-bold text-white' : 'text-slate-400'
                }`}
              >
                {formatBreadcrumb(part)}
              </span>
            </React.Fragment>
          ))}
        </nav>
      </div>

      {/* Right: Simulation Controls, Notifications, Role Switcher */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Academic Demo Disclaimer Pill */}
        <span className="hidden xl:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[11px] font-bold text-amber-300">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
          Demo Mode • Not Live Emergency Dispatch
        </span>

        {/* Simulation Controls Pill */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-900/90 border border-slate-800 text-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 hidden sm:flex items-center gap-1">
            <Radio className="w-3 h-3 text-emerald-400 animate-pulse" /> Sim GPS:
          </span>
          <button
            onClick={() => setIsSimulatingGps(!isSimulatingGps)}
            title={isSimulatingGps ? 'Pause GPS Telemetry' : 'Resume GPS Telemetry'}
            className="p-1 rounded hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
          >
            {isSimulatingGps ? (
              <Pause className="w-3.5 h-3.5 text-amber-400" />
            ) : (
              <Play className="w-3.5 h-3.5 text-emerald-400" />
            )}
          </button>
          <button
            onClick={advanceSimulationStep}
            title="Step GPS Movement"
            className="p-1 rounded hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
          >
            <FastForward className="w-3.5 h-3.5 text-sky-400" />
          </button>
          <button
            onClick={resetAllData}
            title="Reset Simulation Scenario"
            className="p-1 rounded hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
          </button>
        </div>

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifMenu(!showNotifMenu)}
            className="relative p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-colors"
            aria-label="View notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifMenu && (
            <div className="absolute right-0 mt-2 w-80 glass-panel-elevated rounded-2xl border border-slate-700 shadow-2xl z-50 animate-in fade-in zoom-in-95 overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
                <div>
                  <span className="text-xs font-bold text-white uppercase tracking-wider">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="ml-2 px-1.5 py-0.5 rounded-full bg-rose-600/20 text-rose-300 text-[10px] font-bold">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="flex items-center gap-1 text-[10px] text-sky-400 hover:text-sky-300 transition-colors"
                    title="Mark all as read"
                  >
                    <CheckCheck className="w-3 h-3" />
                    Mark all read
                  </button>
                )}
              </div>

              {/* Notification list */}
              <div className="max-h-64 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="px-4 py-8 text-center text-slate-500 text-xs">No notifications</div>
                ) : (
                  notifications.slice(0, 6).map((n) => (
                    <div
                      key={n.id}
                      className={`px-4 py-3 border-b border-slate-800/60 last:border-0 text-xs transition-colors ${
                        n.isRead ? 'opacity-60' : 'bg-slate-900/40'
                      }`}
                    >
                      <div className={`font-semibold mb-0.5 ${
                        n.type === 'emergency' ? 'text-rose-300'
                        : n.type === 'warning' ? 'text-amber-300'
                        : n.type === 'success' ? 'text-emerald-300'
                        : 'text-sky-300'
                      }`}>{n.title}</div>
                      <div className="text-slate-300 text-[11px]">{n.message}</div>
                      <div className="text-[10px] text-slate-500 mt-1">{n.timestamp}</div>
                    </div>
                  ))
                )}
              </div>

              {/* Footer */}
              <div className="px-4 py-2.5 border-t border-slate-800 bg-slate-900/40">
                <Link
                  to="/notifications"
                  onClick={() => setShowNotifMenu(false)}
                  className="flex items-center justify-center gap-1.5 text-[11px] text-sky-400 hover:text-sky-300 font-medium transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                  View all notifications
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* 1-Click Role Switcher */}
        <div className="relative">
          <button
            onClick={() => setShowRoleMenu(!showRoleMenu)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-white hover:border-slate-700 transition-colors"
          >
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            <span>{role}</span>
            <ChevronDown className="w-3.5 h-3.5 opacity-70" />
          </button>

          {showRoleMenu && (
            <div className="absolute right-0 mt-2 w-64 glass-panel-elevated rounded-2xl p-2 border border-slate-700 shadow-2xl z-50">
              <div className="px-3 py-2 border-b border-slate-800 mb-1">
                <div className="text-[10px] uppercase font-bold text-slate-400">Current Role Profile</div>
                <div className="text-xs font-bold text-white truncate">{currentUser?.fullName}</div>
                <div className="text-[11px] text-slate-400 truncate">{currentUser?.email}</div>
              </div>

              <div className="py-1">
                <div className="text-[10px] uppercase font-bold text-slate-400 px-3 py-1">
                  Switch Active Role
                </div>
                {[
                  { r: 'REPORTER', label: 'Citizen / Reporter', route: '/reporter/dashboard' },
                  { r: 'DRIVER', label: 'Ambulance Driver', route: '/driver/dashboard' },
                  { r: 'HOSPITAL', label: 'Hospital ER Staff', route: '/hospital/dashboard' },
                  { r: 'DISPATCHER', label: 'EMS Dispatcher', route: '/dashboard' },
                  { r: 'ADMIN', label: 'Dispatch Admin', route: '/admin/dashboard' },
                ].map((item) => (
                  <button
                    key={item.r}
                    onClick={() => handleRoleSelect(item.r, item.route)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium flex items-center justify-between transition-colors ${
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
                    navigate('/login');
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs font-medium text-rose-400 hover:bg-rose-500/10 flex items-center gap-2"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
