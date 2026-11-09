"""
Repeatable CSV Importer for Telangana Healthcare Facilities.
Reads data/pulseroute_health_facilities.csv and populates healthcare_facilities table.
Validates coordinates and handles missing/empty values gracefully.
"""
import os
import csv
import sys
from pathlib import Path

# Add backend directory to path if running script standalone
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from app.db.session import engine, SessionLocal
from app.db.base import Base
from app.models.facility import HealthcareFacility
from app.services.geo import is_valid_telangana_coordinate


def resolve_facilities_csv_path() -> Path:
    """
    Search for pulseroute_health_facilities.csv in expected locations.
    """
    candidates = [
        backend_dir.parent / "data" / "pulseroute_health_facilities.csv",
        backend_dir / "data" / "pulseroute_health_facilities.csv",
        Path("data/pulseroute_health_facilities.csv"),
    ]
    for p in candidates:
        if p.exists():
            return p.resolve()
    raise FileNotFoundError("Could not find data/pulseroute_health_facilities.csv in expected locations.")


def clean_int(val) -> int:
    try:
        return int(float(val)) if val and str(val).strip() else 0
    except (ValueError, TypeError):
        return 0


def clean_float(val) -> float:
    try:
        return float(val) if val and str(val).strip() else 0.0
    except (ValueError, TypeError):
        return 0.0


def import_healthcare_facilities():
    # Ensure tables exist
    Base.metadata.create_all(bind=engine)

    csv_path = resolve_facilities_csv_path()
    print(f"[*] Reading facilities dataset from: {csv_path}")

    db = SessionLocal()
    imported_count = 0
    updated_count = 0
    skipped_count = 0

    try:
        with open(csv_path, mode="r", encoding="utf-8-sig") as f:
            reader = csv.DictReader(f)
            
            for row in reader:
                obj_id_raw = row.get("OBJECTID", "").strip()
                name = row.get("Facility_Name", "").strip()
                fac_type = row.get("Facility_Type", "").strip() or "Healthcare Facility"

                if not name:
                    skipped_count += 1
                    continue

                lat = clean_float(row.get("Latitude"))
                lng = clean_float(row.get("Longitude"))

                # Validate coordinates
                if lat == 0.0 or lng == 0.0 or not (-90 <= lat <= 90 and -180 <= lng <= 180):
                    skipped_count += 1
                    continue

                obj_id = clean_int(obj_id_raw) if obj_id_raw else None

                # Determine simulated beds and trauma capability based on facility type
                if "Teaching Hospital" in fac_type:
                    total_icu = 50
                    avail_icu = 10
                    total_gen = 500
                    avail_gen = 75
                    trauma_level = "Level 1 Apex Trauma"
                    has_cath = True
                    has_ct = True
                elif "UPHC" in fac_type or "Urban Primary" in fac_type:
                    total_icu = 6
                    avail_icu = 2
                    total_gen = 30
                    avail_gen = 10
                    trauma_level = "Urban 24x7 Emergency Post"
                    has_cath = False
                    has_ct = False
                elif "Primary Health" in fac_type or "PHC" in fac_type:
                    total_icu = 4
                    avail_icu = 1
                    total_gen = 20
                    avail_gen = 6
                    trauma_level = "Primary Trauma Post"
                    has_cath = False
                    has_ct = False
                else:
                    total_icu = 2
                    avail_icu = 1
                    total_gen = 12
                    avail_gen = 4
                    trauma_level = "Community Health Post"
                    has_cath = False
                    has_ct = False

                # Check if already exists by object_id or name
                existing = None
                if obj_id:
                    existing = db.query(HealthcareFacility).filter(HealthcareFacility.object_id == obj_id).first()
                if not existing:
                    existing = db.query(HealthcareFacility).filter(HealthcareFacility.facility_name == name).first()

                if existing:
                    # Update coordinates and details
                    existing.facility_type = fac_type
                    existing.latitude = lat
                    existing.longitude = lng
                    existing.address = row.get("Address", "").strip() or existing.address
                    existing.district = row.get("District", "").strip() or row.get("District_1", "").strip() or existing.district
                    existing.mandal = row.get("Mandal", "").strip() or existing.mandal
                    existing.pincode = str(clean_int(row.get("Pincode"))) if row.get("Pincode") else existing.pincode
                    existing.services = row.get("Services", "").strip() or existing.services
                    existing.department = row.get("Department", "").strip() or existing.department
                    updated_count += 1
                else:
                    new_fac = HealthcareFacility(
                        object_id=obj_id,
                        facility_name=name,
                        facility_type=fac_type,
                        nin_id=str(clean_int(row.get("NIN_ID"))) if row.get("NIN_ID") else None,
                        state=row.get("State", "").strip() or "Telangana",
                        district=row.get("District", "").strip() or row.get("District_1", "").strip() or "Hyderabad",
                        mandal=row.get("Mandal", "").strip() or "Central",
                        municipality=row.get("Muncipality", "").strip() or row.get("ULB", "").strip(),
                        address=row.get("Address", "").strip(),
                        pincode=str(clean_int(row.get("Pincode"))) if row.get("Pincode") else None,
                        latitude=lat,
                        longitude=lng,
                        department=row.get("Department", "").strip(),
                        services=row.get("Services", "").strip(),
                        total_icu_beds=total_icu,
                        available_icu_beds=avail_icu,
                        total_general_beds=total_gen,
                        available_general_beds=avail_gen,
                        emergency_phone="040-24600121",
                        trauma_level=trauma_level,
                        has_cath_lab=has_cath,
                        has_ct_scan=has_ct,
                    )
                    db.add(new_fac)
                    imported_count += 1

            db.commit()

        total_in_db = db.query(HealthcareFacility).count()
        print(f"[✓] Healthcare Facilities Import Completed!")
        print(f"    - New facilities inserted: {imported_count}")
        print(f"    - Existing facilities updated: {updated_count}")
        print(f"    - Records skipped (invalid coords/empty): {skipped_count}")
        print(f"    - Total active facilities in database: {total_in_db}")

    except Exception as exc:
        db.rollback()
        print(f"[!] Error during facility import: {exc}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    import_healthcare_facilities()
