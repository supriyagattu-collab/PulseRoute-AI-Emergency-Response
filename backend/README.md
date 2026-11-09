# PulseRoute Backend API (Milestone 4) 🚑⚡

FastAPI backend service with PostgreSQL & SQLAlchemy ORM for the **PulseRoute AI Emergency Response & Routing System**.

> **⚠️ Academic Prototype & Safety Notice**:  
> PulseRoute is an academic/capstone project prototype designed for engineering evaluation and placement demonstration. It is **NOT** connected to live emergency services (108/112). All telematics, patient records, and dispatch events are simulated for testing.

---

## 🛠️ Tech Stack
- **Framework:** FastAPI
- **Server:** Uvicorn
- **ORM & DB:** SQLAlchemy 2.0 with PostgreSQL (psycopg2) + SQLite fallback
- **Schema & Validation:** Pydantic v2 & Pydantic-Settings
- **Database Migrations:** Alembic
- **Testing:** Pytest & HTTPX TestClient

---

## 📂 Backend Architecture

```text
backend/
├── app/
│   ├── config.py              # Pydantic Settings & environment config (.env)
│   ├── main.py                # FastAPI entrypoint, CORS & OpenAPI documentation
│   ├── db/
│   │   ├── base.py            # SQLAlchemy DeclarativeBase
│   │   └── session.py         # Engine, SessionLocal, get_db dependency (Postgres + SQLite fallback)
│   ├── models/                # SQLAlchemy ORM models
│   │   ├── emergency.py       # EmergencyReport table
│   │   ├── ambulance.py       # Ambulance table (AMB001-AMB005)
│   │   ├── facility.py        # HealthcareFacility table (Telangana dataset)
│   │   └── assignment.py      # AmbulanceAssignment table
│   ├── schemas/               # Pydantic request/response validation schemas
│   │   ├── emergency.py
│   │   ├── ambulance.py
│   │   ├── facility.py
│   │   └── assignment.py
│   ├── routers/               # REST API endpoints
│   │   ├── health.py          # GET /api/v1/health
│   │   ├── emergencies.py     # POST, GET, PATCH /api/v1/emergencies
│   │   ├── ambulances.py      # GET, PATCH /api/v1/ambulances
│   │   ├── facilities.py      # GET /api/v1/facilities, /search
│   │   └── assignments.py     # POST, GET /api/v1/assignments
│   └── services/              # Business logic & Haversine geo calculations
│       ├── geo.py
│       ├── emergency_service.py
│       ├── ambulance_service.py
│       ├── facility_service.py
│       └── assignment_service.py
├── scripts/
│   ├── import_facilities.py   # Repeatable importer for data/pulseroute_health_facilities.csv
│   └── seed_ambulances.py     # Seed script for data/pulseroute_ambulances_demo.csv
├── tests/                     # Isolated Pytest test suite with in-memory SQLite
│   ├── conftest.py
│   ├── test_health.py
│   ├── test_emergencies.py
│   └── test_ambulances_and_facilities.py
├── alembic/                   # Alembic database migrations
├── alembic.ini
├── requirements.txt
├── .env.example
└── .env
```

---

## 🚀 Quick Start Guide

### 1. Create and Activate a Python Virtual Environment

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate on Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# Or on Windows (Command Prompt):
.\venv\Scripts\activate.bat
# Or on macOS/Linux:
source venv/bin/activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure the Database (`.env`)

Copy `.env.example` to `.env` if not already present:

```bash
cp .env.example .env
```

#### Option A: Local PostgreSQL (Recommended)
Ensure PostgreSQL is running and update `DATABASE_URL` in `.env`:
```ini
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/pulseroute
```
*(Make sure to create the `pulseroute` database in PostgreSQL: `CREATE DATABASE pulseroute;`)*

#### Option B: Zero-Config SQLite Fallback
If PostgreSQL is not running or installed on your machine yet, the backend automatically detects this and falls back to a local SQLite database (`sqlite:///./pulseroute.db`). You can also explicitly set:
```ini
DATABASE_URL=sqlite:///./pulseroute.db
```

---

### 4. Import Healthcare Facilities & Seed Demo Ambulances

Run the repeatable ingestion scripts to populate the database with the verified datasets:

```bash
# 1. Ingest all 250+ healthcare facilities from data/pulseroute_health_facilities.csv
python scripts/import_facilities.py

# 2. Seed the 5 demo ambulances AMB001-AMB005 from data/pulseroute_ambulances_demo.csv
python scripts/seed_ambulances.py
```

---

### 5. Start the FastAPI Server

```bash
uvicorn app.main:app --reload --port 8000
```

The API will now be live:
- 🌐 **Interactive Swagger UI:** [http://localhost:8000/docs](http://localhost:8000/docs)
- 📖 **ReDoc Documentation:** [http://localhost:8000/redoc](http://localhost:8000/redoc)
- ❤️ **Health Diagnostic:** [http://localhost:8000/api/v1/health](http://localhost:8000/api/v1/health)

---

### 6. Run the Automated Test Suite

Run the isolated Pytest suite (uses an in-memory database with zero external dependencies):

```bash
pytest -v
```

---

## 📡 REST API Endpoints Overview

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| **GET** | `/api/v1/health` | Health check, DB connection dialect, simulation disclaimer |
| **POST** | `/api/v1/emergencies` | Create new emergency report with patient vitals & GPS |
| **GET** | `/api/v1/emergencies` | List paginated emergency reports (filter by severity/status) |
| **GET** | `/api/v1/emergencies/{id}` | Retrieve specific emergency report details |
| **PATCH** | `/api/v1/emergencies/{id}/status` | Update incident status (`EN_ROUTE`, `RESOLVED`, etc.) |
| **GET** | `/api/v1/ambulances` | List all fleet ambulances (`AMB001`–`AMB005`) |
| **GET** | `/api/v1/ambulances/nearest` | Find nearest available ambulance by coordinates |
| **GET** | `/api/v1/ambulances/{id}` | Retrieve single ambulance unit details |
| **PATCH** | `/api/v1/ambulances/{id}/status` | Update ambulance status (`AVAILABLE`, `BUSY`, etc.) |
| **PATCH** | `/api/v1/ambulances/{id}/location`| Update ambulance live GPS coordinates & speed |
| **GET** | `/api/v1/facilities` | List healthcare facilities across Telangana |
| **GET** | `/api/v1/facilities/search` | Search facilities with Haversine distance & AI match score |
| **GET** | `/api/v1/facilities/{id}` | Get healthcare facility by ID |
| **PATCH** | `/api/v1/facilities/{id}/capacity` | Update ICU/general bed capacity |
| **POST** | `/api/v1/assignments` | Dispatch ambulance to emergency report |
| **GET** | `/api/v1/assignments` | List all ambulance assignments |
