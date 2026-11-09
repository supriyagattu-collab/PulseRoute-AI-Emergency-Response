# AI-Based Emergency Response & Ambulance Routing System 🚑🚨

> **B.Tech CSE (AI & ML) Capstone Project**  
> An intelligent, end-to-end emergency management ecosystem uniting **Citizens**, **Ambulance Drivers**, **Hospital Trauma Centers**, and **Control Room Dispatchers** via web and mobile interfaces powered by real-time spatial tracking and machine learning.

---

## 🌟 Key Features

- 🆘 **One-Tap Emergency Reporting:** Instant geolocation capture, symptom checklist, and trauma severity estimation.
- 🧠 **AI-Assisted Triage:** Multi-class classification of patient urgency (`P1 Critical`, `P2 Urgent`, `P3 Moderate`, `P4 Routine`) based on vitals and incident indicators.
- 📍 **Intelligent Dispatch & Matching:** Automated recommendation of nearest equipped ambulance (ALS - Advanced Life Support vs BLS - Basic Life Support).
- 🗺️ **Live Telemetry & Turn-by-Turn Navigation:** Real-time bi-directional WebSocket location streaming and traffic-aware ETA calculation.
- 🏥 **Hospital Capacity Coordination:** Live ER sync displaying incoming trauma cases and dynamically tracking ICU/general bed availability.
- 🛡️ **Role-Based Access Control (RBAC):** Tailored views and strict permission separation for all 4 primary user roles.

---

## 👥 Four Primary User Roles

| Role | Interface | Primary Responsibility |
| :--- | :--- | :--- |
| **Emergency Reporter** | Web & Android App | Quickly triggers SOS, supplies patient vitals/symptoms, and tracks assigned ambulance arrival in real time. |
| **Ambulance Driver** | Web & Android App | Receives dispatch notifications, reviews incident details, follows navigation, and updates transport stage. |
| **Hospital Staff** | Web Dashboard | Monitors incoming patient stream with live ETAs and manages available ICU and emergency beds. |
| **Admin / Control Room** | Web Command Center | Oversees city-wide fleet, reviews pending emergencies, overrides assignments, and monitors AI triage analytics. |

---

## 🏗️ Repository Architecture

This project is organized as a modular **monorepo**:

```text
Ambulance/
├── docs/                 # Architecture, engineering specs, and milestone tracker
│   ├── PROJECT_OVERVIEW.md
│   ├── ARCHITECTURE.md
│   └── MILESTONES.md
├── web/                  # Web Portal (React + Vite + Tailwind CSS + Leaflet)
├── mobile/               # Android Mobile Application (React Native + Expo)
├── backend/              # RESTful & WebSocket Backend (Python + FastAPI + SQLAlchemy)
├── ml/                   # Machine Learning Models, Training Notebooks & Pipelines
├── .gitignore
└── README.md             # Master project guide
```

For complete technical specifications, see [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

---

## 🚀 Milestone Progress

- [x] **Milestone 1:** Requirements, Architecture, Monorepo Setup & Documentation *(Completed)*
- [x] **Milestone 2:** Complete Website Frontend (4 Role Dashboards & Mock Simulation) *(Completed)*
- [x] **Milestone 3:** Dataset-Driven Prototype Pages (Telangana Hospitals & Demo Ambulances) *(Completed)*
- [x] **Milestone 4:** FastAPI Backend, SQLAlchemy Models, Database Seed & Core APIs *(Completed)*
- [x] **Milestone 5:** Frontend–Backend Integration (FastAPI REST APIs <-> React Frontend) *(Completed)*
- [ ] **Milestone 6:** Live Telemetry, WebSockets & Dynamic Routing
- [ ] **Milestone 7:** AI Triage & Hospital Recommender Models
- [ ] **Milestone 8:** Integration Testing, Security Audit & Viva Defense Pack

See [docs/MILESTONES.md](docs/MILESTONES.md) for detailed delivery criteria.

---

## 🏃 Running PulseRoute (Frontend & Backend in Separate Terminals)

To run the complete integrated full-stack application, open **two separate terminal windows**:

### 💻 Terminal 1: Start FastAPI Backend

```powershell
# 1. Navigate to backend directory
cd "c:\Users\supri\OneDrive\Microsoft Copilot Chat Files\Desktop\Ambulance\backend"

# 2. (Optional) Run tests to verify all 12 API endpoints
python -m pytest tests/ -v

# 3. Start the FastAPI development server
python -m uvicorn app.main:app --reload --port 8000
```

- 🌐 **Backend API Base:** [http://localhost:8000](http://localhost:8000)
- 📖 **Interactive Swagger UI:** [http://localhost:8000/docs](http://localhost:8000/docs)
- 🩺 **Health Diagnostics:** [http://localhost:8000/api/v1/health](http://localhost:8000/api/v1/health)

---

### 🌐 Terminal 2: Start React + Vite Frontend

```powershell
# 1. Navigate to web directory
cd "c:\Users\supri\OneDrive\Microsoft Copilot Chat Files\Desktop\Ambulance\web"

# 2. Start Vite development server
npm run dev
```

- 🚀 **Frontend Web Portal:** [http://localhost:5173](http://localhost:5173)
- 🚑 **Fleet View:** [http://localhost:5173/ambulance-fleet](http://localhost:5173/ambulance-fleet)
- 🏥 **Hospital Recommendations:** [http://localhost:5173/hospital-recommendations](http://localhost:5173/hospital-recommendations)
- 🆘 **Report Emergency:** [http://localhost:5173/report-emergency](http://localhost:5173/report-emergency)
- 📋 **Emergency History:** [http://localhost:5173/emergency-history](http://localhost:5173/emergency-history)

---

## 🔌 Milestone 5 Integration Architecture

The frontend communicates with the FastAPI backend using a centralized API service module (`web/src/services/api.js`):

| Frontend Page / Component | FastAPI Backend Endpoint | Data Flow |
| :--- | :--- | :--- |
| **Ambulance Fleet** (`/ambulance-fleet`) | `GET /api/v1/ambulances`<br>`PATCH /api/v1/ambulances/{id}/status` | Live 5-unit fleet list, status toggling, telemetry payload |
| **Hospital Recommendations** (`/hospital-recommendations`) | `GET /api/v1/facilities/search`<br>`GET /api/v1/facilities` | 248 Telangana healthcare facilities, Haversine distance, ICU bed capacity |
| **Emergency Intake** (`/report-emergency`) | `POST /api/v1/emergencies`<br>`POST /api/v1/assignments` | Ingests emergency report, triggers automated ambulance dispatch |
| **Emergency History** (`/emergency-history`) | `GET /api/v1/emergencies`<br>`GET /api/v1/assignments` | Incident audit trail, status lifecycle, CSV export |
| **Live Dashboard** (`/dashboard`) | `GET /api/v1/health`<br>`GET /api/v1/ambulances`<br>`GET /api/v1/facilities` | Real-time system health, fleet KPIs, interactive map markers |
| **Route & ETA Tracker** (`/route-eta`) | `GET /api/v1/ambulances`<br>`GET /api/v1/facilities` | Real-time vehicle navigation and facility handoff |

---

## 🎓 Academic Viva & Placement Interview Highlights

When explaining this project in college viva or job interviews, emphasize:
1. **Distributed System Design:** How WebSockets decouple GPS pulse ingestion from database writes to handle high-frequency updates without choking the database.
2. **Machine Learning in Healthcare:** Emphasize the AVPU (Alert, Voice, Pain, Unresponsive) scale and why multi-class classification with explainable feature importance was selected over black-box deep learning.
3. **Clean Code & Monorepo Pattern:** Explain the rationale behind sharing data schemas and contract types across web, mobile, and backend layers.

---

## ⚠️ Academic Disclaimer

This project is a **student engineering prototype** built for educational demonstration. It uses simulated telematics, mock emergency calls, and synthetic medical triage data. It is **not** certified for real-world emergency dispatch or clinical diagnostic purposes.
