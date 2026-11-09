/**
 * PulseRoute Core Datasets & Utility Engine
 * Built from:
 * 1. data/pulseroute_ambulances_demo.csv (AMB001-AMB005)
 * 2. data/pulseroute_health_facilities.csv (Health Facilities & Hospitals across Telangana)
 */

export const AMBULANCES_DEMO = [
  {
    ambulanceId: 'AMB001',
    vehicleNumber: 'TS-09-EA-1081',
    type: 'ALS',
    status: 'AVAILABLE',
    lat: 17.3985,
    lng: 78.4735,
    driverName: 'Ramesh Yadav',
    driverContact: '+91 98480 11201',
    baseStation: 'Osmania Trauma Hub',
    fuelOxygenLevel: '96%',
    equipment: ['Ventilator', 'Defibrillator', 'Cardiac Monitor', 'Suction Unit', 'Oxygen 15L'],
    speedKmh: 0,
    rating: 4.9,
    tripsCompleted: 142
  },
  {
    ambulanceId: 'AMB002',
    vehicleNumber: 'TS-09-EA-1082',
    type: 'BLS',
    status: 'AVAILABLE',
    lat: 17.4325,
    lng: 78.4982,
    driverName: 'Sumanth Reddy',
    driverContact: '+91 98480 22302',
    baseStation: 'Secunderabad Gandhi Station',
    fuelOxygenLevel: '91%',
    equipment: ['AED', 'Multi-para Monitor', 'Oxygen Cylinder', 'Splints & Spineboard'],
    speedKmh: 0,
    rating: 4.8,
    tripsCompleted: 88
  },
  {
    ambulanceId: 'AMB003',
    vehicleNumber: 'TS-10-EA-1083',
    type: 'ALS',
    status: 'BUSY',
    lat: 17.4150,
    lng: 78.4410,
    driverName: 'Mohammed Farooq',
    driverContact: '+91 98480 33403',
    baseStation: 'Banjara Hills Rapid Unit',
    fuelOxygenLevel: '84%',
    equipment: ['Transport Ventilator', 'Advanced Airway Kit', 'Defibrillator', 'IV Infusion Pump'],
    speedKmh: 42,
    rating: 4.9,
    tripsCompleted: 210
  },
  {
    ambulanceId: 'AMB004',
    vehicleNumber: 'TS-10-EA-1084',
    type: 'ALS',
    status: 'EN_ROUTE',
    lat: 17.4480,
    lng: 78.3750,
    driverName: 'Venkatesh Nayak',
    driverContact: '+91 98480 44504',
    baseStation: 'Cyberabad Emergency Center',
    fuelOxygenLevel: '88%',
    equipment: ['Cardiac Resuscitation Kit', 'Multipara Telemetry', 'Oxygen Concentrator'],
    speedKmh: 54,
    rating: 4.7,
    tripsCompleted: 64
  },
  {
    ambulanceId: 'AMB005',
    vehicleNumber: 'TS-08-EA-1085',
    type: 'BLS',
    status: 'MAINTENANCE',
    lat: 17.3620,
    lng: 78.5280,
    driverName: 'Anji Kumar',
    driverContact: '+91 98480 55605',
    baseStation: 'Saroornagar EMS Post',
    fuelOxygenLevel: '62%',
    equipment: ['Basic First Aid Trauma Bag', 'Stretcher', 'Ambu Bag', 'Oxygen Tank'],
    speedKmh: 0,
    rating: 4.6,
    tripsCompleted: 119
  }
];

export const HEALTH_FACILITIES = [
  // Major Teaching Hospitals & Tertiary Centers (Apex Trauma & ICU)
  {
    id: 'HOSP-5120',
    objectId: 5120,
    name: 'Osmania General Hospital',
    type: 'Teaching Hospital',
    district: 'Hyderabad',
    mandal: 'Nampally',
    lat: 17.37448343,
    lng: 78.4745636,
    address: 'Afzal Gunj, Nampally, Hyderabad, Telangana 500012',
    traumaLevel: 'Level 1 Apex Trauma',
    totalIcuBeds: 50,
    availableIcuBeds: 8,
    totalGeneralBeds: 500,
    availableGeneralBeds: 64,
    specialties: ['Trauma Surgery', 'Cardiology', 'Neurology', 'Orthopedics', 'Burn Center', 'Toxicology'],
    emergencyPhone: '040-24600121',
    hasCathLab: true,
    hasBloodBank: true,
    hasCTScan: true,
    verified: true
  },
  {
    id: 'HOSP-5121',
    objectId: 5121,
    name: 'Gandhi Hospital',
    type: 'Teaching Hospital',
    district: 'Hyderabad',
    mandal: 'Musheerabad',
    lat: 17.42434803,
    lng: 78.50199034,
    address: 'Musheerabad, Secunderabad, Hyderabad, Telangana 500003',
    traumaLevel: 'Level 1 Apex Trauma & Stroke',
    totalIcuBeds: 60,
    availableIcuBeds: 12,
    totalGeneralBeds: 600,
    availableGeneralBeds: 82,
    specialties: ['Stroke Center', 'Emergency Medicine', 'Pediatric ICU', 'Cardiac Care', 'Neurosurgery'],
    emergencyPhone: '040-27505566',
    hasCathLab: true,
    hasBloodBank: true,
    hasCTScan: true,
    verified: true
  },
  {
    id: 'HOSP-5124',
    objectId: 5124,
    name: 'Niloufer Hospital for Women and Children',
    type: 'Teaching Hospital',
    district: 'Hyderabad',
    mandal: 'Asifnagar',
    lat: 17.39883659,
    lng: 78.46107695,
    address: 'Red Hills, Lakdikapul, Hyderabad, Telangana 500004',
    traumaLevel: 'Apex Pediatric & Maternity Trauma',
    totalIcuBeds: 35,
    availableIcuBeds: 6,
    totalGeneralBeds: 350,
    availableGeneralBeds: 45,
    specialties: ['Pediatrics', 'Obstetrics & Gynecology', 'Neonatal ICU', 'Pediatric Surgery'],
    emergencyPhone: '040-23394247',
    hasCathLab: false,
    hasBloodBank: true,
    hasCTScan: true,
    verified: true
  },
  {
    id: 'HOSP-5122',
    objectId: 5122,
    name: 'Sarojini Devi Eye Hospital',
    type: 'Teaching Hospital',
    district: 'Hyderabad',
    mandal: 'Asifnagar',
    lat: 17.39909836,
    lng: 78.44364815,
    address: 'Mehdipatnam, Hyderabad, Telangana 500028',
    traumaLevel: 'Specialized Ophthalmic Trauma',
    totalIcuBeds: 10,
    availableIcuBeds: 4,
    totalGeneralBeds: 150,
    availableGeneralBeds: 38,
    specialties: ['Ophthalmology', 'Ocular Trauma', 'Corneal Emergencies'],
    emergencyPhone: '040-23512334',
    hasCathLab: false,
    hasBloodBank: false,
    hasCTScan: false,
    verified: true
  },
  {
    id: 'HOSP-5126',
    objectId: 5126,
    name: 'Government General & Chest Hospital',
    type: 'Teaching Hospital',
    district: 'Hyderabad',
    mandal: 'Khairatabad',
    lat: 17.44392733,
    lng: 78.43593543,
    address: 'Erragadda, Sanath Nagar, Hyderabad, Telangana 500018',
    traumaLevel: 'Pulmonary Critical Care Center',
    totalIcuBeds: 25,
    availableIcuBeds: 5,
    totalGeneralBeds: 220,
    availableGeneralBeds: 30,
    specialties: ['Pulmonology', 'Respiratory ICU', 'Critical Thoracic Care'],
    emergencyPhone: '040-23814421',
    hasCathLab: false,
    hasBloodBank: true,
    hasCTScan: true,
    verified: true
  },
  {
    id: 'HOSP-5128',
    objectId: 5128,
    name: 'Modern Government Maternity Hospital',
    type: 'Teaching Hospital',
    district: 'Hyderabad',
    mandal: 'Nampally',
    lat: 17.36884015,
    lng: 78.46773135,
    address: 'Petlaburj, Hyderabad, Telangana 500002',
    traumaLevel: 'Comprehensive Obstetric Emergency',
    totalIcuBeds: 20,
    availableIcuBeds: 7,
    totalGeneralBeds: 200,
    availableGeneralBeds: 40,
    specialties: ['High Risk Obstetrics', 'Maternal Resuscitation', 'NICU'],
    emergencyPhone: '040-24528172',
    hasCathLab: false,
    hasBloodBank: true,
    hasCTScan: false,
    verified: true
  },
  {
    id: 'HOSP-5160',
    objectId: 5160,
    name: 'Government General Hospital, Malkajgiri',
    type: 'Teaching Hospital',
    district: 'Medchal_Malkajgiri',
    mandal: 'Malkajgiri',
    lat: 17.45746163,
    lng: 78.5353373,
    address: 'Malkajgiri, Secunderabad, Medchal-Malkajgiri 500047',
    traumaLevel: 'Level 2 Regional Trauma',
    totalIcuBeds: 18,
    availableIcuBeds: 4,
    totalGeneralBeds: 180,
    availableGeneralBeds: 28,
    specialties: ['General Medicine', 'Emergency Trauma', 'Orthopedics', 'Pediatrics'],
    emergencyPhone: '040-27241234',
    hasCathLab: true,
    hasBloodBank: true,
    hasCTScan: true,
    verified: true
  },
  {
    id: 'HOSP-5162',
    objectId: 5162,
    name: 'Government General Hospital, Hayathnagar',
    type: 'Teaching Hospital',
    district: 'Rangareddy',
    mandal: 'Hayathnagar',
    lat: 17.3289787,
    lng: 78.56391372,
    address: 'Sahebnagar Kalan, Hayathnagar, Rangareddy 501505',
    traumaLevel: 'Level 2 Regional Trauma',
    totalIcuBeds: 16,
    availableIcuBeds: 3,
    totalGeneralBeds: 160,
    availableGeneralBeds: 22,
    specialties: ['General Surgery', 'Internal Medicine', 'Emergency Casualty'],
    emergencyPhone: '040-24125678',
    hasCathLab: false,
    hasBloodBank: true,
    hasCTScan: true,
    verified: true
  },
  {
    id: 'HOSP-5142',
    objectId: 5142,
    name: 'Government General Hospital, Sangareddy',
    type: 'Teaching Hospital',
    district: 'Sangareddy',
    mandal: 'Sangareddy',
    lat: 17.62694485,
    lng: 78.08198871,
    address: 'Sangareddy District Headquarters, Telangana 502001',
    traumaLevel: 'Level 2 District Trauma Center',
    totalIcuBeds: 20,
    availableIcuBeds: 6,
    totalGeneralBeds: 250,
    availableGeneralBeds: 50,
    specialties: ['Emergency Trauma', 'Surgery', 'Pediatrics', 'Obstetrics'],
    emergencyPhone: '08455-276432',
    hasCathLab: false,
    hasBloodBank: true,
    hasCTScan: true,
    verified: true
  },
  {
    id: 'HOSP-5131',
    objectId: 5131,
    name: 'MGM Hospital Warangal',
    type: 'Teaching Hospital',
    district: 'Warangal',
    mandal: 'Warangal',
    lat: 17.99046645,
    lng: 79.59284319,
    address: 'Mattewada, Warangal Urban, Telangana 506007',
    traumaLevel: 'Level 1 Regional Apex Hospital',
    totalIcuBeds: 40,
    availableIcuBeds: 9,
    totalGeneralBeds: 450,
    availableGeneralBeds: 70,
    specialties: ['Multi-Trauma', 'Cardiology', 'Neurosurgery', 'Pediatrics'],
    emergencyPhone: '0870-2441234',
    hasCathLab: true,
    hasBloodBank: true,
    hasCTScan: true,
    verified: true
  },

  // Urban Primary Health Centres (UPHCs) & 24x7 Delivery Units in Metro
  {
    id: 'HOSP-4843',
    objectId: 4843,
    name: 'UPHC Bagh Amberpet',
    type: 'Urban Primary Health Centre (UPHC)',
    district: 'Hyderabad',
    mandal: 'Amberpet',
    lat: 17.396648,
    lng: 78.517794,
    address: 'Central Estate Colony, Near Ayyappa Temple, Bagh Amberpet, Hyderabad 500013',
    traumaLevel: 'Primary Stabilizing Unit',
    totalIcuBeds: 4,
    availableIcuBeds: 1,
    totalGeneralBeds: 24,
    availableGeneralBeds: 8,
    specialties: ['First Aid Resuscitation', 'Maternal Care', 'General OPD', 'Emergency Triage'],
    emergencyPhone: '040-27401122',
    hasCathLab: false,
    hasBloodBank: false,
    hasCTScan: false,
    verified: true
  },
  {
    id: 'HOSP-4844',
    objectId: 4844,
    name: 'UPHC Musheerabad',
    type: 'Urban Primary Health Centre (UPHC)',
    district: 'Hyderabad',
    mandal: 'Musheerabad',
    lat: 17.41883,
    lng: 78.499932,
    address: 'Musheerabad Main Road Beside Govt High School, Hyderabad 500020',
    traumaLevel: 'Primary Stabilizing Unit',
    totalIcuBeds: 4,
    availableIcuBeds: 2,
    totalGeneralBeds: 20,
    availableGeneralBeds: 6,
    specialties: ['Triage', 'Emergency Stabilization', 'Minor Trauma'],
    emergencyPhone: '040-27513344',
    hasCathLab: false,
    hasBloodBank: false,
    hasCTScan: false,
    verified: true
  },
  {
    id: 'HOSP-4850',
    objectId: 4850,
    name: 'UPHC Ameerpet',
    type: 'Urban Primary Health Centre (UPHC)',
    district: 'Hyderabad',
    mandal: 'Ammerpet',
    lat: 17.441642,
    lng: 78.447906,
    address: 'Opp S.R. Nagar Police Station, Ameerpet, Hyderabad 500018',
    traumaLevel: 'Primary Stabilizing Unit',
    totalIcuBeds: 4,
    availableIcuBeds: 2,
    totalGeneralBeds: 22,
    availableGeneralBeds: 9,
    specialties: ['Acute Medical Stabilization', 'ECG', 'IV Fluid Resuscitation'],
    emergencyPhone: '040-23734455',
    hasCathLab: false,
    hasBloodBank: false,
    hasCTScan: false,
    verified: true
  },
  {
    id: 'HOSP-4924',
    objectId: 4924,
    name: 'UPHC Banjara Hills',
    type: 'Urban Primary Health Centre (UPHC)',
    district: 'Hyderabad',
    mandal: 'Shaikpet',
    lat: 17.418831,
    lng: 78.441642,
    address: 'Behind E-Seva, Road No. 7, Banjara Hills, Hyderabad 500034',
    traumaLevel: 'Primary Stabilizing Unit',
    totalIcuBeds: 6,
    availableIcuBeds: 2,
    totalGeneralBeds: 25,
    availableGeneralBeds: 11,
    specialties: ['Acute Care', 'Oxygen Therapy', 'Cardiac First-line Triage'],
    emergencyPhone: '040-23351199',
    hasCathLab: false,
    hasBloodBank: false,
    hasCTScan: false,
    verified: true
  },
  {
    id: 'HOSP-4922',
    objectId: 4922,
    name: 'UPHC Borabanda (24x7 Emergency)',
    type: 'Urban Primary Health Centre (UPHC)',
    district: 'Hyderabad',
    mandal: 'Khairatabad',
    lat: 17.452496,
    lng: 78.407874,
    address: 'Site No. 3, Beside Peeli Darga, Borabanda, Hyderabad 500018',
    traumaLevel: '24x7 Emergency Stabilization',
    totalIcuBeds: 6,
    availableIcuBeds: 3,
    totalGeneralBeds: 30,
    availableGeneralBeds: 14,
    specialties: ['24x7 Casualty', 'Obstetric Emergencies', 'Basic Trauma Care'],
    emergencyPhone: '040-23842211',
    hasCathLab: false,
    hasBloodBank: false,
    hasCTScan: false,
    verified: true
  },
  {
    id: 'HOSP-4874',
    objectId: 4874,
    name: 'UPHC Golconda Emergency Center',
    type: 'Urban Primary Health Centre (UPHC)',
    district: 'Hyderabad',
    mandal: 'Golkonda',
    lat: 17.385108,
    lng: 78.402886,
    address: 'Opp Golconda Fort, Near Bus Stop, Hyderabad 500008',
    traumaLevel: 'Primary Stabilizing Unit',
    totalIcuBeds: 4,
    availableIcuBeds: 1,
    totalGeneralBeds: 20,
    availableGeneralBeds: 5,
    specialties: ['Trauma First Aid', 'IV Access', 'Oxygen Resuscitation'],
    emergencyPhone: '040-23567788',
    hasCathLab: false,
    hasBloodBank: false,
    hasCTScan: false,
    verified: true
  },
  {
    id: 'HOSP-5034',
    objectId: 5034,
    name: 'UPHC Hafeezpet (24x7 Critical Care)',
    type: 'Urban Primary Health Centre (UPHC)',
    district: 'Rangareddy',
    mandal: 'Serilingampalle',
    lat: 17.486728,
    lng: 78.356846,
    address: 'Gachibowli - Miyapur Rd, Vinayaka Nagar, Hafeezpet, Hyderabad 500049',
    traumaLevel: '24x7 Emergency Stabilization',
    totalIcuBeds: 8,
    availableIcuBeds: 3,
    totalGeneralBeds: 32,
    availableGeneralBeds: 12,
    specialties: ['24x7 Casualty', 'Miyapur-Hitec Corridor First Response', 'Trauma Resuscitation'],
    emergencyPhone: '040-23048899',
    hasCathLab: false,
    hasBloodBank: false,
    hasCTScan: false,
    verified: true
  },
  {
    id: 'HOSP-5038',
    objectId: 5038,
    name: 'PHC Serilingampally (24x7 Trauma Post)',
    type: 'Primary Health Centre (PHC)',
    district: 'Rangareddy',
    mandal: 'Serilingampalle',
    lat: 17.468371,
    lng: 78.329014,
    address: 'Lingampally Main Road, Hyderabad, Telangana 500046',
    traumaLevel: '24x7 Emergency Post',
    totalIcuBeds: 6,
    availableIcuBeds: 2,
    totalGeneralBeds: 28,
    availableGeneralBeds: 9,
    specialties: ['High Speed Highway Trauma', 'Industrial Casualty', 'Cardiac First-aid'],
    emergencyPhone: '040-23015522',
    hasCathLab: false,
    hasBloodBank: false,
    hasCTScan: false,
    verified: true
  },
  {
    id: 'HOSP-5033',
    objectId: 5033,
    name: 'UPHC Mailardevpally',
    type: 'Urban Primary Health Centre (UPHC)',
    district: 'Rangareddy',
    mandal: 'Rajendranagar',
    lat: 17.315615,
    lng: 78.446597,
    address: 'Near Mailardevpally Police Station, Nawab Saheb Kunta, Hyderabad 500052',
    traumaLevel: 'Primary Stabilizing Unit',
    totalIcuBeds: 4,
    availableIcuBeds: 1,
    totalGeneralBeds: 18,
    availableGeneralBeds: 6,
    specialties: ['Emergency First Response', 'Maternal Emergency', 'Dehydration & Shock'],
    emergencyPhone: '040-24431100',
    hasCathLab: false,
    hasBloodBank: false,
    hasCTScan: false,
    verified: true
  },
  {
    id: 'HOSP-5094',
    objectId: 5094,
    name: 'UPHC Begumbazar (24x7 Delivery & Trauma)',
    type: 'Urban Primary Health Centre (UPHC)',
    district: 'Hyderabad',
    mandal: 'Nampally',
    lat: 17.375521,
    lng: 78.471099,
    address: '15-8-326, Feelkhana, Begumbazar, Hyderabad 500053',
    traumaLevel: '24x7 Delivery & Acute Trauma',
    totalIcuBeds: 5,
    availableIcuBeds: 2,
    totalGeneralBeds: 26,
    availableGeneralBeds: 10,
    specialties: ['24x7 Delivery', 'Neonatal Care', 'Casualty Dressing & Stabilization'],
    emergencyPhone: '040-24738844',
    hasCathLab: false,
    hasBloodBank: false,
    hasCTScan: false,
    verified: true
  }
];

/**
 * Calculates straight-line geodesic distance using the Haversine formula
 * @returns Distance in kilometers
 */
export const calculateDistanceKm = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 999;
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(2));
};

/**
 * Estimate transit travel time in minutes based on distance and emergency priority
 */
export const estimateEtaMinutes = (distanceKm, priority = 'CRITICAL') => {
  // Average emergency vehicle speed in city conditions with sirens
  const speedKmh = priority === 'CRITICAL' ? 45 : 35;
  const transitTimeHours = distanceKm / speedKmh;
  const baseMinutes = Math.max(3, Math.round(transitTimeHours * 60 + 2)); // 2 min dispatch overhead
  return baseMinutes;
};

/**
 * AI Multi-Criteria Hospital Recommendation Engine (Deterministic Client-Side Fallback)
 * Transparently weights clinical specialty (35%), Haversine distance (30%),
 * verified beds (20%), and service readiness (15%).
 */
export const recommendHospitals = ({
  patientLat = 17.3850,
  patientLng = 78.4867,
  severity = 'CRITICAL',
  condition = 'CARDIAC',
  preferredType = null
}) => {
  const cond = (condition || 'GENERAL').toUpperCase();
  const specialtyMap = {
    CARDIAC: 'Cardiology',
    ACCIDENT: 'Emergency/Trauma',
    TRAUMA: 'Emergency/Trauma',
    STROKE: 'Neurology',
    MATERNITY: 'Obstetrics/Gynecology',
    GENERAL: 'General Medicine',
  };
  const matchedSpecialty = specialtyMap[cond] || 'General Medicine';

  return HEALTH_FACILITIES.map((facility) => {
    const distanceKm = calculateDistanceKm(patientLat, patientLng, facility.lat, facility.lng);
    const etaMins = estimateEtaMinutes(distanceKm, severity);

    // 1. Distance Score (Max 30)
    const distScore = Math.max(0, Math.round(30 * (1 - Math.min(distanceKm, 25) / 25)));

    // 2. Specialty Score (Max 35)
    let specialtyScore = 0;
    const matchReasons = [];

    if (cond === 'CARDIAC') {
      if (facility.hasCathLab) {
        specialtyScore += 20;
        matchReasons.push('Cardiology Cath Lab active for percutaneous intervention');
      }
      if (facility.type === 'Teaching Hospital') {
        specialtyScore += 15;
        matchReasons.push('Apex Cardiac Intensive Care Unit (CCU)');
      } else {
        specialtyScore += 8;
      }
    } else if (cond === 'ACCIDENT' || cond === 'TRAUMA') {
      if (facility.traumaLevel?.includes('Level 1') || facility.traumaLevel?.includes('Apex')) {
        specialtyScore += 20;
        matchReasons.push('Level 1 Apex Trauma Center with multi-disciplinary trauma team');
      } else {
        specialtyScore += 10;
      }
      if (facility.hasCTScan) {
        specialtyScore += 15;
        matchReasons.push('24/7 Polytrauma CT imaging active');
      }
    } else if (cond === 'STROKE') {
      if (facility.hasCTScan) {
        specialtyScore += 20;
        matchReasons.push('Immediate 24/7 CT scan ready for stroke thrombolysis');
      }
      if (facility.type === 'Teaching Hospital') {
        specialtyScore += 15;
        matchReasons.push('Apex Neurology & Neuro-ICU on standby');
      } else {
        specialtyScore += 8;
      }
    } else if (cond === 'MATERNITY') {
      if (facility.name.includes('Maternity') || facility.name.includes('Niloufer')) {
        specialtyScore += 35;
        matchReasons.push('Dedicated Maternal, Obstetric & Neonatal Intensive Care Hospital');
      } else if (facility.type === 'Teaching Hospital') {
        specialtyScore += 25;
        matchReasons.push('Teaching Hospital with full OBGYN department & NICU');
      } else {
        specialtyScore += 15;
      }
    } else {
      // GENERAL
      if (facility.type === 'Teaching Hospital') {
        specialtyScore += 25;
        matchReasons.push('Comprehensive Multispecialty General Medicine care');
      } else {
        specialtyScore += 18;
      }
      if (facility.emergencyPhone) {
        specialtyScore += 10;
        matchReasons.push('Verified 24/7 emergency casualty line');
      }
    }

    // 3. Bed Availability Score (Max 20)
    let bedScore = 0;
    if (facility.availableIcuBeds > 5) {
      bedScore += 15;
      matchReasons.push(`Verified ICU Capacity: ${facility.availableIcuBeds} open beds`);
    } else if (facility.availableIcuBeds > 0) {
      bedScore += 10;
      matchReasons.push(`Verified ICU Capacity: ${facility.availableIcuBeds} open beds`);
    } else {
      matchReasons.push('Notice: Zero ICU Beds Available');
    }

    if (facility.availableGeneralBeds > 10) {
      bedScore += 5;
    } else if (facility.availableGeneralBeds > 0) {
      bedScore += 3;
    }

    // 4. Service Readiness Score (Max 15)
    let readinessScore = 0;
    if (facility.type === 'Teaching Hospital') {
      readinessScore = 15;
      matchReasons.push('Apex 24/7 Emergency Tertiary Readiness');
    } else if (facility.type === 'UPHC') {
      readinessScore = 10;
      matchReasons.push('Urban 24/7 Primary Emergency Post');
    } else {
      readinessScore = 6;
    }

    const totalRaw = specialtyScore + distScore + bedScore + readinessScore;
    const finalScore = Math.max(15, Math.min(99, Math.round(totalRaw)));

    matchReasons.unshift(`Distance: ${distanceKm} km (Haversine transit ~${etaMins} mins)`);

    return {
      ...facility,
      distanceKm,
      etaMins,
      matchScore: finalScore,
      matchedSpecialty,
      matchReasons,
      specialties: facility.specialties || ['General Medicine', 'Emergency Care'],
      missingInformation: [
        'Live dynamic traffic sensor unconfigured (standard 40 km/h urban EMS transit model applied)',
      ],
      trafficStatus: 'Estimated EMS transit (no live traffic API configured)',
      scoreBreakdown: {
        specialty_score: specialtyScore,
        distance_score: distScore,
        bed_score: bedScore,
        readiness_score: readinessScore,
        total_score: finalScore,
      },
    };
  }).sort((a, b) => b.matchScore - a.matchScore);
};

/**
 * Find the closest available ambulance from AMB001 - AMB005
 */
export const findNearestAmbulance = (patientLat, patientLng, requiredType = 'ANY') => {
  const eligible = AMBULANCES_DEMO.filter((amb) => {
    if (amb.status !== 'AVAILABLE') return false;
    if (requiredType !== 'ANY' && amb.type !== requiredType) return false;
    return true;
  });

  if (eligible.length === 0) {
    // Return closest even if busy/en route for fallback demonstration
    return AMBULANCES_DEMO.map((amb) => ({
      ...amb,
      distanceKm: calculateDistanceKm(patientLat, patientLng, amb.lat, amb.lng),
      etaMins: estimateEtaMinutes(calculateDistanceKm(patientLat, patientLng, amb.lat, amb.lng))
    })).sort((a, b) => a.distanceKm - b.distanceKm)[0];
  }

  return eligible
    .map((amb) => ({
      ...amb,
      distanceKm: calculateDistanceKm(patientLat, patientLng, amb.lat, amb.lng),
      etaMins: estimateEtaMinutes(calculateDistanceKm(patientLat, patientLng, amb.lat, amb.lng))
    }))
    .sort((a, b) => a.distanceKm - b.distanceKm)[0];
};
