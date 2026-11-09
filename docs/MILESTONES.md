# Project Milestones & Execution Roadmap
## AI-Based Emergency Response & Ambulance Routing System

---

### Status Dashboard

| Milestone | Title | Focus Area | Status | Target Timeline |
| :---: | :--- | :--- | :---: | :---: |
| **M1** | Requirements & System Architecture | Repository, Architecture & Toolchain Setup | 🟢 **COMPLETED** | Day 1 |
| **M2** | Responsive Web Application | 4 Role Dashboards, Leaflet Map, Mock Interactive Engine | 🟢 **COMPLETED** | Day 2 - 3 |
| **M3** | Dataset-Driven Prototype Pages | Telangana Facilities & Demo Ambulances Pages | 🟢 **COMPLETED** | Day 4 |
| **M4** | FastAPI Backend & Database Core | REST APIs, Pydantic, Database ORM, Seed & Pytest | 🟢 **COMPLETED** | Day 5 - 6 |
| **M5** | Frontend–Backend Integration | Centralized API, Live Fleet, Facilities & Emergencies | 🟢 **COMPLETED** | Day 7 |
| **M6** | Real-Time Telemetry & Routing | WebSockets, Live GPS pulses, Dynamic ETA & Chokepoints | ⚪ Planned | Day 8 |
| **M7** | AI & Machine Learning Pipeline | Triage Classifier, Hospital Recommender & ETA Model | ⚪ Planned | Day 10 - 11 |
| **M8** | Testing, Audit & Final Presentation | Automated Tests, Presentation Deck & Viva Prep | ⚪ Planned | Day 12 |

---

### Milestone Breakdown & Exit Criteria

#### Milestone 1: Requirements, Architecture, Monorepo & Setup (COMPLETED)
- [x] Create project monorepo structure (`web/`, `mobile/`, `backend/`, `ml/`, `docs/`).
- [x] Configure `.gitignore` for multi-language stack (Node, Expo, Python, PyTorch/Sklearn, OS files).
- [x] Author comprehensive `PROJECT_OVERVIEW.md` detailing problem statement and workflow.
- [x] Author comprehensive `ARCHITECTURE.md` with Mermaid diagrams, ERD, and WebSocket protocols.
- [x] Author `MILESTONES.md` with strict delivery rules.
- [x] Author master `README.md` with project setup instructions and college presentation talking points.
- **Exit Criteria:** Clean repo structure with all foundational documentation and setup guides verified.

---

#### Milestone 2: Responsive Web Application (COMPLETED)
- [x] Initialize Vite + React project inside `web/` with Tailwind CSS, Lucide React, and Leaflet.
- [x] Build shared Design System: theme tokens, responsive layouts, alerts, modal dialogs, map containers.
- [x] Implement **Role 1: Emergency Reporter Dashboard** (Instant SOS button, symptom intake, emergency status tracker with simulated ETA).
- [x] Implement **Role 2: Ambulance Driver Dashboard** (Assigned task card, accept/reject prompt, turn-by-turn navigation view, patient status toggle).
- [x] Implement **Role 3: Hospital Staff Dashboard** (Incoming trauma cases, ETA countdown, ICU and General bed availability controller).
- [x] Implement **Role 4: Admin / Control Room Command Center** (City-wide fleet map, active incidents list, manual dispatch override, analytics summary).
- [x] Implement interactive **Mock State Controller** to demonstrate the complete emergency lifecycle without requiring the backend server.
- **Exit Criteria:** Fast web app runs locally on `localhost:5173` with zero build errors and functional role switching.

---

#### Milestone 3: Android Mobile Application (React Native & Expo)
- [ ] Initialize React Native + Expo project in `mobile/`.
- [ ] Configure React Navigation (Stack & Tab navigators).
- [ ] Build Mobile Reporter Screen (Quick SOS GPS trigger, simplified symptom checklist).
- [ ] Build Mobile Driver Screen (Dispatch notifications, route map, one-tap status transition).
- [ ] Mock native location updates and test navigation screens.
- **Exit Criteria:** App boots on Expo Go / Android emulator with responsive touch controls.

---

#### Milestone 4: FastAPI Backend & PostgreSQL Core
- [ ] Initialize FastAPI project in `backend/` with Pydantic v2 and SQLAlchemy 2.0.
- [ ] Implement database models: `User`, `Ambulance`, `Hospital`, `Emergency`, `TelemetryLog`.
- [ ] Implement JWT Authentication with role-based dependencies (`get_current_user`, `require_role`).
- [ ] Implement CRUD endpoints for Emergencies, Ambulances, and Hospitals.
- [ ] Setup seed script to populate realistic sample data (hospitals, drivers, ambulances, incidents).
- **Exit Criteria:** Swagger documentation (`/docs`) accessible with tested authentication and data persistence.

---

#### Milestone 5: Full-Stack Frontend–Backend Integration (COMPLETED)
- [x] Create centralized API client in `web/src/services/api.js` with base URL configuration (`http://localhost:8000`).
- [x] Integrate Ambulance Fleet page with `GET /api/v1/ambulances` and `PATCH /api/v1/ambulances/{id}/status`.
- [x] Integrate Hospital Recommendations page with `GET /api/v1/facilities/search` and `GET /api/v1/facilities`.
- [x] Integrate Emergency Intake form with `POST /api/v1/emergencies` and `POST /api/v1/assignments`.
- [x] Integrate Emergency History page with `GET /api/v1/emergencies` and CSV export.
- [x] Connect Dashboard with `GET /api/v1/health`, fleet counts, and facility metrics.
- [x] Add loading indicators, empty states, error alerts, and retry buttons across integrated pages.
- [x] Safely configure CORS origins on FastAPI backend for Vite development and preview ports.
- **Exit Criteria:** End-to-end data flow between React frontend and FastAPI backend verified.

---

#### Milestone 6: Live Telemetry, WebSockets & Routing
- [ ] Implement FastAPI WebSocket endpoint with client room management.
- [ ] Connect web Leaflet maps and mobile maps to WebSocket stream.
- [ ] Simulate moving ambulance coordinates along an OSRM / geodesic route with dynamic ETA updates.
- [ ] Deliver incoming patient notifications to the Hospital dashboard in real-time.
- **Exit Criteria:** Live marker movement on map without page reload; smooth ETA countdown.

---

#### Milestone 7: AI/ML Triage & Hospital Recommender
- [ ] Synthesize/prepare realistic emergency triage dataset in `ml/data/`.
- [ ] Train Multi-Class Triage Classifier (`RandomForestClassifier` or `HistGradientBoostingClassifier`).
- [ ] Generate classification metrics (Precision, Recall, F1, Confusion Matrix plot).
- [ ] Export model to `ml/models/triage_model.joblib`.
- [ ] Integrate inference into FastAPI `POST /api/v1/emergencies/triage` endpoint.
- [ ] Build Hospital Multi-criteria Recommendation ranking.
- **Exit Criteria:** Backend automatically tags new emergency with priority tier and explains top contributing features.

---

#### Milestone 8: Final Review, Tests, Documentation & Presentation
- [ ] Write backend unit tests (Pytest) and frontend component checks.
- [ ] Conduct security audit (CORS, token expiry, credential scanning).
- [ ] Compile College Presentation Slide Outline and Viva Q&A Cheat Sheet.
- [ ] Prepare 5-minute video demonstration script.
- **Exit Criteria:** Complete production-ready repository ready for college evaluation and portfolio showcase.
