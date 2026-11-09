import React, { useState } from 'react';
import { useEmergency } from '../../context/EmergencyContext';
import {
  Bell,
  CheckCheck,
  Trash2,
  AlertTriangle,
  Info,
  CheckCircle,
  Zap,
  Clock,
  Circle,
} from 'lucide-react';

// ──────────────────────────────────────────────
// Helper: colour config per notification type
// ──────────────────────────────────────────────
const TYPE_CONFIG = {
  emergency: {
    border: 'border-l-rose-500',
    icon: <AlertTriangle className="w-4 h-4 text-rose-400" />,
    label: 'Emergency',
    labelClass: 'bg-rose-500/20 text-rose-300',
    titleClass: 'text-rose-300',
  },
  warning: {
    border: 'border-l-amber-500',
    icon: <Zap className="w-4 h-4 text-amber-400" />,
    label: 'Warning',
    labelClass: 'bg-amber-500/20 text-amber-300',
    titleClass: 'text-amber-300',
  },
  success: {
    border: 'border-l-emerald-500',
    icon: <CheckCircle className="w-4 h-4 text-emerald-400" />,
    label: 'Resolved',
    labelClass: 'bg-emerald-500/20 text-emerald-300',
    titleClass: 'text-emerald-300',
  },
  info: {
    border: 'border-l-sky-500',
    icon: <Info className="w-4 h-4 text-sky-400" />,
    label: 'Info',
    labelClass: 'bg-sky-500/20 text-sky-300',
    titleClass: 'text-sky-300',
  },
};

const getConfig = (type) => TYPE_CONFIG[type] || TYPE_CONFIG.info;

// ──────────────────────────────────────────────
// Single notification card
// ──────────────────────────────────────────────
const NotificationCard = ({ notification, onMarkRead }) => {
  const cfg = getConfig(notification.type);

  return (
    <div
      className={`relative flex gap-4 p-4 rounded-xl border-l-4 ${cfg.border} transition-all duration-200 ${
        notification.isRead
          ? 'bg-slate-900/40 border border-slate-800/50 opacity-70'
          : 'bg-slate-900 border border-slate-700 shadow-lg shadow-black/20'
      }`}
    >
      {/* Unread dot */}
      {!notification.isRead && (
        <span className="absolute top-3 right-3 w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
      )}

      {/* Icon */}
      <div className="flex-shrink-0 mt-0.5">{cfg.icon}</div>

      {/* Body */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className={`text-sm font-semibold leading-snug ${cfg.titleClass}`}>
            {notification.title}
          </h3>
          <span className={`flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.labelClass}`}>
            {cfg.label}
          </span>
        </div>
        <p className="text-slate-300 text-xs leading-relaxed">{notification.message}</p>
        <div className="flex items-center justify-between mt-2">
          <span className="flex items-center gap-1 text-[11px] text-slate-500">
            <Clock className="w-3 h-3" />
            {notification.timestamp}
          </span>
          {!notification.isRead ? (
            <button
              onClick={() => onMarkRead(notification.id)}
              className="flex items-center gap-1 text-[11px] text-sky-400 hover:text-sky-300 transition-colors"
            >
              <CheckCheck className="w-3 h-3" />
              Mark read
            </button>
          ) : (
            <span className="flex items-center gap-1 text-[11px] text-slate-600">
              <Circle className="w-2.5 h-2.5 fill-slate-600" />
              Read
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

// ──────────────────────────────────────────────
// Main Page
// ──────────────────────────────────────────────
const TABS = [
  { key: 'all', label: 'All' },
  { key: 'unread', label: 'Unread' },
  { key: 'emergency', label: 'Emergency Alerts' },
];

export const NotificationsPage = () => {
  const { notifications, markAsRead, markAllRead, clearNotifications } = useEmergency();
  const [activeTab, setActiveTab] = useState('all');
  const [showConfirmClear, setShowConfirmClear] = useState(false);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const filtered = notifications.filter((n) => {
    if (activeTab === 'unread') return !n.isRead;
    if (activeTab === 'emergency') return n.type === 'emergency' || n.type === 'warning';
    return true;
  });

  const handleClearAll = () => {
    clearNotifications();
    setShowConfirmClear(false);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-rose-600/20 border border-rose-500/30">
            <Bell className="w-5 h-5 text-rose-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Notifications</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              {unreadCount > 0
                ? `${unreadCount} unread alert${unreadCount > 1 ? 's' : ''}`
                : "You're all caught up!"}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 mt-1">
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-600/20 border border-sky-500/30 text-sky-300 hover:bg-sky-600/30 text-xs font-medium transition-colors"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              Mark all read
            </button>
          )}
          {notifications.length > 0 && (
            <button
              onClick={() => setShowConfirmClear(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600/20 border border-rose-500/30 text-rose-300 hover:bg-rose-600/30 text-xs font-medium transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* Confirm clear dialog */}
      {showConfirmClear && (
        <div className="p-4 rounded-xl bg-rose-900/30 border border-rose-500/40 flex items-center justify-between gap-4">
          <p className="text-sm text-rose-200">Delete all notifications? This cannot be undone.</p>
          <div className="flex gap-2">
            <button
              onClick={() => setShowConfirmClear(false)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-700 text-slate-200 hover:bg-slate-600 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleClearAll}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-rose-600 text-white hover:bg-rose-500 transition-colors"
            >
              Yes, delete all
            </button>
          </div>
        </div>
      )}

      {/* Tab bar */}
      <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-900 border border-slate-800 w-fit">
        {TABS.map((tab) => {
          const count =
            tab.key === 'unread'
              ? notifications.filter((n) => !n.isRead).length
              : tab.key === 'emergency'
              ? notifications.filter((n) => n.type === 'emergency' || n.type === 'warning').length
              : notifications.length;

          return (
            <button
              key={tab.key}
              id={`notif-tab-${tab.key}`}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                activeTab === tab.key
                  ? 'bg-rose-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab.label}
              {count > 0 && (
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                    activeTab === tab.key
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-700 text-slate-300'
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total', value: notifications.length, color: 'text-white' },
          { label: 'Unread', value: unreadCount, color: 'text-rose-300' },
          {
            label: 'Emergencies',
            value: notifications.filter((n) => n.type === 'emergency' || n.type === 'warning').length,
            color: 'text-amber-300',
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-center"
          >
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Notification list */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mb-4">
              <Bell className="w-6 h-6 text-slate-600" />
            </div>
            <p className="text-slate-400 font-semibold text-sm">No notifications here</p>
            <p className="text-slate-600 text-xs mt-1">
              {activeTab === 'unread'
                ? 'All caught up — nothing to read!'
                : 'New alerts will appear here.'}
            </p>
          </div>
        ) : (
          filtered.map((n) => (
            <NotificationCard key={n.id} notification={n} onMarkRead={markAsRead} />
          ))
        )}
      </div>

      {/* Live feed footer */}
      {notifications.length > 0 && (
        <p className="text-center text-[11px] text-slate-600 flex items-center justify-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Live system feed — notifications update automatically as events occur
        </p>
      )}
    </div>
  );
};

export default NotificationsPage;
