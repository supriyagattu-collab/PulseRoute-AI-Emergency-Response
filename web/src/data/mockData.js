/**
 * Comprehensive Mock Dataset for PulseRoute AI Emergency System
 * Coordinated around a metro city center (Bangalore / Tech Hub Coordinates)
 */

export const DEMO_USERS = {
  reporter: {
    id: "user-rep-01",
    email: "reporter@example.com",
    fullName: "Priya Sharma",
    phone: "+91 98765 43210",
    role: "REPORTER",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
    address: "Indiranagar 100ft Road, Bangalore"
  },
  driver: {
    id: "user-drv-01",
    email: "driver@example.com",
    fullName: "Rajesh Kumar",
    phone: "+91 98123 45678",
    role: "DRIVER",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    vehicleId: "amb-01",
    badgeNumber: "EMS-BLR-409",
    experienceYears: 7
  },
  hospital: {
    id: "user-hsp-01",
    email: "hospital@example.com",
    fullName: "Dr. Ananya Iyer",
    phone: "+91 98234 56789",
    role: "HOSPITAL",
    avatar: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&auto=format&fit=crop&q=80",
    hospitalId: "hosp-01",
    department: "Emergency & Trauma Command"
  },
  dispatcher: {
    id: "user-dsp-01",
    email: "dispatcher@example.com",
    fullName: "Central Dispatch Lead",
    phone: "+91 98450 12345",
    role: "DISPATCHER",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    station: "EMS Dispatch Console"
  },
  admin: {
    id: "user-adm-01",
    email: "admin@example.com",
    fullName: "Vikramaditya Rao",
    phone: "+91 98345 67890",
    role: "ADMIN",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    station: "Central Emergency Dispatch HQ (Bangalore Central)"
  }
};

export const INITIAL_DRIVERS = [
  {
    id: "user-drv-01",
    fullName: "Rajesh Kumar",
    phone: "+91 98123 45678",
    email: "driver@example.com",
    assignedAmbulanceId: "amb-01",
    assignedAmbulanceNumber: "KA-01-EA-1081",
    status: "ON_DUTY", // ON_DUTY, BUSY, OFF_DUTY
    completedTrips: 142,
    rating: 4.9,
    licenseNumber: "KA-01-2017-00981",
    certification: "Advanced Cardiac Life Support (ACLS)",
    experienceYears: 7
  },
  {
    id: "user-drv-02",
    fullName: "Sunil Verma",
    phone: "+91 98234 11223",
    email: "sunil.verma@ems.gov",
    assignedAmbulanceId: "amb-02",
    assignedAmbulanceNumber: "KA-04-EA-1082",
    status: "ON_DUTY",
    completedTrips: 88,
    rating: 4.8,
    licenseNumber: "KA-04-2019-01124",
    certification: "Basic EMT Certified",
    experienceYears: 4
  },
  {
    id: "user-drv-03",
    fullName: "Mohan Lal",
    phone: "+91 98345 33445",
    email: "mohan.lal@ems.gov",
    assignedAmbulanceId: "amb-03",
    assignedAmbulanceNumber: "KA-05-EA-1083",
    status: "BUSY",
    completedTrips: 210,
    rating: 4.9,
    licenseNumber: "KA-05-2015-00432",
    certification: "Paramedic Special Operations",
    experienceYears: 9
  },
  {
    id: "user-drv-04",
    fullName: "Deepak Gowda",
    phone: "+91 98456 55667",
    email: "deepak.gowda@ems.gov",
    assignedAmbulanceId: "amb-04",
    assignedAmbulanceNumber: "KA-02-EA-1084",
    status: "ON_DUTY",
    completedTrips: 64,
    rating: 4.7,
    licenseNumber: "KA-02-2021-00998",
    certification: "Emergency Vehicle Operator (EVOC)",
    experienceYears: 3
  },
  {
    id: "user-drv-05",
    fullName: "Venkatesh Babu",
    phone: "+91 98567 77889",
    email: "venkatesh.b@ems.gov",
    assignedAmbulanceId: "amb-05",
    assignedAmbulanceNumber: "KA-03-EA-1085",
    status: "OFF_DUTY",
    completedTrips: 119,
    rating: 4.6,
    licenseNumber: "KA-03-2018-00561",
    certification: "First Responder Certified",
    experienceYears: 6
  }
];

export const INITIAL_HOSPITALS = [
  {
    id: "hosp-01",
    name: "Apollo Multispeciality Trauma Center",
    address: "154/11 Bannerghatta Main Rd, Bangalore",
    lat: 12.8953,
    lng: 77.5985,
    totalIcuBeds: 24,
    availableIcuBeds: 5,
    totalGeneralBeds: 80,
    availableGeneralBeds: 18,
    traumaLevel: "Level 1 Trauma & Cardiac",
    hasCathLab: true,
    hasBurnUnit: true,
    hasStrokeUnit: true,
    phone: "+91 80 2630 4050",
    emergencyContact: "080-26304099",
    rating: 4.8,
    status: "ACTIVE"
  },
  {
    id: "hosp-02",
    name: "Manipal Emergency Hospital",
    address: "98 HAL Old Airport Rd, Kodihalli, Bangalore",
    lat: 12.9592,
    lng: 77.6499,
    totalIcuBeds: 30,
    availableIcuBeds: 8,
    totalGeneralBeds: 120,
    availableGeneralBeds: 34,
    traumaLevel: "Level 1 Trauma & Stroke",
    hasCathLab: true,
    hasBurnUnit: false,
    hasStrokeUnit: true,
    phone: "+91 80 2502 4444",
    emergencyContact: "080-25024499",
    rating: 4.9,
    status: "ACTIVE"
  },
  {
    id: "hosp-03",
    name: "Fortis Super Specialty Hospital",
    address: "14 Cunningham Rd, Vasanth Nagar, Bangalore",
    lat: 12.9868,
    lng: 77.5963,
    totalIcuBeds: 18,
    availableIcuBeds: 2,
    totalGeneralBeds: 60,
    availableGeneralBeds: 11,
    traumaLevel: "Level 2 Comprehensive",
    hasCathLab: true,
    hasBurnUnit: false,
    hasStrokeUnit: true,
    phone: "+91 80 4040 2000",
    emergencyContact: "080-40402099",
    rating: 4.7,
    status: "ACTIVE"
  },
  {
    id: "hosp-04",
    name: "Victoria Memorial Government Hospital",
    address: "Fort Road, Near City Market, Bangalore",
    lat: 12.9634,
    lng: 77.5756,
    totalIcuBeds: 40,
    availableIcuBeds: 12,
    totalGeneralBeds: 250,
    availableGeneralBeds: 68,
    traumaLevel: "Apex Public Trauma & Burns",
    hasCathLab: true,
    hasBurnUnit: true,
    hasStrokeUnit: false,
    phone: "+91 80 2670 1150",
    emergencyContact: "080-26701199",
    rating: 4.4,
    status: "ACTIVE"
  }
];

export const INITIAL_AMBULANCES = [
  {
    id: "amb-01",
    vehicleNumber: "KA-01-EA-1081",
    type: "ALS", // ALS = Advanced Life Support, BLS = Basic Life Support
    driverId: "user-drv-01",
    driverName: "Rajesh Kumar",
    driverPhone: "+91 98123 45678",
    status: "EN_ROUTE", // AVAILABLE, DISPATCHED, EN_ROUTE, ON_SCENE, TRANSPORTING, MAINTENANCE
    lat: 12.9680,
    lng: 77.6150,
    speedKmh: 46,
    batteryOxygenPct: 94,
    currentEmergencyId: "emg-01",
    baseStation: "Koramangala Emergency Hub",
    equipmentList: ["Ventilator", "Defibrillator", "Cardiac Monitor", "Suction Unit"],
    isActive: true
  },
  {
    id: "amb-02",
    vehicleNumber: "KA-04-EA-1082",
    type: "ALS",
    driverId: "user-drv-02",
    driverName: "Sunil Verma",
    driverPhone: "+91 98234 11223",
    status: "AVAILABLE",
    lat: 12.9352,
    lng: 77.6245,
    speedKmh: 0,
    batteryOxygenPct: 98,
    currentEmergencyId: null,
    baseStation: "HSR Layout Station",
    equipmentList: ["Defibrillator", "Multipara Monitor", "Oxygen Tank"],
    isActive: true
  },
  {
    id: "amb-03",
    vehicleNumber: "KA-05-EA-1083",
    type: "BLS",
    driverId: "user-drv-03",
    driverName: "Mohan Lal",
    driverPhone: "+91 98345 33445",
    status: "TRANSPORTING",
    lat: 12.9510,
    lng: 77.6400,
    speedKmh: 52,
    batteryOxygenPct: 88,
    currentEmergencyId: "emg-02",
    baseStation: "Indiranagar EMS Station",
    equipmentList: ["First Aid Trauma Kit", "Stretcher", "O2 Cylinder"],
    isActive: true
  },
  {
    id: "amb-04",
    vehicleNumber: "KA-02-EA-1084",
    type: "ALS",
    driverId: "user-drv-04",
    driverName: "Deepak Gowda",
    driverPhone: "+91 98456 55667",
    status: "AVAILABLE",
    lat: 12.9815,
    lng: 77.5890,
    speedKmh: 0,
    batteryOxygenPct: 100,
    currentEmergencyId: null,
    baseStation: "Shivajinagar Depot",
    equipmentList: ["Transport Ventilator", "Defibrillator", "IV Infusion Pump"],
    isActive: true
  },
  {
    id: "amb-05",
    vehicleNumber: "KA-03-EA-1085",
    type: "BLS",
    driverId: "user-drv-05",
    driverName: "Venkatesh Babu",
    driverPhone: "+91 98567 77889",
    status: "MAINTENANCE",
    lat: 12.9220,
    lng: 77.5680,
    speedKmh: 0,
    batteryOxygenPct: 45,
    currentEmergencyId: null,
    baseStation: "Jayanagar Workshop",
    equipmentList: ["Basic Splints", "First Aid Kit"],
    isActive: false
  }
];

export const INITIAL_EMERGENCIES = [
  {
    id: "emg-01",
    patientName: "Sanjay Menon (Age 54)",
    reporterName: "Priya Sharma",
    reporterPhone: "+91 98765 43210",
    emergencyType: "CARDIAC",
    priority: "P1", // P1: Critical, P2: Urgent, P3: Moderate, P4: Routine
    priorityLabel: "Code Red (Critical)",
    status: "EN_ROUTE", // REPORTED, ASSIGNED, EN_ROUTE, ON_SCENE, TRANSPORTING, RESOLVED, CANCELLED
    tripStage: "ON_THE_WAY", // ACCEPTED, ON_THE_WAY, ARRIVED_PICKUP, PATIENT_ONBOARD, HOSPITAL_REACHED, COMPLETED
    pickupLocation: {
      address: "Flat 402, Green Vista Apartments, Indiranagar, Bangalore",
      lat: 12.9719,
      lng: 77.6412
    },
    vitals: {
      consciousness: "VERBAL", // ALERT, VERBAL, PAIN, UNRESPONSIVE (AVPU scale)
      heartRate: 142,
      bloodPressure: "175/105",
      spO2: 89,
      chestPain: true,
      severeBleeding: false
    },
    assignedAmbulanceId: "amb-01",
    assignedHospitalId: "hosp-02",
    etaMinutes: 6,
    reportedAt: "10 mins ago",
    date: "2026-10-13",
    notes: "Sudden onset chest clutching, severe sweating, history of diabetes."
  },
  {
    id: "emg-02",
    patientName: "Rohan Patel (Age 28)",
    reporterName: "Amitabh Singh",
    reporterPhone: "+91 98111 22334",
    emergencyType: "TRAUMA",
    priority: "P2",
    priorityLabel: "Code Yellow (Urgent)",
    status: "TRANSPORTING",
    tripStage: "PATIENT_ONBOARD",
    pickupLocation: {
      address: "Domlur Flyover Junction, Inner Ring Rd, Bangalore",
      lat: 12.9610,
      lng: 77.6380
    },
    vitals: {
      consciousness: "ALERT",
      heartRate: 104,
      bloodPressure: "128/84",
      spO2: 96,
      chestPain: false,
      severeBleeding: true
    },
    assignedAmbulanceId: "amb-03",
    assignedHospitalId: "hosp-02",
    etaMinutes: 4,
    reportedAt: "24 mins ago",
    date: "2026-10-13",
    notes: "Two-wheeler collision. Deep laceration on right thigh, bleeding controlled via tourniquet."
  },
  {
    id: "emg-03",
    patientName: "Meera Das (Age 71)",
    reporterName: "Kavita Das",
    reporterPhone: "+91 98999 88776",
    emergencyType: "RESPIRATORY",
    priority: "P2",
    priorityLabel: "Code Yellow (Urgent)",
    status: "REPORTED",
    tripStage: "UNASSIGNED",
    pickupLocation: {
      address: "24th Main, 5th Phase, JP Nagar, Bangalore",
      lat: 12.9080,
      lng: 77.5850
    },
    vitals: {
      consciousness: "ALERT",
      heartRate: 110,
      bloodPressure: "140/90",
      spO2: 87,
      chestPain: false,
      severeBleeding: false
    },
    assignedAmbulanceId: null,
    assignedHospitalId: "hosp-01",
    etaMinutes: 12,
    reportedAt: "2 mins ago",
    date: "2026-10-13",
    notes: "Chronic COPD flare-up, audible wheezing, low oxygen saturation."
  },
  {
    id: "emg-04",
    patientName: "Karthik Nair (Age 34)",
    reporterName: "Naveen Raj",
    reporterPhone: "+91 98888 77665",
    emergencyType: "INJURY",
    priority: "P3",
    priorityLabel: "Code Orange (Moderate)",
    status: "RESOLVED",
    tripStage: "COMPLETED",
    pickupLocation: {
      address: "Commercial Street, Tasker Town, Bangalore",
      lat: 12.9825,
      lng: 77.6080
    },
    vitals: {
      consciousness: "ALERT",
      heartRate: 88,
      bloodPressure: "120/80",
      spO2: 99,
      chestPain: false,
      severeBleeding: false
    },
    assignedAmbulanceId: "amb-02",
    assignedHospitalId: "hosp-03",
    etaMinutes: 0,
    reportedAt: "2 hours ago",
    date: "2026-10-13",
    notes: "Slip and fall on rain slick stairs. Suspected ankle fracture, stabilized with splint."
  },
  {
    id: "emg-05",
    patientName: "Fatima Bi (Age 62)",
    reporterName: "Mohd. Shakeel",
    reporterPhone: "+91 97777 66554",
    emergencyType: "STROKE",
    priority: "P1",
    priorityLabel: "Code Red (Critical)",
    status: "RESOLVED",
    tripStage: "COMPLETED",
    pickupLocation: {
      address: "Frazer Town 1st Cross, Pulikeshi Nagar, Bangalore",
      lat: 12.9980,
      lng: 77.6140
    },
    vitals: {
      consciousness: "VERBAL",
      heartRate: 126,
      bloodPressure: "190/115",
      spO2: 93,
      chestPain: false,
      severeBleeding: false
    },
    assignedAmbulanceId: "amb-04",
    assignedHospitalId: "hosp-03",
    etaMinutes: 0,
    reportedAt: "4 hours ago",
    date: "2026-10-13",
    notes: "Sudden facial drooping, right-side hemiparesis. Rushed to stroke unit cath lab."
  }
];

export const INITIAL_ACTIVITY_LOG = [
  {
    id: "act-01",
    timestamp: "10 mins ago",
    actionType: "DISPATCH",
    actor: "System / AI Matcher",
    details: "Dispatched Ambulance KA-01-EA-1081 to Case #emg-01 (Cardiac Code Red)",
    badgeColor: "rose"
  },
  {
    id: "act-02",
    timestamp: "24 mins ago",
    actionType: "STATUS_UPDATE",
    actor: "Driver Rajesh Kumar",
    details: "Ambulance KA-05-EA-1083 changed status to TRANSPORTING for Case #emg-02",
    badgeColor: "indigo"
  },
  {
    id: "act-03",
    timestamp: "35 mins ago",
    actionType: "BED_UPDATE",
    actor: "Dr. Ananya Iyer",
    details: "Apollo Hospital updated available ICU beds to 5 (Capacity synced)",
    badgeColor: "sky"
  },
  {
    id: "act-04",
    timestamp: "2 hours ago",
    actionType: "RESOLUTION",
    actor: "Hospital Staff (Fortis)",
    details: "Patient Karthik Nair admitted to ER. Case #emg-04 marked RESOLVED",
    badgeColor: "emerald"
  },
  {
    id: "act-05",
    timestamp: "4 hours ago",
    actionType: "OVERRIDE",
    actor: "Admin Vikramaditya Rao",
    details: "Reassigned Ambulance KA-02-EA-1084 from Routine to Code Red Stroke Case #emg-05",
    badgeColor: "amber"
  }
];

export const ANALYTICS_DATA = {
  summary: {
    avgResponseTimeMinutes: 7.4,
    totalDispatchesToday: 48,
    successfulSavesPct: 98.2,
    activeAmbulancesCount: 4,
    criticalCasesCount: 14,
    fleetUtilizationPct: 78
  },
  hourlyIncidents: [
    { hour: "00:00", incidents: 3, avgEta: 6.2 },
    { hour: "03:00", incidents: 1, avgEta: 5.5 },
    { hour: "06:00", incidents: 4, avgEta: 6.8 },
    { hour: "09:00", incidents: 9, avgEta: 9.4 },
    { hour: "12:00", incidents: 7, avgEta: 8.1 },
    { hour: "15:00", incidents: 6, avgEta: 7.9 },
    { hour: "18:00", incidents: 11, avgEta: 11.2 },
    { hour: "21:00", incidents: 7, avgEta: 8.0 }
  ],
  priorityBreakdown: [
    { name: "P1 Critical", value: 32, color: "#ef4444" },
    { name: "P2 Urgent", value: 44, color: "#f59e0b" },
    { name: "P3 Moderate", value: 18, color: "#eab308" },
    { name: "P4 Routine", value: 6, color: "#10b981" }
  ],
  typeBreakdown: [
    { name: "Cardiac", count: 18 },
    { name: "Trauma / Road", count: 15 },
    { name: "Respiratory", count: 8 },
    { name: "Stroke / Neuro", count: 5 },
    { name: "Maternal", count: 2 }
  ],
  hospitalCapacityShare: [
    { name: "Apollo", available: 23, occupied: 81 },
    { name: "Manipal", available: 42, occupied: 108 },
    { name: "Fortis", available: 13, occupied: 65 },
    { name: "Victoria", available: 80, occupied: 210 }
  ]
};
