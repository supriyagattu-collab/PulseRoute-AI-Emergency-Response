import React from 'react';
import { ANALYTICS_DATA } from '../../data/mockData';
import { StatsCard } from '../../components/common/StatsCard';
import {
  Clock,
  TrendingDown,
  Activity,
  Ambulance,
  Building2,
  PieChart as PieIcon,
  BarChart3,
  Cpu,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

export const AdminAnalytics = () => {
  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-slate-800">
        <h1 className="text-2xl font-black text-white tracking-tight">System Performance & ML Analytics</h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Response latency benchmarks, incident category surge distributions, and fleet utilization metrics
        </p>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatsCard
          title="Average Response Time"
          value="7.4 min"
          subtext="Target < 8.0 min met"
          badgeText="↓ 38% faster"
          badgeColor="emerald"
          icon={Clock}
        />
        <StatsCard
          title="Today's Dispatches"
          value="48 Runs"
          subtext="100% CAD telemetry"
          badgeText="Normal Load"
          badgeColor="sky"
          icon={Activity}
        />
        <StatsCard
          title="Fleet Utilization"
          value="78%"
          subtext="4 Active Units"
          badgeText="High Efficiency"
          badgeColor="amber"
          icon={Ambulance}
        />
        <StatsCard
          title="Golden Hour Saves"
          value="98.2%"
          subtext="P1 & P2 Outcomes"
          badgeText="Optimal"
          badgeColor="emerald"
          icon={Building2}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hourly Incident Surge Area Chart */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-rose-500" /> Hourly Emergency Incident Surge
            </h3>
            <span className="text-[11px] text-slate-400">Past 24 Hours</span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={ANALYTICS_DATA.hourlyIncidents}>
                <defs>
                  <linearGradient id="surgeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="hour" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                <Area type="monotone" dataKey="incidents" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#surgeGrad)" name="Incident Call Volume" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Priority Breakdown Donut */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-amber-500" /> Triage Urgency Distribution (P1-P4)
            </h3>
            <span className="text-[11px] text-slate-400">Multi-class Triage</span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={ANALYTICS_DATA.priorityBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {ANALYTICS_DATA.priorityBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Breakdown Bar Chart */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-sky-500" /> Emergencies by Category
            </h3>
            <span className="text-[11px] text-slate-400">Total Counts</span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ANALYTICS_DATA.typeBreakdown}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                <Bar dataKey="count" fill="#0284c7" radius={[6, 6, 0, 0]} name="Cases Logged" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Hospital Capacity Distribution */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-500" /> Hospital Bed Capacity Distribution
            </h3>
            <span className="text-[11px] text-slate-400">Available vs Occupied</span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ANALYTICS_DATA.hospitalCapacityShare}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                <Legend />
                <Bar dataKey="available" fill="#10b981" radius={[4, 4, 0, 0]} name="Available Beds" />
                <Bar dataKey="occupied" fill="#475569" radius={[4, 4, 0, 0]} name="Occupied Beds" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
