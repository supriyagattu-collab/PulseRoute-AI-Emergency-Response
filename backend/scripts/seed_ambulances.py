"""
Seed Script for Demo Ambulances AMB001 - AMB005.
Reads data/pulseroute_ambulances_demo.csv and seeds the ambulances table.
Ensures idempotency (updates existing units, inserts missing ones).
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
from app.models.ambulance import Ambulance


def resolve_ambulances_csv_path() -> Path:
    candidates = [
        backend_dir.parent / "data" / "pulseroute_ambulances_demo.csv",
        backend_dir / "data" / "pulseroute_ambulances_demo.csv",
        Path("data/pulseroute_ambulances_demo.csv"),
    ]
    for p in candidates:
        if p.exists():
            return p.resolve()
    raise FileNotFoundError("Could not find data/pulseroute_ambulances_demo.csv in expected locations.")


def seed_demo_ambulances():
    # Ensure tables exist
    Base.metadata.create_all(bind=engine)

    csv_path = resolve_ambulances_csv_path()
    print(f"[*] Reading ambulances dataset from: {csv_path}")

    db = SessionLocal()
    inserted_count = 0
    updated_count = 0

    equipment_profiles = {
        "ALS": "Transport Ventilator, Defibrillator, Multipara Monitor, Suction Unit, Oxygen 15L, Advanced Airway Kit",
        "BLS": "AED, Multi-para Monitor, Oxygen Tank, Splints, Cervical Collar, First Aid Trauma Bag",
    }

    try:
        with open(csv_path, mode="r", encoding="utf-8-sig") as f:
            reader = csv.DictReader(f)
            for row in reader:
                amb_id = row.get("Ambulance_ID", "").strip()
                if not amb_id:
                    continue

                vehicle_number = row.get("Vehicle_Number", "").strip() or f"TS-09-EA-{amb_id}"
                amb_type = row.get("Type", "BLS").strip().upper()
                amb_status = row.get("Status", "AVAILABLE").strip().upper()
                lat = float(row.get("Latitude", 17.3850))
                lng = float(row.get("Longitude", 78.4867))
                driver_name = row.get("Driver_Name", "Paramedic Driver").strip()
                driver_contact = row.get("Driver_Contact", "+91 98480 00000").strip()
                base_station = row.get("Base_Station", "Central Station").strip()
                fuel_oxygen = row.get("Fuel_Oxygen_Level", "90%").strip()

                equipment = equipment_profiles.get(amb_type, equipment_profiles["BLS"])

                existing = db.query(Ambulance).filter(Ambulance.ambulance_id == amb_id).first()
                if existing:
                    existing.vehicle_number = vehicle_number
                    existing.type = amb_type
                    existing.status = amb_status
                    existing.latitude = lat
                    existing.longitude = lng
                    existing.driver_name = driver_name
                    existing.driver_contact = driver_contact
                    existing.base_station = base_station
                    existing.fuel_oxygen_level = fuel_oxygen
                    existing.equipment = equipment
                    updated_count += 1
                else:
                    new_amb = Ambulance(
                        ambulance_id=amb_id,
                        vehicle_number=vehicle_number,
                        type=amb_type,
                        status=amb_status,
                        latitude=lat,
                        longitude=lng,
                        driver_name=driver_name,
                        driver_contact=driver_contact,
                        base_station=base_station,
                        fuel_oxygen_level=fuel_oxygen,
                        equipment=equipment,
                        speed_kmh=0.0,
                        is_active=True,
                    )
                    db.add(new_amb)
                    inserted_count += 1

            db.commit()

        total = db.query(Ambulance).count()
        print(f"[✓] Demo Ambulances Seed Completed!")
        print(f"    - New units inserted: {inserted_count}")
        print(f"    - Existing units updated: {updated_count}")
        print(f"    - Total fleet units in database: {total}")

    except Exception as exc:
        db.rollback()
        print(f"[!] Error seeding ambulances: {exc}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_demo_ambulances()
