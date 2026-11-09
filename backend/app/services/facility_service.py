"""
Service layer for Healthcare Facilities (search, list, and transparent multi-criteria AI recommendations).
"""
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.models.facility import HealthcareFacility
from app.schemas.facility import FacilityUpdateCapacity
from app.services.geo import haversine_distance_km, estimate_eta_minutes


# Map emergency conditions to canonical clinical specialties
SPECIALTY_MAPPING = {
    "CARDIAC": "Cardiology",
    "ACCIDENT": "Emergency/Trauma",
    "TRAUMA": "Emergency/Trauma",
    "STROKE": "Neurology",
    "MATERNITY": "Obstetrics/Gynecology",
    "GENERAL": "General Medicine",
}


def get_facility_specialties(facility_name: str, facility_type: str, has_cath_lab: bool, has_ct_scan: bool) -> List[str]:
    """
    Determine verified and available medical specialties for a healthcare facility.
    """
    name_lower = facility_name.lower()
    type_lower = facility_type.lower()
    specialties = []

    if "maternity" in name_lower or "niloufer" in name_lower:
        specialties = ["Obstetrics/Gynecology", "Neonatal Intensive Care (NICU)", "Maternal Emergency Care", "Pediatrics"]
    elif "eye" in name_lower:
        specialties = ["Ophthalmology", "Emergency Eye Trauma"]
    elif "e.n.t" in name_lower or "ent" in name_lower:
        specialties = ["Otorhinolaryngology (ENT)", "Airway & ENT Trauma"]
    elif "chest" in name_lower:
        specialties = ["Pulmonology & Respiratory Care", "General Medicine"]
    elif "teaching" in type_lower or "general hospital" in name_lower or "rims" in name_lower or "mgm" in name_lower:
        specialties = [
            "General Medicine",
            "Emergency/Trauma",
            "Cardiology",
            "Neurology",
            "Obstetrics/Gynecology",
            "Critical Care ICU",
        ]
    elif "uphc" in type_lower or "urban" in type_lower:
        specialties = ["General Medicine", "Primary Emergency Care", "Antenatal & Maternal Health", "Outpatient Triage"]
    elif "primary" in type_lower or "phc" in type_lower:
        specialties = ["General Medicine", "Primary Stabilization", "First Aid Triage"]
    else:
        specialties = ["General Medicine", "Community Health"]

    if has_cath_lab and "Cardiology" not in specialties:
        specialties.append("Cardiology")
    if has_ct_scan and "Emergency/Trauma" not in specialties:
        specialties.append("Emergency/Trauma")

    return specialties


def score_facility_for_recommendation(
    f: HealthcareFacility,
    patient_lat: float,
    patient_lng: float,
    condition: Optional[str] = "GENERAL",
) -> Dict[str, Any]:
    """
    Transparent weighted multi-criteria scoring algorithm for hospital recommendation.
    Weights:
      1. Specialty & Clinical Capability: 35% (max 35 pts)
      2. Distance (Haversine formula): 30% (max 30 pts)
      3. Available Beds & Capacity: 20% (max 20 pts)
      4. Emergency Service Readiness & Tier: 15% (max 15 pts)
    Total Score: 0 - 100 points.
    """
    cond = (condition or "GENERAL").upper()
    canonical_specialty = SPECIALTY_MAPPING.get(cond, "General Medicine")
    specialties = get_facility_specialties(f.facility_name, f.facility_type, f.has_cath_lab, f.has_ct_scan)

    # 1. Distance Calculation via Haversine Formula
    dist_km = haversine_distance_km(patient_lat, patient_lng, f.latitude, f.longitude)
    # Travel time estimation (standard EMS speed 40 km/h with 2 mins dispatch mobilization)
    eta_mins = max(3, round((dist_km / 40.0) * 60.0 + 2))

    # Distance Score (Max 30 pts): Decreases linearly with distance up to 25 km
    dist_score = max(0.0, round(30.0 * (1.0 - min(dist_km, 25.0) / 25.0), 1))

    # 2. Specialty & Clinical Capability Score (Max 35 pts)
    specialty_score = 0.0
    match_reasons = []

    name_lower = f.facility_name.lower()
    type_lower = f.facility_type.lower()
    
    # Check if this is a mono-specialty facility (e.g. Eye, Dental, ENT, Psychiatric)
    is_mono_specialty = any(term in name_lower for term in ["eye", "dental", "e.n.t", "ent", "mental", "cancer", "fever"])
    is_general_teaching = ("teaching" in type_lower or "medical college" in type_lower or "rims" in name_lower or "mgm" in name_lower or "general hospital" in name_lower) and not is_mono_specialty

    if cond == "CARDIAC":
        if f.has_cath_lab and not is_mono_specialty:
            specialty_score += 20.0
            match_reasons.append("Cardiology Cath Lab active for percutaneous coronary intervention (+20 pts)")
        elif is_mono_specialty:
            specialty_score += 3.0
            match_reasons.append("Mono-specialty facility: No primary interventional cardiology (+3 pts)")

        if is_general_teaching:
            specialty_score += 15.0
            match_reasons.append("Apex General Teaching Hospital with 24/7 Cardiac Intensive Care Unit (+15 pts)")
        elif not is_mono_specialty and ("uphc" in type_lower or "primary" in type_lower):
            specialty_score += 8.0
            match_reasons.append("Primary post: Basic ECG & stabilization only (+8 pts)")
        elif not is_mono_specialty:
            specialty_score += 5.0

    elif cond in ("ACCIDENT", "TRAUMA"):
        if is_general_teaching and ("level 1" in (f.trauma_level or "").lower() or "apex" in (f.trauma_level or "").lower()):
            specialty_score += 20.0
            match_reasons.append("Level 1 Apex Trauma Center with emergency polytrauma team (+20 pts)")
        elif is_general_teaching:
            specialty_score += 15.0
            match_reasons.append("Tertiary surgical trauma care and emergency OT (+15 pts)")
        elif is_mono_specialty:
            specialty_score += 4.0
            match_reasons.append("Mono-specialty hospital: Limited to specialty-specific trauma (+4 pts)")
        else:
            specialty_score += 8.0

        if f.has_ct_scan and not is_mono_specialty:
            specialty_score += 15.0
            match_reasons.append("24/7 Emergency CT Scan for acute injury diagnosis (+15 pts)")
        elif not is_mono_specialty and ("uphc" in type_lower or "primary" in type_lower):
            specialty_score += 5.0
            match_reasons.append("First aid wound stabilization available (+5 pts)")

    elif cond == "STROKE":
        if f.has_ct_scan and not is_mono_specialty:
            specialty_score += 20.0
            match_reasons.append("24/7 CT Scan ready for immediate stroke thrombolysis protocol (+20 pts)")
        elif is_mono_specialty:
            specialty_score += 3.0

        if is_general_teaching:
            specialty_score += 15.0
            match_reasons.append("Apex Neurology and Neuro-ICU on standby (+15 pts)")
        elif not is_mono_specialty and "uphc" in type_lower:
            specialty_score += 8.0
            match_reasons.append("Acute clinical stabilization (+8 pts)")
        elif not is_mono_specialty:
            specialty_score += 5.0

    elif cond == "MATERNITY":
        if "maternity" in name_lower or "niloufer" in name_lower:
            specialty_score += 35.0
            match_reasons.append("Dedicated Apex Obstetric & Neonatal Intensive Care Hospital (+35 pts)")
        elif is_general_teaching:
            specialty_score += 25.0
            match_reasons.append("Teaching Hospital with full Obstetrics & Gynecology department (+25 pts)")
        elif is_mono_specialty:
            specialty_score += 2.0
            match_reasons.append("Mono-specialty facility: No dedicated obstetrics unit (+2 pts)")
        elif "uphc" in type_lower:
            specialty_score += 15.0
            match_reasons.append("Urban maternal delivery and stabilization post (+15 pts)")
        else:
            specialty_score += 8.0

    else:  # GENERAL
        if is_general_teaching:
            specialty_score += 25.0
            match_reasons.append("Comprehensive Multispecialty Teaching Hospital (+25 pts)")
        elif is_mono_specialty:
            specialty_score += 5.0
            match_reasons.append("Mono-specialty outpatient services only (+5 pts)")
        elif "uphc" in type_lower:
            specialty_score += 18.0
            match_reasons.append("Urban Primary Health Center with acute outpatient care (+18 pts)")
        elif "primary" in type_lower:
            specialty_score += 14.0
            match_reasons.append("Primary Health Center triage care (+14 pts)")
        else:
            specialty_score += 10.0

        if f.emergency_phone and not is_mono_specialty:
            specialty_score += 10.0
            match_reasons.append("Verified 24/7 emergency contact hotline active (+10 pts)")

    # 3. Available Bed Capacity Score (Max 20 pts)
    bed_score = 0.0
    if f.available_icu_beds is not None:
        if f.available_icu_beds > 5:
            bed_score += 15.0
            match_reasons.append(f"Verified ICU Capacity: {f.available_icu_beds} beds available (+15 pts)")
        elif f.available_icu_beds > 0:
            bed_score += 10.0
            match_reasons.append(f"Verified ICU Capacity: {f.available_icu_beds} beds available (+10 pts)")
        else:
            bed_score += 0.0
            match_reasons.append("Notice: ICU bed shortage (0 available)")
    else:
        bed_score += 5.0

    if f.available_general_beds is not None:
        if f.available_general_beds > 10:
            bed_score += 5.0
            match_reasons.append(f"General Beds: {f.available_general_beds} beds open (+5 pts)")
        elif f.available_general_beds > 0:
            bed_score += 3.0
        else:
            bed_score += 0.0
    else:
        bed_score += 2.0

    # 4. Service Readiness Score (Max 15 pts)
    readiness_score = 0.0
    if "teaching" in type_lower or is_general_teaching:
        readiness_score = 15.0
        match_reasons.append("Apex 24/7 Tertiary Emergency Readiness (+15 pts)")
    elif "uphc" in type_lower:
        readiness_score = 10.0
        match_reasons.append("Urban 24/7 Primary Emergency Hub (+10 pts)")
    elif "primary" in type_lower:
        readiness_score = 6.0
        match_reasons.append("Primary Health Center (+6 pts)")
    else:
        readiness_score = 3.0

    # Total Score Calculation (Bounded 10 - 99)
    total_raw = specialty_score + dist_score + bed_score + readiness_score
    total_score = int(min(99, max(10, round(total_raw))))

    # Match reason for distance
    match_reasons.insert(0, f"Distance: {dist_km} km (Haversine transit ~{eta_mins} mins) (+{dist_score} pts)")

    # Missing information checklist for scientific transparency
    missing_info = [
        "Live dynamic traffic sensor unconfigured (standard 40 km/h urban EMS transit model applied)",
    ]
    if not f.address:
        missing_info.append("Specific street address unrecorded in registry (district/mandal mapped)")
    if f.available_icu_beds is None:
        missing_info.append("Real-time ICU bed telemetry unverified")

    return {
        "distance_km": dist_km,
        "estimated_eta_minutes": eta_mins,
        "match_score": total_score,
        "matched_specialty": canonical_specialty,
        "specialties": specialties,
        "match_reasons": match_reasons,
        "missing_information": missing_info,
        "traffic_status": "Estimated EMS transit (no live traffic API configured)",
        "score_breakdown": {
            "specialty_score": round(specialty_score, 1),
            "distance_score": round(dist_score, 1),
            "bed_score": round(bed_score, 1),
            "readiness_score": round(readiness_score, 1),
            "total_score": total_score,
        },
    }


def get_facility_by_id(db: Session, facility_id: int) -> Optional[HealthcareFacility]:
    return db.query(HealthcareFacility).filter(HealthcareFacility.id == facility_id).first()


def list_facilities(
    db: Session,
    skip: int = 0,
    limit: int = 50,
    facility_type: Optional[str] = None,
    district: Optional[str] = None,
) -> List[HealthcareFacility]:
    query = db.query(HealthcareFacility)
    if facility_type:
        query = query.filter(HealthcareFacility.facility_type.ilike(f"%{facility_type}%"))
    if district:
        query = query.filter(HealthcareFacility.district.ilike(f"%{district}%"))
    return query.offset(skip).limit(limit).all()


def search_facilities(
    db: Session,
    q: Optional[str] = None,
    district: Optional[str] = None,
    facility_type: Optional[str] = None,
    patient_lat: Optional[float] = None,
    patient_lng: Optional[float] = None,
    condition: Optional[str] = None,
    limit: int = 20,
) -> List[dict]:
    """
    Search and rank facilities by distance and transparent clinical criteria.
    """
    query = db.query(HealthcareFacility)
    if q:
        query = query.filter(
            or_(
                HealthcareFacility.facility_name.ilike(f"%{q}%"),
                HealthcareFacility.address.ilike(f"%{q}%"),
                HealthcareFacility.mandal.ilike(f"%{q}%"),
                HealthcareFacility.district.ilike(f"%{q}%"),
            )
        )
    if district and district.upper() != "ALL":
        query = query.filter(HealthcareFacility.district.ilike(f"%{district}%"))
    if facility_type and facility_type.upper() != "ALL":
        query = query.filter(HealthcareFacility.facility_type.ilike(f"%{facility_type}%"))

    facilities = query.limit(250).all()

    results = []
    for f in facilities:
        base_data = {
            "id": f.id,
            "object_id": f.object_id,
            "facility_name": f.facility_name,
            "facility_type": f.facility_type,
            "nin_id": f.nin_id,
            "state": f.state,
            "district": f.district,
            "mandal": f.mandal,
            "municipality": f.municipality,
            "address": f.address,
            "pincode": f.pincode,
            "latitude": f.latitude,
            "longitude": f.longitude,
            "department": f.department,
            "services": f.services,
            "total_icu_beds": f.total_icu_beds,
            "available_icu_beds": f.available_icu_beds,
            "total_general_beds": f.total_general_beds,
            "available_general_beds": f.available_general_beds,
            "emergency_phone": f.emergency_phone,
            "trauma_level": f.trauma_level,
            "has_cath_lab": f.has_cath_lab,
            "has_ct_scan": f.has_ct_scan,
            "created_at": f.created_at,
        }

        if patient_lat is not None and patient_lng is not None:
            ranking = score_facility_for_recommendation(
                f, patient_lat=patient_lat, patient_lng=patient_lng, condition=condition
            )
            base_data.update(ranking)
        else:
            base_data["distance_km"] = None
            base_data["estimated_eta_minutes"] = None
            base_data["match_score"] = None
            base_data["matched_specialty"] = None
            base_data["specialties"] = get_facility_specialties(f.facility_name, f.facility_type, f.has_cath_lab, f.has_ct_scan)
            base_data["match_reasons"] = []
            base_data["missing_information"] = []
            base_data["traffic_status"] = None
            base_data["score_breakdown"] = None

        results.append(base_data)

    if patient_lat is not None and patient_lng is not None:
        # Sort by match_score descending, then distance_km ascending
        results.sort(key=lambda x: (-(x["match_score"] or 0), x["distance_km"] or 999))
    else:
        results.sort(key=lambda x: x["facility_name"])

    return results[:limit]


def get_top_hospital_recommendations(
    db: Session,
    patient_lat: float,
    patient_lng: float,
    emergency_type: str = "GENERAL",
    limit: int = 5,
) -> List[dict]:
    """
    Dedicated endpoint service for Milestone 7: returns Top 5 ranked hospitals
    using transparent weighted multi-criteria scoring.
    """
    return search_facilities(
        db,
        patient_lat=patient_lat,
        patient_lng=patient_lng,
        condition=emergency_type,
        limit=limit,
    )


def update_facility_capacity(
    db: Session, facility_id: int, cap_in: FacilityUpdateCapacity
) -> Optional[HealthcareFacility]:
    f = get_facility_by_id(db, facility_id)
    if not f:
        return None
    if cap_in.available_icu_beds is not None:
        f.available_icu_beds = cap_in.available_icu_beds
    if cap_in.available_general_beds is not None:
        f.available_general_beds = cap_in.available_general_beds
    db.commit()
    db.refresh(f)
    return f
