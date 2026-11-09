import React, { useState, useEffect } from 'react';
import { useEmergency } from '../../context/EmergencyContext';
import { DataTable } from '../../components/common/DataTable';
import { PriorityBadge, StatusBadge, TierBadge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import {
  Activity,
  Ambulance,
  Building2,
  Eye,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Loader2,
  History,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';
import { AssignmentService, EmergencyService } from '../../services/api';

export const AdminEmergencies = () => {
  const {
    emergencies,
    ambulances,
    hospitals,
    assignAmbulance,
    advanceTripStage,
    addNotification,
  } = useEmergency();

  const [selectedCase, setSelectedCase] = useState(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [targetAmbulanceId, setTargetAmbulanceId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [assignError, setAssignError] = useState(null);
  const [assignSuccess, setAssignSuccess] = useState(null);

  // Status history state for the selected case
  const [caseHistory, setCaseHistory] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Filter only AVAILABLE and active ambulances for dispatch assignment
  const availableAmbulances = ambulances.filter(
    (a) => (a.status === 'AVAILABLE' || a.status === 'available') && (a.isActive !== false)
  );

  // Fetch status history when case details modal opens
  useEffect(() => {
    let isMounted = true;
    const fetchHistory = async () => {
      if (!selectedCase) {
        setCaseHistory([]);
        return;
      }
      setIsLoadingHistory(true);
      try {
        const emgDbId = selectedCase.dbId || (typeof selectedCase.id === 'number' ? selectedCase.id : null);
        if (emgDbId) {
          const history = await EmergencyService.getStatusHistory(emgDbId);
          if (isMounted) setCaseHistory(history);
        } else if (selectedCase.statusHistory) {
          if (isMounted) setCaseHistory(selectedCase.statusHistory);
        }
      } catch (err) {
        console.warn('Could not load status history from API:', err);
        if (isMounted) setCaseHistory(selectedCase.statusHistory || []);
      } finally {
        if (isMounted) setIsLoadingHistory(false);
      }
    };

    fetchHistory();
    return () => {
      isMounted = false;
    };
  }, [selectedCase]);

  const handleOpenAssignModal = (emergencyRow) => {
    setSelectedCase(emergencyRow);
    setTargetAmbulanceId('');
    setAssignError(null);
    setAssignSuccess(null);
    setIsAssignModalOpen(true);
  };

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCase || !targetAmbulanceId) return;

    // Prevent dispatch on closed or cancelled emergencies
    if (['RESOLVED', 'CANCELLED'].includes(selectedCase.status)) {
      setAssignError(`Cannot dispatch ambulance to an incident with status "${selectedCase.status}".`);
      return;
    }

    // Find target ambulance object
    const targetAmb = ambulances.find(
      (a) => a.id === targetAmbulanceId || a.dbId === Number(targetAmbulanceId) || a.ambulanceId === targetAmbulanceId
    );

    if (!targetAmb) {
      setAssignError('Selected ambulance unit could not be found.');
      return;
    }

    setIsSubmitting(true);
    setAssignError(null);

    try {
      const emergencyDbId = selectedCase.dbId || (typeof selectedCase.id === 'number' ? selectedCase.id : 1);
      const ambulanceDbId = targetAmb.dbId || (typeof targetAmb.id === 'number' ? targetAmb.id : 1);

      // Call backend POST /api/v1/assignments
      const createdAssignment = await AssignmentService.createAssignment({
        emergency_id: emergencyDbId,
        ambulance_id: ambulanceDbId,
        notes: `Dispatcher confirmed unit ${targetAmb.vehicleNumber || targetAmb.ambulanceId} for incident #${selectedCase.incidentCode || selectedCase.id}.`,
        estimated_eta_minutes: targetAmb.estimatedEtaMinutes || 6,
      });

      // Update in-memory state and trigger notifications
      assignAmbulance(selectedCase.id, targetAmb.id || targetAmb.ambulanceId);

      const successMsg = `Assignment ASG-${createdAssignment.dbId || createdAssignment.id} created. Unit ${targetAmb.vehicleNumber || targetAmb.ambulanceId} dispatched!`;
      setAssignSuccess(successMsg);

      if (addNotification) {
        addNotification(
          '🚨 Dispatch Confirmed',
          `Unit ${targetAmb.vehicleNumber || targetAmb.ambulanceId} dispatched to Incident #${selectedCase.incidentCode || selectedCase.id}`,
          'emergency'
        );
      }

      // Close modal after brief confirmation feedback
      setTimeout(() => {
        setIsAssignModalOpen(false);
        setIsSubmitting(false);
      }, 1200);
    } catch (err) {
      console.error('Failed to create assignment on backend:', err);
      // Fallback: still update local state so user can proceed if backend is offline
      assignAmbulance(selectedCase.id, targetAmb.id || targetAmb.ambulanceId);
      setAssignError(err.friendlyMessage || 'Backend assignment failed; local dispatch state updated as fallback.');
      setIsSubmitting(false);
    }
  };

  const columns = [
    {
      header: 'Case ID',
      accessor: 'id',
      sortable: true,
      render: (row) => (
        <span className="font-mono font-bold text-white">#{row.incidentCode || row.id}</span>
      ),
    },
    {
      header: 'Patient & Category',
      accessor: 'patientName',
      render: (row) => (
        <div>
          <div className="font-bold text-white">{row.patientName}</div>
          <span className="text-[11px] text-rose-400 font-semibold">{row.emergencyType || row.type}</span>
        </div>
      ),
    },
    {
      header: 'Priority',
      accessor: 'priority',
      sortable: true,
      render: (row) => <PriorityBadge priority={row.priority || 'P1'} label={row.priorityLabel || row.severity} />,
    },
    {
      header: 'Assigned Ambulance',
      accessor: 'assignedAmbulanceId',
      render: (row) => {
        const amb = ambulances.find(
          (a) => a.id === row.assignedAmbulanceId || a.ambulanceId === row.assignedAmbulanceId
        );
        return amb ? (
          <div className="text-xs">
            <span className="font-bold text-white">{amb.vehicleNumber || amb.ambulanceId}</span>
            <span className="text-[10px] text-slate-400 block">{amb.driverName}</span>
          </div>
        ) : (
          <span className="text-amber-400 text-xs font-semibold">Unassigned</span>
        );
      },
    },
    {
      header: 'Destination ER',
      accessor: 'assignedHospitalId',
      render: (row) => {
        const hosp = hospitals.find(
          (h) => h.id === row.assignedHospitalId || h.dbId === row.destinationFacilityId
        );
        return <span className="text-slate-300 text-xs truncate max-w-[130px] block">{hosp?.name || 'Central Trauma ER'}</span>;
      },
    },
    {
      header: 'Status',
      accessor: 'status',
      sortable: true,
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      header: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setSelectedCase(row)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            title="Inspect Details & Timeline"
          >
            <Eye className="w-4 h-4 text-sky-400" />
          </button>
          <button
            onClick={() => handleOpenAssignModal(row)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            title="Dispatch / Reassign Unit"
          >
            <Sliders className="w-4 h-4 text-amber-400" />
          </button>
        </div>
      ),
    },
  ];

  const filters = [
    {
      label: 'Priority',
      key: 'priority',
      options: [
        { label: 'P1 Critical', value: 'P1' },
        { label: 'P2 Urgent', value: 'P2' },
        { label: 'P3 Moderate', value: 'P3' },
        { label: 'P4 Routine', value: 'P4' },
      ],
    },
    {
      label: 'Status',
      key: 'status',
      options: [
        { label: 'Reported', value: 'REPORTED' },
        { label: 'Assigned', value: 'ASSIGNED' },
        { label: 'En Route', value: 'EN_ROUTE' },
        { label: 'Transporting', value: 'TRANSPORTING' },
        { label: 'Resolved', value: 'RESOLVED' },
      ],
    },
  ];

  const isAlreadyAssigned =
    selectedCase &&
    ['ASSIGNED', 'EN_ROUTE', 'ON_SCENE', 'TRANSPORTING'].includes(selectedCase.status) &&
    selectedCase.assignedAmbulanceId;

  const currentAssignedAmbulance = isAlreadyAssigned
    ? ambulances.find(
        (a) => a.id === selectedCase.assignedAmbulanceId || a.ambulanceId === selectedCase.assignedAmbulanceId
      )
    : null;

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Emergency Incident Dispatch Queue</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Central monitoring and manual dispatch override terminal connected to FastAPI &amp; SQLite.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300">
            Available Units: <strong className="text-emerald-400">{availableAmbulances.length}</strong> / {ambulances.length}
          </span>
        </div>
      </div>

      <div className="glass-panel p-6 rounded-2xl border border-slate-800">
        <DataTable
          columns={columns}
          data={emergencies}
          searchPlaceholder="Search by ID, patient name or type..."
          searchKeys={['id', 'incidentCode', 'patientName', 'emergencyType', 'notes']}
          filters={filters}
          pageSize={6}
        />
      </div>

      {/* Case Details & Status History Modal */}
      {selectedCase && !isAssignModalOpen && (
        <Modal
          isOpen={!!selectedCase}
          onClose={() => setSelectedCase(null)}
          title={`Incident Overview #${selectedCase.incidentCode || selectedCase.id}`}
        >
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <PriorityBadge priority={selectedCase.priority || 'P1'} label={selectedCase.priorityLabel || selectedCase.severity} />
              <StatusBadge status={selectedCase.status} />
            </div>

            <div>
              <span className="text-slate-500 block">Patient Information</span>
              <strong className="text-white text-sm">{selectedCase.patientName}</strong>
              <div className="text-slate-400 text-[11px] mt-0.5">
                Contact: <span className="text-slate-300">{selectedCase.contactPhone || '+91 99999 00000'}</span> •{' '}
                Age/Gender: <span className="text-slate-300">{selectedCase.patientAge || 'Unknown'} / {selectedCase.gender || 'Unknown'}</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase font-bold block">Pickup Location</span>
              <div className="text-slate-200 mt-0.5 font-medium">
                {selectedCase.pickupLocation?.address || selectedCase.incidentAddress || 'Reported Location'}
              </div>
              <div className="text-slate-500 text-[10px] mt-1 font-mono">
                GPS: {Number(selectedCase.lat || selectedCase.latitude || 17.385).toFixed(4)}°N, {Number(selectedCase.lng || selectedCase.longitude || 78.486).toFixed(4)}°E
              </div>
            </div>

            {selectedCase.vitals && (
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Clinical Symptoms &amp; Vitals</span>
                <div className="grid grid-cols-4 gap-2 text-slate-300 pt-1">
                  <div>AVPU: <strong className="text-white">{selectedCase.vitals.consciousness || 'ALERT'}</strong></div>
                  <div>Pulse: <strong className="text-rose-400">{selectedCase.vitals.heartRate || 80}</strong></div>
                  <div>SpO2: <strong className="text-emerald-400">{selectedCase.vitals.spO2 || 98}%</strong></div>
                  <div>BP: <strong className="text-white">{selectedCase.vitals.bloodPressure || '120/80'}</strong></div>
                </div>
              </div>
            )}

            <div className="text-slate-400 pt-1">
              Notes: <span className="text-slate-300">{selectedCase.notes || selectedCase.symptoms || 'None recorded.'}</span>
            </div>

            {/* Status Transition History Section (Milestone 8.1 FIX 5) */}
            <div className="pt-3 border-t border-slate-800">
              <div className="flex items-center gap-1.5 mb-2.5">
                <History className="w-3.5 h-3.5 text-sky-400" />
                <span className="text-[11px] font-bold text-white uppercase tracking-wider">
                  Status Transition Audit Timeline
                </span>
              </div>

              {isLoadingHistory ? (
                <div className="p-3 text-center text-slate-500 flex items-center justify-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-400" />
                  <span>Loading recorded transitions from SQLite...</span>
                </div>
              ) : caseHistory.length > 0 ? (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {caseHistory.map((item, idx) => (
                    <div
                      key={item.id || idx}
                      className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800/80 flex items-start justify-between gap-2"
                    >
                      <div>
                        <div className="flex items-center gap-1.5 font-semibold text-white">
                          {item.fromStatus && (
                            <>
                              <span className="text-slate-400">{item.fromStatus}</span>
                              <ArrowRight className="w-3 h-3 text-slate-500" />
                            </>
                          )}
                          <span className="text-sky-300 font-bold">{item.toStatus}</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700">
                            {item.changedBy || 'SYSTEM'}
                          </span>
                        </div>
                        {item.notes && <p className="text-[10px] text-slate-400 mt-0.5">{item.notes}</p>}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono whitespace-nowrap">
                        {item.timeFormatted || (item.changedAt ? new Date(item.changedAt).toLocaleTimeString() : 'Recent')}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-2.5 rounded-lg bg-slate-900/50 border border-slate-800 text-slate-500 text-center">
                  Initial report logged ({selectedCase.status}). No subsequent transitions recorded yet.
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Manual Dispatch Modal (Milestone 8.1 FIX 1) */}
      {isAssignModalOpen && selectedCase && (
        <Modal
          isOpen={isAssignModalOpen}
          onClose={() => {
            if (!isSubmitting) setIsAssignModalOpen(false);
          }}
          title={`Manual Dispatch Assignment: Case #${selectedCase.incidentCode || selectedCase.id}`}
        >
          <form onSubmit={handleAssignSubmit} className="space-y-4 text-xs">
            {/* Duplicate Assignment Warning */}
            {isAlreadyAssigned && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Incident Already Has Assigned Unit</span>
                </div>
                <p className="text-[11px] text-amber-300/80">
                  Currently assigned to <strong>{currentAssignedAmbulance?.vehicleNumber || selectedCase.assignedAmbulanceId}</strong> ({selectedCase.status}).
                  Selecting a new ambulance will override the current dispatch and log a reassignment record.
                </p>
              </div>
            )}

            {/* Error Banner */}
            {assignError && (
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{assignError}</span>
              </div>
            )}

            {/* Success Banner */}
            {assignSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="font-semibold">{assignSuccess}</span>
              </div>
            )}

            <p className="text-slate-300">
              Select an available ambulance to dispatch to{' '}
              <strong className="text-white">{selectedCase.patientName}</strong> ({selectedCase.priorityLabel || selectedCase.severity}).
              This will update both SQLite database records and live telemetry.
            </p>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Select Available Ambulance ({availableAmbulances.length} ready)
              </label>
              {availableAmbulances.length > 0 ? (
                <select
                  value={targetAmbulanceId}
                  onChange={(e) => setTargetAmbulanceId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-rose-500"
                  required
                  disabled={isSubmitting}
                >
                  <option value="">-- Choose Unit --</option>
                  {availableAmbulances.map((amb) => (
                    <option key={amb.id || amb.ambulanceId} value={amb.id || amb.ambulanceId}>
                      {amb.vehicleNumber || amb.ambulanceId} ({amb.type}) — Driver: {amb.driverName} [{amb.baseStation || 'Central Hub'}]
                    </option>
                  ))}
                </select>
              ) : (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                  No ambulances are currently AVAILABLE. All units are currently BUSY, EN_ROUTE, or in MAINTENANCE.
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsAssignModalOpen(false)}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors disabled:opacity-40"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!targetAmbulanceId || isSubmitting || availableAmbulances.length === 0}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors disabled:opacity-40"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving to SQLite...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Confirm Dispatch</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
