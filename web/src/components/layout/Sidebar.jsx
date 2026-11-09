import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useEmergency } from '../../context/EmergencyContext';
import {
  Activity,
  Ambulance,
  Building2,
  ShieldAlert,
  Sparkles,
  MapPin,
  Clock,
  User,
  Radio,
  FileText,
  Compass,
  Bed,
  BarChart3,
  ListFilter,
  X,
  PhoneCall,
  CheckCircle2,
  Bell,
  Navigation,
  PlusCircle,
  Flame,
} from 'lucide-react';

export const Sidebar = ({ isOpen, onClose }) => {
  const { role, currentUser } = useAuth();
  const { notifications } = useEmergency();
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const milestone3Items = [
    { path: '/dashboard', label: 'Main Dashboard', icon: Activity },
    { path: '/report-emergency', label: 'Report Emergency (SOS)', icon: Flame },
    { path: '/ambulance-fleet', label: 'Ambulance Fleet (5 Units)', icon: Ambulance },
    { path: '/hospital-recommendations', label: 'Hospital Recommendations', icon: Building2 },
    { path: '/route-eta', label: 'Route & Live ETA', icon: Navigation },
    { path: '/emergency-history', label: 'Emergency History', icon: Clock },
  ];


  // Role-specific navigation links
  const menuConfig = {
    REPORTER: [
      { path: '/reporter/dashboard', label: 'Overview', icon: Activity },
      { path: '/reporter/emergency/new', label: 'Report Emergency / SOS', icon: PhoneCall },
      { path: '/reporter/tracking', label: 'Live Tracking', icon: Compass },
      { path: '/reporter/history', label: 'Past Emergencies', icon: Clock },
      { path: '/reporter/profile', label: 'My Profile', icon: User },
    ],
    DRIVER: [
      { path: '/driver/dashboard', label: 'Driver Cockpit', icon: Ambulance },
      { path: '/driver/requests', label: 'Incoming Requests', icon: Radio },
      { path: '/driver/active-trip', label: 'Active Trip Navigation', icon: Compass },
      { path: '/driver/history', label: 'Completed Runs', icon: CheckCircle2 },
      { path: '/driver/profile', label: 'Driver Profile', icon: User },
    ],
    HOSPITAL: [
      { path: '/hospital/dashboard', label: 'Trauma Command', icon: Building2 },
      { path: '/hospital/incoming', label: 'Inbound Ambulances', icon: Ambulance },
      { path: '/hospital/capacity', label: 'Bed Capacity Hub', icon: Bed },
      { path: '/hospital/profile', label: 'Hospital Facility', icon: User },
    ],
    DISPATCHER: [
      { path: '/dashboard', label: 'Dispatch Overview', icon: Activity },
      { path: '/admin/emergencies', label: 'Emergency Incidents', icon: Flame },
      { path: '/ambulance-fleet', label: 'Ambulance Fleet', icon: Ambulance },
      { path: '/hospital-recommendations', label: 'Hospital Network', icon: Building2 },
      { path: '/route-eta', label: 'Route & Live ETA', icon: Navigation },
      { path: '/emergency-history', label: 'Emergency History', icon: Clock },
    ],
    ADMIN: [
      { path: '/admin/dashboard', label: 'Dispatch Overview', icon: ShieldAlert },
      { path: '/admin/emergencies', label: 'Emergency Incidents', icon: Activity },
      { path: '/admin/ambulances', label: 'Ambulance Fleet', icon: Ambulance },
      { path: '/admin/drivers', label: 'Driver Registry', icon: User },
      { path: '/admin/hospitals', label: 'Hospital Network', icon: Building2 },
      { path: '/admin/monitoring', label: 'Live Spatial Map', icon: MapPin },
      { path: '/admin/analytics', label: 'Analytics & Insights', icon: BarChart3 },
      { path: '/admin/activity', label: 'Audit Activity Log', icon: FileText },
    ],
  };

  const navItems = menuConfig[role] || menuConfig.ADMIN;

  const roleLabels = {
    REPORTER: 'Citizen Portal',
    PATIENT: 'Citizen Portal',
    DRIVER: 'Ambulance Unit',
    HOSPITAL: 'Hospital Trauma Hub',
    DISPATCHER: 'Emergency Dispatcher',
    ADMIN: 'Central Dispatch Command',
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Aside */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 glass-panel border-r border-slate-800 flex flex-col justify-between transition-transform duration-200 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          {/* Brand Header */}
          <div className="h-16 px-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-rose-600 flex items-center justify-center shadow-lg shadow-rose-600/30">
                <Activity className="w-5 h-5 text-white animate-pulse" />
              </div>
              <div>
                <span className="font-extrabold text-sm text-white tracking-tight">PulseRoute</span>
                <span className="text-[10px] ml-1 px-1 rounded font-black bg-rose-600 text-white">AI</span>
                <div className="text-[10px] text-slate-400 font-medium">{roleLabels[role]}</div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white lg:hidden"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <div className="p-3 space-y-1">
            <div className="text-[10px] uppercase font-bold text-rose-400 px-3 py-1 tracking-wider flex items-center justify-between">
              <span>Milestone 3 Modules</span>
              <span className="text-[9px] px-1 rounded bg-rose-500/20 text-rose-300">Live Datasets</span>
            </div>
            {milestone3Items.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-rose-600/20 text-rose-300 border border-rose-500/30 shadow-sm'
                        : 'text-slate-300 hover:text-white hover:bg-slate-900/60'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0 text-rose-400" />
                  <span className="truncate">{item.label}</span>
                </NavLink>
              );
            })}

            <div className="text-[10px] uppercase font-bold text-slate-500 px-3 pt-3 pb-1 tracking-wider">
              Role Views
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-slate-800 text-slate-200 border border-slate-700 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
                    }`
                  }
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </NavLink>
              );
            })}


            {/* AI Assistant Sandbox Link */}
            <div className="pt-2 border-t border-slate-800/80 mt-2 space-y-1">
              <NavLink
                to="/ai-assistance"
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                      : 'text-purple-400/90 hover:text-purple-300 hover:bg-purple-950/20'
                  }`
                }
              >
                <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
                <span>AI Assistance Sandbox</span>
              </NavLink>

              {/* Notifications Link */}
              <NavLink
                to="/notifications"
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-sky-600/20 text-sky-300 border border-sky-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                  }`
                }
              >
                <Bell className="w-4 h-4 shrink-0" />
                <span className="flex-1">Notifications</span>
                {unreadCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-bold">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </NavLink>
            </div>
          </div>
        </div>

        {/* User Card at bottom of sidebar */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/40">
          <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center gap-3">
            <img
              src={currentUser?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
              alt={currentUser?.fullName}
              className="w-8 h-8 rounded-full object-cover border border-slate-700"
            />
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-white truncate">{currentUser?.fullName}</div>
              <div className="text-[10px] text-slate-400 truncate">{currentUser?.role}</div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
