import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEmergency } from '../../context/EmergencyContext';
import { useAuth } from '../../context/AuthContext';
import { PriorityBadge, TierBadge } from '../../components/common/Badge';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { EmptyState } from '../../components/common/EmptyState';
import { Radio, MapPin, CheckCircle, XCircle, Clock, AlertTriangle, ArrowRight } from 'lucide-react';

export const DriverRequests = () => {
  const { currentUser } = useAuth();
  const { emergencies, ambulances, acceptRequest, rejectRequest } = useEmergency();
  const navigate = useNavigate();

  const [selectedCaseToAccept, setSelectedCaseToAccept] = useState(null);

  // Find this driver's ambulance
  const myAmbulance =
    ambulances.find((a) => a.driverId === currentUser?.id || a.driverName === currentUser?.fullName) ||
    ambulances[0];

  // Emergencies that are unassigned or assigned directly to this unit but not yet accepted
  const pendingRequests = emergencies.filter(
    (e) =>
      e.status === 'REPORTED' ||
      (e.assignedAmbulanceId === myAmbulance.id && e.tripStage === 'ACCEPTED')
  );

  const handleConfirmAccept = () => {
    if (selectedCaseToAccept) {
      acceptRequest(selectedCaseToAccept.id, myAmbulance.id);
      navigate('/driver/active-trip');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Incoming Emergency Requests</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Active calls in your sector awaiting ambulance confirmation • Unit:{' '}
            <strong className="text-white">{myAmbulance.vehicleNumber}</strong>
          </p>
        </div>

        <span className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-emerald-400">
          Unit Status: {myAmbulance.status}
        </span>
      </div>

      {pendingRequests.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pendingRequests.map((req) => (
            <div
              key={req.id}
              className="glass-panel p-5 rounded-2xl border border-slate-800 hover:border-slate-700 space-y-4 transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-white">#{req.id}</span>
                  <PriorityBadge priority={req.priority} label={req.priorityLabel} />
                </div>
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-500" /> {req.reportedAt}
                </span>
              </div>

              <div>
                <h3 className="text-sm font-bold text-white">{req.patientName}</h3>
                <div className="text-xs font-semibold text-rose-400 mt-0.5">
                  {req.emergencyType} Emergency
                </div>
                <p className="text-xs text-slate-400 mt-1">{req.notes}</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs space-y-1">
                <div className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-rose-500" /> Pickup Location
                </div>
                <div className="text-slate-300 font-medium truncate">{req.pickupLocation.address}</div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => setSelectedCaseToAccept(req)}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-md shadow-emerald-600/30"
                >
                  <CheckCircle className="w-4 h-4" /> Accept Dispatch Run
                </button>
                <button
                  onClick={() => rejectRequest(req.id)}
                  className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-400 hover:text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <XCircle className="w-4 h-4" /> Decline
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Radio}
          title="No Pending Dispatch Requests"
          description="Your dispatch queue is currently clear. Stand by for automated CAD dispatch notifications."
        />
      )}

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!selectedCaseToAccept}
        onClose={() => setSelectedCaseToAccept(null)}
        onConfirm={handleConfirmAccept}
        title="Confirm Dispatch Acceptance?"
        message={`You are accepting Emergency #${selectedCaseToAccept?.id}. You will be locked into navigation mode for unit ${myAmbulance.vehicleNumber}.`}
        confirmText="Confirm & Begin Run"
        type="info"
      />
    </div>
  );
};
