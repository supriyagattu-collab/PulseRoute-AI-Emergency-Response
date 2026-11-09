import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  INITIAL_EMERGENCIES,
  INITIAL_AMBULANCES,
  INITIAL_HOSPITALS,
  INITIAL_DRIVERS,
  INITIAL_ACTIVITY_LOG,
} from '../data/mockData';
import {
  AmbulanceService,
  FacilityService,
  EmergencyService,
  AssignmentService,
} from '../services/api';
import wsService, { WS_EVENTS } from '../services/websocketService';

const EmergencyContext = createContext(null);

export const EmergencyProvider = ({ children }) => {
  const [emergencies, setEmergencies] = useState(INITIAL_EMERGENCIES);
  const [ambulances, setAmbulances] = useState(INITIAL_AMBULANCES);
  const [hospitals, setHospitals] = useState(INITIAL_HOSPITALS);
  const [drivers, setDrivers] = useState(INITIAL_DRIVERS);
  const [activityLog, setActivityLog] = useState(INITIAL_ACTIVITY_LOG);
  const [activeEmergencyId, setActiveEmergencyId] = useState('emg-01');
  const [isSimulatingGps, setIsSimulatingGps] = useState(true);
  const [wsConnectionState, setWsConnectionState] = useState('closed');

  // Synchronize state with FastAPI backend upon initial load
  useEffect(() => {
    let isMounted = true;
    const syncBackend = async () => {
      try {
        const [ambRes, facRes, emgRes] = await Promise.allSettled([
          AmbulanceService.getAmbulances(),
          FacilityService.getFacilities({ limit: 50 }),
          EmergencyService.getEmergencies({ limit: 50 }),
        ]);

        if (!isMounted) return;

        if (ambRes.status === 'fulfilled' && ambRes.value?.length > 0) {
          setAmbulances(ambRes.value);
        }
        if (facRes.status === 'fulfilled' && facRes.value?.length > 0) {
          setHospitals(facRes.value);
        }
        if (emgRes.status === 'fulfilled' && emgRes.value?.length > 0) {
          setEmergencies(emgRes.value);
          if (emgRes.value[0]?.id) {
            setActiveEmergencyId(emgRes.value[0].id);
          }
        }
      } catch (err) {
        console.warn('EmergencyContext running in offline simulation mode:', err);
      }
    };

    syncBackend();
    return () => {
      isMounted = false;
    };
  }, []);

  // ── Milestone 9: WebSocket Real-Time Integration ──────────────────────────
  useEffect(() => {
    wsService.onStateChange(setWsConnectionState);

    // GPS location push: update ambulance lat/lng without HTTP polling
    const unsubLocation = wsService.on(WS_EVENTS.AMBULANCE_LOCATION, (data) => {
      setAmbulances((prev) =>
        prev.map((amb) => {
          const matchById = amb.dbId === data.ambulance_id || amb.id === data.ambulance_id;
          const matchByCode = amb.ambulanceId === data.ambulance_code;
          if (matchById || matchByCode) {
            return {
              ...amb,
              lat: data.lat,
              lng: data.lng,
              latitude: data.lat,
              longitude: data.lng,
              speedKmh: data.speed_kmh ?? amb.speedKmh,
              status: data.status ?? amb.status,
            };
          }
          return amb;
        })
      );
    });

    // Emergency status push: update status badge in real-time
    const unsubStatus = wsService.on(WS_EVENTS.EMERGENCY_STATUS, (data) => {
      setEmergencies((prev) =>
        prev.map((emg) => {
          const matchById = emg.dbId === data.emergency_id || emg.id === data.emergency_id;
          const matchByCode = emg.incidentCode === data.incident_code;
          if (matchById || matchByCode) {
            return { ...emg, status: data.new_status };
          }
          return emg;
        })
      );
    });

    // Assignment push: add notification for new dispatch events
    const unsubAssignment = wsService.on(WS_EVENTS.ASSIGNMENT_CREATED, (data) => {
      // Update the relevant emergency status to ASSIGNED
      setEmergencies((prev) =>
        prev.map((emg) => {
          if (emg.dbId === data.emergency_id || emg.id === data.emergency_id) {
            return { ...emg, status: 'ASSIGNED' };
          }
          return emg;
        })
      );
      // Update the ambulance to EN_ROUTE
      setAmbulances((prev) =>
        prev.map((amb) => {
          if (amb.dbId === data.ambulance_id || amb.id === data.ambulance_id) {
            return { ...amb, status: 'EN_ROUTE' };
          }
          return amb;
        })
      );
    });

    wsService.connect();

    return () => {
      unsubLocation();
      unsubStatus();
      unsubAssignment();
    };
  }, []);
  const [notifications, setNotifications] = useState([
    {
      id: 'notif-1',
      title: '🚨 Emergency Code Red Dispatched',
      message: 'Ambulance KA-01-EA-1081 is en route to Indiranagar (ETA 6m)',
      timestamp: 'Just now',
      type: 'emergency',
      isRead: false,
    },
    {
      id: 'notif-2',
      title: '🏥 Hospital Capacity Alert',
      message: 'Apollo Hospital ICU is at 90% capacity — only 2 beds remaining.',
      timestamp: '3 minutes ago',
      type: 'warning',
      isRead: false,
    },
    {
      id: 'notif-3',
      title: '🚑 Ambulance KA-01-EA-2022 Online',
      message: 'Unit KA-01-EA-2022 (ALS) is now available for dispatch.',
      timestamp: '10 minutes ago',
      type: 'info',
      isRead: true,
    },
    {
      id: 'notif-4',
      title: '✅ Emergency #emg-03 Resolved',
      message: 'Patient safely delivered to Manipal Hospital. Case closed.',
      timestamp: '28 minutes ago',
      type: 'success',
      isRead: true,
    },
  ]);

  const addNotification = (title, message, type = 'info') => {
    const newNotif = {
      id: `notif-${Date.now()}`,
      title,
      message,
      timestamp: 'Just now',
      type,
      isRead: false,
    };
    setNotifications((prev) => [newNotif, ...prev.slice(0, 19)]);
  };

  const markAsRead = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const logActivity = (actionType, actor, details, badgeColor = 'slate') => {
    const newEntry = {
      id: `act-${Date.now()}`,
      timestamp: 'Just now',
      actionType,
      actor,
      details,
      badgeColor,
    };
    setActivityLog((prev) => [newEntry, ...prev.slice(0, 30)]);
  };

  /**
   * Rule-based simulated AI triage scoring
   */
  const evaluateTriage = (vitals, emergencyType) => {
    let score = 0;
    const reasons = [];

    if (vitals.consciousness === 'UNRESPONSIVE') {
      score += 40;
      reasons.push('Patient is unresponsive (AVPU)');
    } else if (vitals.consciousness === 'PAIN' || vitals.consciousness === 'VERBAL') {
      score += 25;
      reasons.push('Depressed level of consciousness');
    }

    if (vitals.chestPain) {
      score += 30;
      reasons.push('Acute chest pain / possible myocardial infarction');
    }

    if (vitals.severeBleeding) {
      score += 25;
      reasons.push('Severe hemorrhaging / major trauma');
    }

    if (vitals.spO2 && Number(vitals.spO2) < 90) {
      score += 25;
      reasons.push(`Hypoxia detected (SpO2: ${vitals.spO2}%)`);
    }

    if (vitals.heartRate && (Number(vitals.heartRate) > 130 || Number(vitals.heartRate) < 50)) {
      score += 20;
      reasons.push(`Hemodynamic instability (Heart Rate: ${vitals.heartRate} bpm)`);
    }

    let priority = 'P3';
    let priorityLabel = 'Code Orange (Moderate)';
    let vehicleTier = 'BLS';

    if (score >= 45 || emergencyType === 'CARDIAC') {
      priority = 'P1';
      priorityLabel = 'Code Red (Critical)';
      vehicleTier = 'ALS';
    } else if (score >= 25 || emergencyType === 'TRAUMA' || emergencyType === 'RESPIRATORY') {
      priority = 'P2';
      priorityLabel = 'Code Yellow (Urgent)';
      vehicleTier = 'ALS';
    } else if (score < 15) {
      priority = 'P4';
      priorityLabel = 'Code Green (Routine)';
      vehicleTier = 'BLS';
    }

    return { priority, priorityLabel, vehicleTier, score, reasons };
  };

  /**
   * Create emergency from Citizen SOS or Dispatch Form
   * Supports both normalized incident records and raw form inputs
   */
  const createEmergency = (input = {}) => {
    // If input is an already-structured emergency (e.g. from FastAPI or One-Tap SOS)
    if (input.incidentCode || input.incidentAddress || input.dbId || input.contactPhone) {
      const lat = Number(input.lat ?? input.latitude ?? 17.3850);
      const lng = Number(input.lng ?? input.longitude ?? 78.4867);
      const newId = input.incidentCode || input.id || `emg-${Date.now().toString().slice(-4)}`;

      const newEmergency = {
        id: newId,
        dbId: input.dbId,
        incidentCode: input.incidentCode || newId,
        patientName: input.patientName || 'Unidentified Patient',
        reporterName: input.callerName || input.reporterName || 'Citizen SOS Reporter',
        reporterPhone: input.contactPhone || input.reporterPhone || '+91 99999 00000',
        contactPhone: input.contactPhone || input.reporterPhone || '+91 99999 00000',
        emergencyType: input.emergencyType || input.type || 'GENERAL',
        type: input.emergencyType || input.type || 'GENERAL',
        severity: input.severity || 'CRITICAL',
        priority: input.severity === 'CRITICAL' ? 'P1' : input.severity === 'HIGH' ? 'P2' : input.severity === 'MEDIUM' ? 'P3' : 'P4',
        priorityLabel: `${input.severity || 'CRITICAL'} Priority`,
        vehicleTierNeeded: input.severity === 'CRITICAL' ? 'ALS' : 'BLS',
        triageReasons: [input.symptoms || `Emergency reported: ${input.emergencyType || 'GENERAL'}`],
        status: input.status || 'REPORTED',
        tripStage: 'UNASSIGNED',
        incidentAddress: input.incidentAddress || input.location || 'Reported Incident Location',
        latitude: lat,
        longitude: lng,
        lat: lat,
        lng: lng,
        pickupLocation: {
          address: input.incidentAddress || input.location || 'Reported Incident Location',
          lat: lat,
          lng: lng,
        },
        vitals: input.vitals || {
          consciousness: input.consciousness || 'ALERT',
          heartRate: 80,
          bloodPressure: '120/80',
          spO2: 98,
          chestPain: (input.emergencyType || '').toUpperCase() === 'CARDIAC',
          severeBleeding: (input.emergencyType || '').toUpperCase() === 'TRAUMA',
        },
        assignedAmbulanceId: input.assignedAmbulanceId || null,
        assignedHospitalId: input.destinationFacilityId || input.destinationHospitalId || null,
        etaMinutes: input.etaMinutes || 8,
        reportedAt: input.reportedAt || new Date().toISOString(),
        date: new Date().toISOString().split('T')[0],
        notes: input.notes || input.symptoms || 'Reported via One-Tap SOS.',
      };

      setEmergencies((prev) => [newEmergency, ...prev]);
      setActiveEmergencyId(newId);

      addNotification(
        `🚨 New Incident Reported: ${newEmergency.incidentCode}`,
        `${newEmergency.emergencyType} (${newEmergency.severity}) at ${newEmergency.incidentAddress}`,
        'emergency'
      );

      return newEmergency;
    }

    const {
      patientName,
      reporterName,
      reporterPhone,
      emergencyType,
      vitals,
      pickupLocation,
      notes,
    } = input;
    const triage = evaluateTriage(vitals, emergencyType);

    // Find nearest available ambulance
    const availableAmbulance =
      ambulances.find((a) => a.status === 'AVAILABLE' && a.type === triage.vehicleTier && a.isActive) ||
      ambulances.find((a) => a.status === 'AVAILABLE' && a.isActive) ||
      ambulances[0];

    const optimalHospital =
      hospitals.find((h) => h.availableIcuBeds > 0) || hospitals[0];

    const newId = `emg-${Date.now().toString().slice(-4)}`;
    const newEmergency = {
      id: newId,
      patientName: patientName || 'Unidentified Patient',
      reporterName: reporterName || 'Anonymous Bystander',
      reporterPhone: reporterPhone || '+91 99999 00000',
      emergencyType: emergencyType || 'OTHER',
      priority: triage.priority,
      priorityLabel: triage.priorityLabel,
      vehicleTierNeeded: triage.vehicleTier,
      triageReasons: triage.reasons,
      status: availableAmbulance ? 'ASSIGNED' : 'REPORTED',
      tripStage: availableAmbulance ? 'ACCEPTED' : 'UNASSIGNED',
      pickupLocation: pickupLocation || {
        address: 'MG Road Metro Station, Bangalore',
        lat: 12.9756,
        lng: 77.6066,
      },
      vitals: {
        consciousness: vitals?.consciousness || 'ALERT',
        heartRate: vitals?.heartRate || 80,
        bloodPressure: vitals?.bloodPressure || '120/80',
        spO2: vitals?.spO2 || 98,
        chestPain: !!vitals?.chestPain,
        severeBleeding: !!vitals?.severeBleeding,
      },
      assignedAmbulanceId: availableAmbulance ? availableAmbulance.id : null,
      assignedHospitalId: optimalHospital.id,
      etaMinutes: 8,
      reportedAt: 'Just now',
      date: new Date().toISOString().split('T')[0],
      notes: notes || 'Emergency reported via PulseRoute web portal.',
    };

    setEmergencies((prev) => [newEmergency, ...prev]);
    setActiveEmergencyId(newId);

    if (availableAmbulance) {
      setAmbulances((prev) =>
        prev.map((a) =>
          a.id === availableAmbulance.id
            ? { ...a, status: 'DISPATCHED', currentEmergencyId: newId }
            : a
        )
      );
    }

    addNotification(
      `🚨 New Incident: ${triage.priorityLabel}`,
      `Assigned Ambulance ${availableAmbulance?.vehicleNumber || 'Pending'} -> ${newEmergency.pickupLocation.address}`,
      'emergency'
    );

    logActivity(
      'EMERGENCY_CREATED',
      reporterName || 'Citizen',
      `Reported #${newId} (${emergencyType} - ${triage.priorityLabel})`,
      'rose'
    );

    return newEmergency;
  };

  /**
   * Trip Workflow Progression:
   * ACCEPTED -> ON_THE_WAY -> ARRIVED_PICKUP -> PATIENT_ONBOARD -> HOSPITAL_REACHED -> COMPLETED
   */
  const advanceTripStage = (emergencyId, nextStage) => {
    const stageToStatusMap = {
      ACCEPTED: 'ASSIGNED',
      ON_THE_WAY: 'EN_ROUTE',
      ARRIVED_PICKUP: 'ON_SCENE',
      PATIENT_ONBOARD: 'TRANSPORTING',
      HOSPITAL_REACHED: 'TRANSPORTING',
      COMPLETED: 'RESOLVED',
    };

    const newStatus = stageToStatusMap[nextStage] || 'TRANSPORTING';

    const target = emergencies.find((e) => e.id === emergencyId);
    if (target?.dbId) {
      EmergencyService.updateStatus(target.dbId, newStatus).catch(() => {});
    }

    setEmergencies((prev) =>
      prev.map((emg) => {
        if (emg.id === emergencyId) {
          return {
            ...emg,
            tripStage: nextStage,
            status: newStatus,
            etaMinutes: nextStage === 'COMPLETED' ? 0 : emg.etaMinutes,
          };
        }
        return emg;
      })
    );

    if (target?.assignedAmbulanceId) {
      const ambUnit = ambulances.find(
        (a) => a.id === target.assignedAmbulanceId || a.ambulanceId === target.assignedAmbulanceId
      );

      let ambStatus = 'DISPATCHED';
      if (nextStage === 'ON_THE_WAY') ambStatus = 'EN_ROUTE';
      else if (nextStage === 'ARRIVED_PICKUP') ambStatus = 'ON_SCENE';
      else if (nextStage === 'PATIENT_ONBOARD' || nextStage === 'HOSPITAL_REACHED') ambStatus = 'TRANSPORTING';
      else if (nextStage === 'COMPLETED') ambStatus = 'AVAILABLE';

      if (ambUnit?.dbId) {
        AmbulanceService.updateStatus(ambUnit.dbId, ambStatus).catch(() => {});
      }

      setAmbulances((prev) =>
        prev.map((amb) => {
          if (amb.id === target.assignedAmbulanceId || amb.ambulanceId === target.assignedAmbulanceId) {
            return {
              ...amb,
              status: ambStatus,
              currentEmergencyId: nextStage === 'COMPLETED' ? null : amb.currentEmergencyId,
            };
          }
          return amb;
        })
      );
    }

    addNotification(
      `Mission Stage Updated: ${nextStage.replace(/_/g, ' ')}`,
      `Emergency #${emergencyId} is now at ${nextStage.replace(/_/g, ' ')}`,
      'info'
    );

    logActivity(
      'TRIP_STAGE',
      'Driver',
      `Emergency #${emergencyId} advanced to ${nextStage.replace(/_/g, ' ')}`,
      'indigo'
    );
  };

  /**
   * Driver accepts incoming dispatch request
   */
  const acceptRequest = (emergencyId, ambulanceId) => {
    setEmergencies((prev) =>
      prev.map((emg) =>
        emg.id === emergencyId
          ? { ...emg, status: 'ASSIGNED', tripStage: 'ACCEPTED', assignedAmbulanceId: ambulanceId }
          : emg
      )
    );
    setAmbulances((prev) =>
      prev.map((amb) =>
        amb.id === ambulanceId
          ? { ...amb, status: 'DISPATCHED', currentEmergencyId: emergencyId }
          : amb
      )
    );
    addNotification('Dispatch Accepted', `Driver accepted incident #${emergencyId}`);
    logActivity('DISPATCH_ACCEPT', 'Driver', `Accepted dispatch for #${emergencyId}`, 'emerald');
  };

  /**
   * Driver rejects incoming dispatch request
   */
  const rejectRequest = (emergencyId) => {
    setEmergencies((prev) =>
      prev.map((emg) =>
        emg.id === emergencyId
          ? { ...emg, status: 'REPORTED', tripStage: 'UNASSIGNED', assignedAmbulanceId: null }
          : emg
      )
    );
    addNotification('Dispatch Declined', `Driver declined incident #${emergencyId}; returned to queue.`);
    logActivity('DISPATCH_REJECT', 'Driver', `Declined dispatch for #${emergencyId}`, 'amber');
  };

  /**
   * Manual dispatch / override from Admin control room
   */
  const assignAmbulance = (emergencyId, ambulanceId) => {
    setEmergencies((prev) =>
      prev.map((emg) =>
        emg.id === emergencyId
          ? { ...emg, assignedAmbulanceId: ambulanceId, status: 'ASSIGNED', tripStage: 'ACCEPTED' }
          : emg
      )
    );
    setAmbulances((prev) =>
      prev.map((amb) =>
        amb.id === ambulanceId
          ? { ...amb, status: 'DISPATCHED', currentEmergencyId: emergencyId }
          : amb
      )
    );
    addNotification('Fleet Reassigned', `Ambulance reassigned to Incident #${emergencyId}`);
    logActivity('REASSIGNMENT', 'Admin', `Assigned unit #${ambulanceId} to Case #${emergencyId}`, 'amber');
  };

  /**
   * Cancel emergency (Reporter or Admin)
   */
  const cancelEmergency = (emergencyId, reason = 'Cancelled by user') => {
    const target = emergencies.find((e) => e.id === emergencyId);
    if (target?.dbId) {
      EmergencyService.updateStatus(target.dbId, 'CANCELLED').catch(() => {});
    }

    setEmergencies((prev) =>
      prev.map((emg) =>
        emg.id === emergencyId
          ? { ...emg, status: 'CANCELLED', tripStage: 'CANCELLED', notes: `${emg.notes} [${reason}]` }
          : emg
      )
    );

    if (target?.assignedAmbulanceId) {
      setAmbulances((prev) =>
        prev.map((amb) =>
          amb.id === target.assignedAmbulanceId
            ? { ...amb, status: 'AVAILABLE', currentEmergencyId: null }
            : amb
        )
      );
    }
    addNotification('Emergency Cancelled', `Incident #${emergencyId} has been cancelled.`);
    logActivity('CANCELLATION', 'Reporter/Admin', `Cancelled #${emergencyId}`, 'rose');
  };

  /**
   * Hospital staff updates bed capacities
   */
  const updateHospitalBeds = (hospitalId, bedType, delta) => {
    setHospitals((prev) =>
      prev.map((hosp) => {
        if (hosp.id === hospitalId || hosp.dbId === hospitalId) {
          const newIcu = bedType === 'icu'
            ? Math.max(0, Math.min(hosp.totalIcuBeds, hosp.availableIcuBeds + delta))
            : hosp.availableIcuBeds;
          const newGen = bedType !== 'icu'
            ? Math.max(0, Math.min(hosp.totalGeneralBeds, hosp.availableGeneralBeds + delta))
            : hosp.availableGeneralBeds;

          if (hosp.dbId) {
            FacilityService.updateCapacity(hosp.dbId, {
              available_icu_beds: newIcu,
              available_general_beds: newGen,
            }).catch(() => {});
          }

          return { ...hosp, availableIcuBeds: newIcu, availableGeneralBeds: newGen };
        }
        return hosp;
      })
    );
    logActivity('BED_CAPACITY', 'Hospital ER Staff', `Updated ${bedType.toUpperCase()} capacity for #${hospitalId}`, 'sky');
  };

  /**
   * Ambulance Management (Add, Edit, Toggle Maintenance)
   */
  const addAmbulance = (newAmbulanceData) => {
    const newAmbulance = {
      id: `amb-${Date.now().toString().slice(-3)}`,
      status: 'AVAILABLE',
      speedKmh: 0,
      batteryOxygenPct: 100,
      currentEmergencyId: null,
      isActive: true,
      lat: 12.9716,
      lng: 77.5946,
      equipmentList: ['Standard Trauma Kit', 'Oxygen Tank'],
      ...newAmbulanceData,
    };
    setAmbulances((prev) => [...prev, newAmbulance]);
    addNotification('Fleet Expanded', `Ambulance ${newAmbulance.vehicleNumber} added to registry`);
    logActivity('FLEET_ADD', 'Admin', `Registered ambulance ${newAmbulance.vehicleNumber}`, 'emerald');
  };

  const updateAmbulance = (id, updates) => {
    setAmbulances((prev) =>
      prev.map((a) => (a.id === id ? { ...a, ...updates } : a))
    );
    logActivity('FLEET_UPDATE', 'Admin', `Updated ambulance #${id}`, 'slate');
  };

  const toggleAmbulanceMaintenance = (id) => {
    setAmbulances((prev) =>
      prev.map((a) => {
        if (a.id === id || a.ambulanceId === id) {
          const newStatus = a.status === 'MAINTENANCE' ? 'AVAILABLE' : 'MAINTENANCE';
          if (a.dbId) {
            AmbulanceService.updateStatus(a.dbId, newStatus).catch(() => {});
          }
          return { ...a, status: newStatus, isActive: newStatus !== 'MAINTENANCE' };
        }
        return a;
      })
    );
  };

  /**
   * Periodic simulation pulse with throttled SQLite GPS backend synchronization (Milestone 8.1 FIX 4)
   */
  const syncCounterRef = useRef(0);

  const advanceSimulationStep = useCallback(() => {
    syncCounterRef.current += 1;
    // Throttled sync to backend every 3 pulses (~12 seconds) to avoid network flooding
    const shouldSyncBackend = syncCounterRef.current % 3 === 0;

    setAmbulances((prev) =>
      prev.map((amb) => {
        if (['EN_ROUTE', 'TRANSPORTING', 'DISPATCHED'].includes(amb.status)) {
          const latDelta = (Math.random() - 0.48) * 0.002;
          const lngDelta = (Math.random() - 0.48) * 0.002;
          const newLat = Number((amb.lat + latDelta).toFixed(5));
          const newLng = Number((amb.lng + lngDelta).toFixed(5));
          const newSpeed = Math.floor(35 + Math.random() * 25);

          // Persist coordinates to SQLite via PATCH /api/v1/ambulances/{id}/location
          if (shouldSyncBackend && (amb.dbId || typeof amb.id === 'number')) {
            const ambTargetId = amb.dbId || amb.id;
            AmbulanceService.updateLocation(ambTargetId, {
              latitude: newLat,
              longitude: newLng,
              speed_kmh: newSpeed,
            }).catch(() => {
              // Graceful handling if backend temporarily offline
            });
          }

          return {
            ...amb,
            lat: newLat,
            lng: newLng,
            speedKmh: newSpeed,
          };
        }
        return amb;
      })
    );

    setEmergencies((prev) =>
      prev.map((emg) => {
        if (['EN_ROUTE', 'TRANSPORTING'].includes(emg.status) && emg.etaMinutes > 1) {
          return {
            ...emg,
            etaMinutes: Math.max(1, emg.etaMinutes - (Math.random() > 0.65 ? 1 : 0)),
          };
        }
        return emg;
      })
    );
  }, []);

  useEffect(() => {
    if (!isSimulatingGps) return;
    const interval = setInterval(advanceSimulationStep, 4000);
    return () => clearInterval(interval);
  }, [isSimulatingGps, advanceSimulationStep]);

  const resetAllData = () => {
    setEmergencies(INITIAL_EMERGENCIES);
    setAmbulances(INITIAL_AMBULANCES);
    setHospitals(INITIAL_HOSPITALS);
    setDrivers(INITIAL_DRIVERS);
    setActivityLog(INITIAL_ACTIVITY_LOG);
    setActiveEmergencyId('emg-01');
    addNotification('System Reset', 'All demo data reset to default scenario');
  };

  const activeEmergency = emergencies.find((e) => e.id === activeEmergencyId) || emergencies[0];

  return (
    <EmergencyContext.Provider
      value={{
        emergencies,
        ambulances,
        hospitals,
        drivers,
        activityLog,
        activeEmergency,
        activeEmergencyId,
        setActiveEmergencyId,
        notifications,
        isSimulatingGps,
        setIsSimulatingGps,
        // Milestone 9: WebSocket connection state exposed to consumers
        wsConnectionState,
        createEmergency,
        advanceTripStage,
        acceptRequest,
        rejectRequest,
        assignAmbulance,
        cancelEmergency,
        updateHospitalBeds,
        addAmbulance,
        updateAmbulance,
        toggleAmbulanceMaintenance,
        advanceSimulationStep,
        resetAllData,
        evaluateTriage,
        addNotification,
        markAsRead,
        markAllRead,
        clearNotifications,
      }}
    >
      {children}
    </EmergencyContext.Provider>
  );
};

export const useEmergency = () => {
  const context = useContext(EmergencyContext);
  if (!context) {
    throw new Error('useEmergency must be used within an EmergencyProvider');
  }
  return context;
};
