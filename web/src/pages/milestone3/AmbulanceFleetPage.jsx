import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Ambulance,
  Phone,
  MapPin,
  Gauge,
  BatteryCharging,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Filter,
  Navigation,
  Sparkles,
  Search,
  SlidersHorizontal,
  ChevronRight,
  AlertCircle,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { DemoNoticeBanner } from '../../components/common/DemoNoticeBanner';
import { LeafletMap } from '../../components/common/LeafletMap';
import { EmptyState } from '../../components/common/EmptyState';
import { AmbulanceService, API_BASE_URL } from '../../services/api';
import { AMBULANCES_DEMO } from '../../data/pulseRouteData';

export const AmbulanceFleetPage = () => {
  const [fleet, setFleet] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(null);

  const [filterType, setFilterType] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAmbulance, setSelectedAmbulance] = useState(null);

  // Fetch live fleet from FastAPI backend
  const fetchFleet = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await AmbulanceService.getAmbulances();
      if (data && data.length > 0) {
        setFleet(data);
        if (!selectedAmbulance) {
          setSelectedAmbulance(data[0]);
        }
      } else {
        // Fallback to demo dataset if database has 0 records
        setFleet(AMBULANCES_DEMO);
        if (!selectedAmbulance) setSelectedAmbulance(AMBULANCES_DEMO[0]);
      }
    } catch (err) {
      console.error('Failed to load fleet from backend:', err);
      setError(err.friendlyMessage || 'Failed to connect to ambulance API. Falling back to cached demo data.');
      setFleet(AMBULANCES_DEMO);
      if (!selectedAmbulance) setSelectedAmbulance(AMBULANCES_DEMO[0]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFleet();
  }, []);

  // Status toggle handler connecting to PATCH /ambulances/{id}/status
  const handleToggleStatus = async (amb, newStatus) => {
    const targetId = amb.dbId || amb.id;
    setIsUpdatingStatus(amb.ambulanceId);
    try {
      // If we have a numerical backend database ID, call backend PATCH
      if (typeof targetId === 'number' && !isNaN(targetId)) {
        const updated = await AmbulanceService.updateStatus(targetId, newStatus);
        setFleet((prev) =>
          prev.map((a) => (a.ambulanceId === amb.ambulanceId ? { ...a, ...updated, status: newStatus } : a))
        );
      } else {
        // Local state update
        setFleet((prev) =>
          prev.map((a) => (a.ambulanceId === amb.ambulanceId ? { ...a, status: newStatus } : a))
        );
      }
      if (selectedAmbulance?.ambulanceId === amb.ambulanceId) {
        setSelectedAmbulance((prev) => ({ ...prev, status: newStatus }));
      }
    } catch (err) {
      console.error('Failed to update ambulance status:', err);
      // Optimistic local update as fallback
      setFleet((prev) =>
        prev.map((a) => (a.ambulanceId === amb.ambulanceId ? { ...a, status: newStatus } : a))
      );
    } finally {
      setIsUpdatingStatus(null);
    }
  };

  const filteredFleet = fleet.filter((amb) => {
    if (filterType !== 'ALL' && amb.type !== filterType) return false;
    if (filterStatus !== 'ALL' && amb.status !== filterStatus) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        amb.ambulanceId?.toLowerCase().includes(q) ||
        amb.vehicleNumber?.toLowerCase().includes(q) ||
        amb.driverName?.toLowerCase().includes(q) ||
        amb.baseStation?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const mapAmbulances = filteredFleet.map((amb) => ({
    id: amb.ambulanceId,
    vehicleNumber: amb.vehicleNumber,
    type: amb.type,
    status: amb.status,
    lat: amb.lat,
    lng: amb.lng,
    speedKmh: amb.speedKmh,
    driverName: amb.driverName,
  }));

  return (
    <div className="space-y-6">
      <DemoNoticeBanner />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              PulseRoute Ambulance Fleet (AMB001–AMB005)
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Registered fleet units integrated with FastAPI backend <code className="text-sky-300">/api/v1/ambulances</code> with real-time status &amp; equipment payload.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <button
            onClick={fetchFleet}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors disabled:opacity-50"
            title="Refresh fleet from API"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Sync</span>
          </button>
          <span className="px-3 py-1.5 rounded-xl bg-sky-950/60 border border-sky-500/30 text-sky-300 font-bold">
            Total {fleet.length} Units
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 font-bold">
            {fleet.filter((a) => a.status === 'AVAILABLE').length} Available
          </span>
        </div>
      </div>

      {/* Error / Warning Alert Banner */}
      {error && (
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3 text-xs text-amber-300">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchFleet}
            className="px-2.5 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 font-bold text-amber-200 transition-colors"
          >
            Retry API
          </button>
        </div>
      )}

      {/* Search and Filters Bar */}
      <div className="bg-slate-900/70 border border-slate-800 p-4 rounded-xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by ID, Vehicle No, Driver, or Base Station..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Type Filter */}
          <div className="flex items-center gap-1 bg-slate-800/60 p-1 rounded-xl border border-slate-700">
            <span className="text-[10px] font-bold text-slate-400 px-2 uppercase">Type:</span>
            {['ALL', 'ALS', 'BLS'].map((t) => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  filterType === t
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-slate-800/60 p-1 rounded-xl border border-slate-700">
            <span className="text-[10px] font-bold text-slate-400 px-2 uppercase">Status:</span>
            {['ALL', 'AVAILABLE', 'BUSY', 'EN_ROUTE'].map((s) => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-2 py-1 rounded-lg text-xs font-bold transition-all ${
                  filterStatus === s
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Loading Indicator */}
      {isLoading && (
        <div className="p-12 text-center rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-sky-400 animate-spin" />
          <div className="text-sm font-bold text-white">Loading Fleet from FastAPI Backend...</div>
          <div className="text-xs text-slate-400">Querying {API_BASE_URL}/ambulances</div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredFleet.length === 0 && (
        <EmptyState
          icon={Ambulance}
          title="No Ambulances Found"
          description={searchQuery || filterType !== 'ALL' || filterStatus !== 'ALL'
            ? 'No fleet records matched your selected filters or search query.'
            : 'No ambulance units are registered in the backend database.'}
          actionText="Reset Filters"
          onAction={() => {
            setSearchQuery('');
            setFilterType('ALL');
            setFilterStatus('ALL');
          }}
        />
      )}

      {/* Grid: Fleet Cards & Spatial Map */}
      {!isLoading && filteredFleet.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Ambulance Cards Column */}
          <div className="lg:col-span-2 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredFleet.map((amb) => {
                const isSelected = selectedAmbulance?.ambulanceId === amb.ambulanceId;
                const isPending = isUpdatingStatus === amb.ambulanceId;

                return (
                  <div
                    key={amb.ambulanceId}
                    onClick={() => setSelectedAmbulance(amb)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
                      isSelected
                        ? 'bg-slate-800/90 border-sky-500 shadow-lg shadow-sky-950/40 ring-1 ring-sky-500/50'
                        : 'bg-slate-900/70 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                    }`}
                  >
                    {/* Top Badge Row */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center font-black text-xs">
                          <Ambulance className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-extrabold text-sm text-white tracking-tight">
                              {amb.ambulanceId}
                            </span>
                            {amb.dbId && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-sky-300 font-mono">
                                API #{amb.dbId}
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] font-mono text-slate-400">{amb.vehicleNumber}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                            amb.type === 'ALS'
                              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                              : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          }`}
                        >
                          {amb.type}
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                            amb.status === 'AVAILABLE'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : amb.status === 'EN_ROUTE'
                              ? 'bg-rose-500/20 text-rose-300 animate-pulse'
                              : amb.status === 'BUSY'
                              ? 'bg-amber-500/20 text-amber-300'
                              : 'bg-slate-700 text-slate-300'
                          }`}
                        >
                          {amb.status}
                        </span>
                      </div>
                    </div>

                    {/* Driver & Base Station Info */}
                    <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between text-slate-300">
                        <span className="text-slate-400 text-[11px]">Assigned Driver:</span>
                        <span className="font-semibold text-white">{amb.driverName}</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-300">
                        <span className="text-slate-400 text-[11px]">Emergency Hotline:</span>
                        <span className="font-mono text-slate-200">{amb.driverContact}</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-300">
                        <span className="text-slate-400 text-[11px]">Base Station:</span>
                        <span className="text-slate-300 truncate max-w-[180px]">{amb.baseStation}</span>
                      </div>
                    </div>

                    {/* Telemetry row */}
                    <div className="mt-3 pt-2.5 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-[11px]">
                      <div className="flex items-center gap-1 text-slate-400">
                        <MapPin className="w-3.5 h-3.5 text-rose-400" />
                        <span>{Number(amb.lat || 17.4).toFixed(4)}, {Number(amb.lng || 78.4).toFixed(4)}</span>
                      </div>
                      <div className="flex items-center justify-end gap-1 text-emerald-400 font-semibold">
                        <BatteryCharging className="w-3.5 h-3.5" />
                        <span>Fuel/O2: {amb.fuelOxygenLevel}</span>
                      </div>
                    </div>

                    {/* Status Toggle Action with Backend API PATCH */}
                    <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between">
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        {isPending && <Loader2 className="w-3 h-3 text-sky-400 animate-spin" />}
                        <span>Update Status:</span>
                      </span>
                      <div className="flex items-center gap-1">
                        {['AVAILABLE', 'EN_ROUTE', 'BUSY'].map((st) => (
                          <button
                            key={st}
                            disabled={isPending}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleStatus(amb, st);
                            }}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border transition-all ${
                              amb.status === st
                                ? 'bg-slate-700 text-white border-slate-600'
                                : 'bg-slate-800/40 text-slate-400 border-slate-800 hover:text-white'
                            } disabled:opacity-50`}
                          >
                            {st === 'AVAILABLE' ? 'Avail' : st === 'EN_ROUTE' ? 'EnRoute' : 'Busy'}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick Route Link Banner */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-slate-900 to-slate-800 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold">
                  <Navigation className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Live Route &amp; ETA Simulator</div>
                  <div className="text-[11px] text-slate-400">
                    Track live fleet navigation towards emergency incidents and healthcare facilities.
                  </div>
                </div>
              </div>
              <Link
                to="/route-eta"
                className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all"
              >
                <span>Launch Tracker</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Fleet Spatial Map Column */}
          <div className="space-y-4">
            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-sky-400" />
                  Fleet Spatial Deployment
                </h3>
                <span className="text-[10px] text-emerald-400 font-mono">FastAPI Synchronized</span>
              </div>

              <div className="h-[360px] rounded-xl overflow-hidden border border-slate-800">
                <LeafletMap
                  center={[17.4100, 78.4600]}
                  zoom={12}
                  ambulances={mapAmbulances}
                  hospitals={[]}
                />
              </div>

              {/* Selected Ambulance Info Box */}
              {selectedAmbulance ? (
                <div className="p-3 rounded-xl bg-slate-800/80 border border-sky-500/40 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-sm">
                      {selectedAmbulance.ambulanceId} Payload Details
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 font-bold">
                      {selectedAmbulance.type}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Station: <strong>{selectedAmbulance.baseStation}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                      Onboard Equipment:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {(selectedAmbulance.equipment || []).map((item) => (
                        <span key={item} className="px-1.5 py-0.5 rounded bg-slate-700 text-[10px] text-slate-200">
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800 text-center text-xs text-slate-400">
                  Click any ambulance card to inspect vehicle payload &amp; equipment.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AmbulanceFleetPage;
