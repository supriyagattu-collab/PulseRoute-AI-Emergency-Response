/**
 * PulseRoute Centralized API Service Module
 * Connects the React + Vite frontend to the FastAPI backend.
 * Base URL defaults to http://localhost:8000 (API prefix /api/v1).
 */
import axios from 'axios';

// Configure the API base URL using Vite environment variables, defaulting to http://localhost:8000
const rawBaseUrl = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'http://localhost:8000';
const cleanBaseUrl = rawBaseUrl.replace(/\/+$/, '');
export const API_BASE_URL = cleanBaseUrl.endsWith('/api/v1') ? cleanBaseUrl : `${cleanBaseUrl}/api/v1`;
export const API_ROOT_URL = cleanBaseUrl.replace(/\/api\/v1$/, '');

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
  withCredentials: true,
});

// Request interceptor to append JWT token and CSRF header when available
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('pulseroute_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Attach Double Submit CSRF token for state-changing requests if cookie present
    if (typeof document !== 'undefined') {
      const match = document.cookie.match(/(?:^|;\s*)pulseroute_csrf_token=([^;]+)/);
      if (match) {
        config.headers['X-CSRF-Token'] = decodeURIComponent(match[1]);
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for consistent error extraction
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    let friendlyMessage = 'An unexpected network error occurred.';
    if (error.response) {
      const data = error.response.data;
      if (typeof data?.detail === 'string') {
        friendlyMessage = data.detail;
      } else if (Array.isArray(data?.detail)) {
        friendlyMessage = data.detail.map((err) => `${err.loc?.slice(-1)[0]}: ${err.msg}`).join(', ');
      } else if (data?.message) {
        friendlyMessage = data.message;
      } else {
        friendlyMessage = `Server error (${error.response.status}): ${error.response.statusText}`;
      }
    } else if (error.request) {
      friendlyMessage = `Cannot connect to PulseRoute backend at ${API_BASE_URL}. Ensure FastAPI is running on port 8000.`;
    } else {
      friendlyMessage = error.message;
    }
    error.friendlyMessage = friendlyMessage;
    return Promise.reject(error);
  }
);

/**
 * Normalization utilities to bridge FastAPI schema models (snake_case)
 * with frontend React component expectations (both camelCase and snake_case supported).
 */
export const normalizeAmbulance = (amb) => {
  if (!amb) return null;
  return {
    ...amb,
    dbId: amb.id,
    ambulanceId: amb.ambulance_id || amb.ambulanceId,
    vehicleNumber: amb.vehicle_number || amb.vehicleNumber,
    type: amb.type,
    status: amb.status,
    lat: amb.latitude !== undefined ? amb.latitude : amb.lat,
    lng: amb.longitude !== undefined ? amb.longitude : amb.lng,
    latitude: amb.latitude !== undefined ? amb.latitude : amb.lat,
    longitude: amb.longitude !== undefined ? amb.longitude : amb.lng,
    driverName: amb.driver_name || amb.driverName || 'Designated Driver',
    driverContact: amb.driver_contact || amb.driverContact || '+91 98480 00000',
    baseStation: amb.base_station || amb.baseStation || 'Central EMS Base',
    fuelOxygenLevel: amb.fuel_oxygen_level || amb.fuelOxygenLevel || '95%',
    equipment: Array.isArray(amb.equipment)
      ? amb.equipment
      : (typeof amb.equipment === 'string'
          ? amb.equipment.split(',').map((s) => s.trim()).filter(Boolean)
          : []),
    speedKmh: amb.speed_kmh !== undefined ? amb.speed_kmh : (amb.speedKmh || 0),
    distanceKm: amb.distance_km !== undefined ? amb.distance_km : amb.distanceKm,
    estimatedEtaMinutes: amb.estimated_eta_minutes !== undefined ? amb.estimated_eta_minutes : amb.etaMins,
  };
};

export const normalizeFacility = (fac) => {
  if (!fac) return null;
  const objectId = fac.object_id || fac.objectId;
  return {
    ...fac,
    dbId: fac.id,
    id: fac.id ? `HOSP-${objectId || fac.id}` : fac.id,
    objectId,
    name: fac.facility_name || fac.name,
    facilityName: fac.facility_name || fac.name,
    type: fac.facility_type || fac.type,
    facilityType: fac.facility_type || fac.type,
    district: fac.district || 'Hyderabad',
    mandal: fac.mandal || '',
    address: fac.address || `${fac.mandal || ''}, ${fac.district || 'Telangana'}`,
    lat: fac.latitude !== undefined ? fac.latitude : fac.lat,
    lng: fac.longitude !== undefined ? fac.longitude : fac.lng,
    latitude: fac.latitude !== undefined ? fac.latitude : fac.lat,
    longitude: fac.longitude !== undefined ? fac.longitude : fac.lng,
    totalIcuBeds: fac.total_icu_beds !== undefined ? fac.total_icu_beds : (fac.totalIcuBeds ?? 20),
    availableIcuBeds: fac.available_icu_beds !== undefined ? fac.available_icu_beds : (fac.availableIcuBeds ?? 5),
    totalGeneralBeds: fac.total_general_beds !== undefined ? fac.total_general_beds : (fac.totalGeneralBeds ?? 100),
    availableGeneralBeds: fac.available_general_beds !== undefined ? fac.available_general_beds : (fac.availableGeneralBeds ?? 25),
    traumaLevel: fac.trauma_level || fac.traumaLevel || 'Level 2 Trauma Center',
    emergencyPhone: fac.emergency_phone || fac.emergencyPhone || '040-24600121',
    hasCathLab: fac.has_cath_lab !== undefined ? fac.has_cath_lab : !!fac.hasCathLab,
    hasCTScan: fac.has_ct_scan !== undefined ? fac.has_ct_scan : !!fac.hasCTScan,
    distanceKm: fac.distance_km !== undefined ? fac.distance_km : fac.distanceKm,
    etaMins: fac.estimated_eta_minutes !== undefined ? fac.estimated_eta_minutes : (fac.etaMins || 8),
    matchScore: fac.match_score !== undefined ? fac.match_score : (fac.matchScore || 85),
    matchedSpecialty: fac.matched_specialty || fac.matchedSpecialty || 'General Medicine',
    specialties: fac.specialties || ['General Medicine', 'Emergency Care'],
    matchReasons: fac.match_reasons || fac.matchReasons || [
      `${fac.available_icu_beds || 5} ICU Beds Available`,
      fac.has_cath_lab ? 'Cardiac Cath Lab Ready' : null,
      fac.has_ct_scan ? '24/7 CT Scan Ready' : null,
    ].filter(Boolean),
    missingInformation: fac.missing_information || fac.missingInformation || [
      'Live dynamic traffic sensor unconfigured (using standard 40 km/h urban EMS baseline)',
    ],
    trafficStatus: fac.traffic_status || fac.trafficStatus || 'Estimated EMS transit (no live traffic API configured)',
    scoreBreakdown: fac.score_breakdown || fac.scoreBreakdown || null,
  };
};

export const normalizeEmergency = (emg) => {
  if (!emg) return null;
  return {
    ...emg,
    dbId: emg.id,
    id: emg.incident_code || `EMG-${emg.id}`,
    incidentCode: emg.incident_code || `EMG-${emg.id}`,
    patientName: emg.patient_name || emg.patientName,
    contactPhone: emg.contact_phone || emg.contactPhone,
    patientAge: emg.patient_age !== undefined ? emg.patient_age : emg.patientAge,
    gender: emg.gender || 'UNKNOWN',
    emergencyType: emg.emergency_type || emg.emergencyType || 'GENERAL',
    type: emg.emergency_type || emg.type || 'GENERAL',
    severity: emg.severity || 'CRITICAL',
    status: emg.status || 'REPORTED',
    consciousness: emg.consciousness,
    breathing: emg.breathing,
    incidentAddress: emg.incident_address || emg.incidentAddress || emg.location,
    location: emg.incident_address || emg.location || 'Incident Site',
    lat: emg.latitude !== undefined ? emg.latitude : emg.lat,
    lng: emg.longitude !== undefined ? emg.longitude : emg.lng,
    latitude: emg.latitude !== undefined ? emg.latitude : emg.lat,
    longitude: emg.longitude !== undefined ? emg.longitude : emg.lng,
    symptoms: emg.symptoms,
    reportedAt: emg.reported_at || emg.reportedAt || emg.date,
    date: emg.reported_at ? new Date(emg.reported_at).toLocaleString() : (emg.date || 'Just now'),
    destinationFacilityId: emg.destination_facility_id,
    statusHistory: (emg.status_history || emg.statusHistory || []).map((h) => ({
      id: h.id,
      emergencyId: h.emergency_id || h.emergencyId,
      fromStatus: h.from_status || h.fromStatus,
      toStatus: h.to_status || h.toStatus,
      changedBy: h.changed_by || h.changedBy || 'SYSTEM',
      notes: h.notes,
      changedAt: h.changed_at || h.changedAt,
      timeFormatted: h.changed_at ? new Date(h.changed_at).toLocaleTimeString() : 'Recent',
    })),
  };
};

export const normalizeAssignment = (asg) => {
  if (!asg) return null;
  return {
    ...asg,
    dbId: asg.id,
    id: `ASG-${asg.id}`,
    emergencyId: asg.emergency_id,
    ambulanceId: asg.ambulance_id,
    status: asg.status,
    estimatedEtaMinutes: asg.estimated_eta_minutes,
    notes: asg.notes,
    assignedAt: asg.assigned_at,
    completedAt: asg.completed_at,
    emergency: normalizeEmergency(asg.emergency),
    ambulance: normalizeAmbulance(asg.ambulance),
  };
};

/**
 * Health & Diagnostics Service
 */
export const HealthService = {
  checkHealth: async () => {
    const res = await apiClient.get('/health');
    return res.data;
  },
};

/**
 * Ambulance Fleet Service
 */
export const AmbulanceService = {
  getAmbulances: async (params = {}) => {
    const res = await apiClient.get('/ambulances', { params });
    return (res.data || []).map(normalizeAmbulance);
  },
  getNearestAmbulance: async ({ lat, lng, type }) => {
    const params = { lat, lng };
    if (type && type !== 'ANY') params.type = type;
    const res = await apiClient.get('/ambulances/nearest', { params });
    return {
      ...res.data,
      ambulance: normalizeAmbulance(res.data?.ambulance),
    };
  },
  getAmbulanceById: async (id) => {
    const res = await apiClient.get(`/ambulances/${id}`);
    return normalizeAmbulance(res.data);
  },
  updateStatus: async (id, status) => {
    const res = await apiClient.patch(`/ambulances/${id}/status`, { status });
    return normalizeAmbulance(res.data);
  },
  updateLocation: async (id, { latitude, longitude, speed_kmh = 0 }) => {
    const res = await apiClient.patch(`/ambulances/${id}/location`, {
      latitude,
      longitude,
      speed_kmh,
    });
    return normalizeAmbulance(res.data);
  },
};

/**
 * Healthcare Facilities & Hospital Recommendations Service
 */
export const FacilityService = {
  getFacilities: async (params = {}) => {
    const res = await apiClient.get('/facilities', { params });
    return (res.data || []).map(normalizeFacility);
  },
  getRecommendations: async ({ patient_lat, patient_lng, emergency_type = 'GENERAL', limit = 5 }) => {
    const res = await apiClient.get('/facilities/recommendations', {
      params: { patient_lat, patient_lng, emergency_type, limit },
    });
    return (res.data || []).map(normalizeFacility);
  },
  searchFacilities: async (params = {}) => {
    const cleanParams = {};
    if (params.q) cleanParams.q = params.q;
    if (params.district && params.district !== 'ALL') cleanParams.district = params.district;
    if (params.type && params.type !== 'ALL') cleanParams.type = params.type;
    if (params.patient_lat !== undefined) cleanParams.patient_lat = params.patient_lat;
    if (params.patient_lng !== undefined) cleanParams.patient_lng = params.patient_lng;
    if (params.condition && params.condition !== 'ALL') cleanParams.condition = params.condition;
    if (params.limit) cleanParams.limit = params.limit;

    const res = await apiClient.get('/facilities/search', { params: cleanParams });
    return (res.data || []).map(normalizeFacility);
  },
  getFacilityById: async (id) => {
    const res = await apiClient.get(`/facilities/${id}`);
    return normalizeFacility(res.data);
  },
  updateCapacity: async (id, capacity) => {
    const res = await apiClient.patch(`/facilities/${id}/capacity`, capacity);
    return normalizeFacility(res.data);
  },
};

/**
 * Emergency Reports Service
 */
export const EmergencyService = {
  createEmergency: async (payload) => {
    const res = await apiClient.post('/emergencies', payload);
    return normalizeEmergency(res.data);
  },
  getEmergencies: async (params = {}) => {
    const cleanParams = {};
    if (params.skip !== undefined) cleanParams.skip = params.skip;
    if (params.limit !== undefined) cleanParams.limit = params.limit;
    if (params.severity && params.severity !== 'ALL') cleanParams.severity = params.severity;
    if (params.status && params.status !== 'ALL') cleanParams.status = params.status;

    const res = await apiClient.get('/emergencies', { params: cleanParams });
    return (res.data || []).map(normalizeEmergency);
  },
  getEmergencyById: async (id) => {
    const res = await apiClient.get(`/emergencies/${id}`);
    return normalizeEmergency(res.data);
  },
  getStatusHistory: async (id) => {
    const res = await apiClient.get(`/emergencies/${id}/history`);
    return (res.data || []).map((h) => ({
      id: h.id,
      emergencyId: h.emergency_id,
      fromStatus: h.from_status,
      toStatus: h.to_status,
      changedBy: h.changed_by,
      notes: h.notes,
      changedAt: h.changed_at,
      timeFormatted: h.changed_at ? new Date(h.changed_at).toLocaleTimeString() : 'Recent',
    }));
  },
  updateStatus: async (id, statusOrPayload) => {
    const payload = typeof statusOrPayload === 'string' ? { status: statusOrPayload } : statusOrPayload;
    const res = await apiClient.patch(`/emergencies/${id}/status`, payload);
    return normalizeEmergency(res.data);
  },
};

/**
 * Ambulance Dispatch Assignments Service
 */
export const AssignmentService = {
  createAssignment: async (payload) => {
    const res = await apiClient.post('/assignments', payload);
    return normalizeAssignment(res.data);
  },
  getAssignments: async (params = {}) => {
    const res = await apiClient.get('/assignments', { params });
    return (res.data || []).map(normalizeAssignment);
  },
  getAssignmentById: async (id) => {
    const res = await apiClient.get(`/assignments/${id}`);
    return normalizeAssignment(res.data);
  },
  getAssignmentsByEmergency: async (emergencyId) => {
    const res = await apiClient.get(`/assignments/emergency/${emergencyId}`);
    return (res.data || []).map(normalizeAssignment);
  },
};

/**
 * Auth Service (Milestone 9.1 & 10.1 Production Security & JWT authentication)
 */
export const AuthService = {
  login: async (credentials) => {
    const res = await apiClient.post('/auth/login', credentials);
    return res.data;
  },
  register: async (userData) => {
    const res = await apiClient.post('/auth/register', userData);
    return res.data;
  },
  getCurrentUser: async () => {
    const res = await apiClient.get('/auth/me');
    return res.data;
  },
  refreshToken: async (payload = {}) => {
    const res = await apiClient.post('/auth/refresh', payload);
    return res.data;
  },
  logout: async (payload = {}) => {
    const res = await apiClient.post('/auth/logout', payload);
    return res.data;
  },
  updateUserRole: async (userId, role) => {
    const res = await apiClient.patch(`/auth/users/${userId}/role`, { role });
    return res.data;
  },
  createToken: async (payload) => {
    const res = await apiClient.post('/auth/token', payload);
    return res.data;
  },
  getDemoToken: async (role = 'admin') => {
    const res = await apiClient.get('/auth/demo-token', { params: { role } });
    return res.data;
  },
};

// Aliases for backwards compatibility with earlier components
export const FleetService = AmbulanceService;
export const HospitalService = FacilityService;

export default {
  apiClient,
  API_BASE_URL,
  API_ROOT_URL,
  HealthService,
  AmbulanceService,
  FacilityService,
  EmergencyService,
  AssignmentService,
  AuthService,
  FleetService,
  HospitalService,
  normalizeAmbulance,
  normalizeFacility,
  normalizeEmergency,
  normalizeAssignment,
};
