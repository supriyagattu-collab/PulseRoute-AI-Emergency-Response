# System Architecture & Technical Specifications
## AI-Based Emergency Response & Ambulance Routing System

---

### 1. High-Level System Architecture

```mermaid
flowchart TB
    subgraph Clients["Frontend Clients"]
        WEB["Responsive Web Application<br/>(React + Vite + Tailwind CSS + Leaflet)"]
        MOBILE["Mobile Android Application<br/>(React Native + Expo + Maps)"]
    end

    subgraph Gateway["API Gateway / Transport Layer"]
        HTTP_API["RESTful API Endpoints<br/>(FastAPI / Pydantic)"]
        WS_GATEWAY["WebSocket Real-Time Gateway<br/>(Live GPS Telemetry & Status Feeds)"]
    end

    subgraph CoreServices["Backend Service Layer"]
        AUTH_SVC["Auth & RBAC Service<br/>(JWT + Passlib Argon2/Bcrypt)"]
        EMERGENCY_SVC["Emergency Incident Coordinator"]
        FLEET_SVC["Fleet & Telemetry Manager"]
        HOSPITAL_SVC["Hospital Bed & Capacity Sync"]
        ROUTING_SVC["OSRM / Geodesic Routing Service"]
    end

    subgraph AIService["AI & Machine Learning Engine"]
        TRIAGE_MODEL["Triage Severity Classifier<br/>(Scikit-Learn Random Forest)"]
        HOSPITAL_REC["Hospital Recommender Engine<br/>(Multi-criteria Utility Scoring)"]
        ETA_PREDICTOR["Congestion-adjusted ETA Model"]
    end

    subgraph DataStorage["Persistence & Cache"]
        DB[(PostgreSQL / Relational Store<br/>SQLAlchemy 2.0 Models)]
        MODELS_DIR[(Serialized Models<br/>.pkl / .joblib artifacts)]
    end

    WEB -->|HTTP Requests| HTTP_API
    WEB <-->|Bi-directional WS| WS_GATEWAY
    MOBILE -->|HTTP Requests| HTTP_API
    MOBILE <-->|Bi-directional WS| WS_GATEWAY

    HTTP_API --> AUTH_SVC
    HTTP_API --> EMERGENCY_SVC
    HTTP_API --> FLEET_SVC
    HTTP_API --> HOSPITAL_SVC

    WS_GATEWAY --> FLEET_SVC
    WS_GATEWAY --> EMERGENCY_SVC

    EMERGENCY_SVC --> TRIAGE_MODEL
    EMERGENCY_SVC --> ROUTING_SVC
    EMERGENCY_SVC --> HOSPITAL_REC

    AUTH_SVC --> DB
    EMERGENCY_SVC --> DB
    FLEET_SVC --> DB
    HOSPITAL_SVC --> DB
    TRIAGE_MODEL -.-> MODELS_DIR
```

---

### 2. Monorepo Structural Breakdown

```
Ambulance/
├── .gitignore                      # Monorepo-wide ignore definitions
├── README.md                       # Master presentation & quick start guide
├── docs/                           # Architecture, milestones, interview guides
│   ├── PROJECT_OVERVIEW.md         # Problem statement, roles & feature matrix
│   ├── ARCHITECTURE.md             # In-depth system design & data schemas
│   └── MILESTONES.md               # Strict execution roadmap & checklists
├── web/                            # React + Vite Web Portal
│   ├── src/
│   │   ├── components/             # Reusable UI (Navbar, Modal, LeafletMap, etc.)
│   │   ├── contexts/               # AuthContext, EmergencyContext, WebSocketContext
│   │   ├── pages/                  # Role-based pages:
│   │   │   ├── reporter/           # Patient / Citizen SOS Dashboard
│   │   │   ├── driver/             # Driver Navigation & Task Dashboard
│   │   │   ├── hospital/           # ER Staff Incoming Queue & Bed Manager
│   │   │   └── admin/              # Control Room Fleet Command Center
│   │   ├── services/               # API clients (Axios) & Mock Data Services
│   │   ├── types/                  # Type / JSDoc model contracts
│   │   ├── utils/                  # Coordinate math, date formatters, geo-helpers
│   │   ├── App.jsx                 # Dynamic routing & RBAC protection
│   │   └── main.jsx
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
├── mobile/                         # React Native + Expo Android App
│   ├── src/
│   │   ├── navigation/             # Role-based Tab & Stack Navigators
│   │   ├── screens/                # Mobile equivalents for Reporter & Driver
│   │   ├── components/             # Mobile Cards, Custom Map Pins, SOS Trigger
│   │   └── services/               # Mobile API and location tracker
│   ├── app.json
│   └── package.json
├── backend/                        # FastAPI Backend Application
│   ├── app/
│   │   ├── api/
│   │   │   ├── v1/                 # Versioned REST route controllers
│   │   │   │   ├── auth.py
│   │   │   │   ├── emergencies.py
│   │   │   │   ├── ambulances.py
│   │   │   │   ├── hospitals.py
│   │   │   │   └── ml_endpoints.py
│   │   │   └── websockets/         # WebSocket connection manager & broadcast
│   │   ├── core/                   # Security, JWT tokens, config & settings
│   │   ├── db/                     # SQLAlchemy engine, base & session lifecycle
│   │   ├── models/                 # SQLAlchemy ORM database models
│   │   ├── schemas/                # Pydantic input/output validation models
│   │   └── services/               # Dispatch algorithms, geo calculations
│   ├── requirements.txt
│   └── main.py
├── ml/                             # Machine Learning Research & Pipeline
│   ├── data/                       # Synthetic & benchmark emergency datasets
│   ├── notebooks/                  # EDA, model training & evaluation notebooks
│   ├── src/                        # Feature engineering, training & inference code
│   └── models/                     # Exported model weights (.joblib)
```

---

### 3. Database Entity-Relationship Model (ERD)

```mermaid
erDiagram
    USERS ||--o{ EMERGENCIES : reports
    USERS ||--o| AMBULANCES : drives
    USERS ||--o| HOSPITALS : staffs
    AMBULANCES ||--o{ EMERGENCIES : assigned_to
    HOSPITALS ||--o{ EMERGENCIES : receives
    EMERGENCIES ||--o{ TELEMETRY_LOGS : tracks
    EMERGENCIES ||--o| AI_TRIAGE_LOGS : evaluated_by

    USERS {
        uuid id PK
        string email UK
        string hashed_password
        string full_name
        string phone
        string role "REPORTER | DRIVER | HOSPITAL | ADMIN"
        boolean is_active
        datetime created_at
    }

    AMBULANCES {
        uuid id PK
        uuid driver_id FK
        string vehicle_number UK
        string vehicle_type "ALS | BLS"
        string status "AVAILABLE | DISPATCHED | ON_SCENE | TRANSPORTING | MAINTENANCE"
        float current_latitude
        float current_longitude
        datetime last_location_update
    }

    HOSPITALS {
        uuid id PK
        string name
        string address
        float latitude
        float longitude
        int total_icu_beds
        int available_icu_beds
        int total_general_beds
        int available_general_beds
        boolean has_cardiac_center
        boolean has_trauma_center
        string emergency_contact
    }

    EMERGENCIES {
        uuid id PK
        uuid reporter_id FK
        uuid assigned_ambulance_id FK
        uuid assigned_hospital_id FK
        string status "REPORTED | ASSIGNED | EN_ROUTE | ON_SCENE | TRANSPORTING | RESOLVED | CANCELLED"
        string emergency_type "TRAUMA | CARDIAC | RESPIRATORY | MATERNAL | ACCIDENT | OTHER"
        string severity_code "P1_CRITICAL | P2_URGENT | P3_MODERATE | P4_ROUTINE"
        float pickup_latitude
        float pickup_longitude
        string pickup_address
        text caller_description
        jsonb patient_vitals
        datetime reported_at
        datetime resolved_at
    }

    AI_TRIAGE_LOGS {
        uuid id PK
        uuid emergency_id FK
        float confidence_score
        string predicted_priority
        jsonb feature_importances
        string recommended_equipment
        datetime evaluated_at
    }

    TELEMETRY_LOGS {
        uuid id PK
        uuid emergency_id FK
        uuid ambulance_id FK
        float latitude
        float longitude
        float speed_kmh
        float heading_degrees
        int estimated_eta_seconds
        datetime timestamp
    }
```

---

### 4. Real-Time Telemetry & WebSocket Protocol

To achieve smooth tracking without heavy server load, WebSockets operate with a topic-based Connection Manager:

- **Channels / Rooms:**
  - `admin:fleet` — Receives all ambulance coordinate pulses and emergency state transitions.
  - `emergency:{emergency_id}` — Streamed to the patient reporter, the assigned driver, and the receiving hospital.
- **Message Payload Format:**
```json
{
  "event": "LOCATION_UPDATE",
  "emergency_id": "8b03e2c6-3bf4-49ab-bfad-833eec185a42",
  "ambulance_id": "amb-04",
  "coordinates": {
    "latitude": 12.9716,
    "longitude": 77.5946
  },
  "speed_kmh": 48.5,
  "heading": 135.0,
  "eta_minutes": 8.4,
  "status": "TRANSPORTING",
  "timestamp": "2026-10-13T17:40:00Z"
}
```

---

### 5. AI/ML Subsystem Specification

```mermaid
flowchart LR
    INPUT["Patient Vitals & Incident Metadata<br/>(Age, Symptoms, Pulse, Conscious, Trauma)"]
    PRE["Preprocessor<br/>(One-Hot Encoding, StandardScaler)"]
    MODEL["Random Forest Classifier<br/>(Trained on Emergency Triage Data)"]
    OUT1["Priority Tier<br/>(P1 Critical to P4 Routine)"]
    OUT2["Equipment Suggestion<br/>(ALS vs BLS)"]
    OUT3["Feature Importance Explanations"]

    INPUT --> PRE --> MODEL
    MODEL --> OUT1
    MODEL --> OUT2
    MODEL --> OUT3
```

- **Feature Space:**
  - `age`: integer (0 - 100)
  - `systolic_bp`: integer (60 - 220)
  - `heart_rate`: integer (30 - 200)
  - `oxygen_saturation`: integer (50 - 100)
  - `consciousness_level`: categorical (`ALERT`, `VERBAL`, `PAIN`, `UNRESPONSIVE` - AVPU scale)
  - `severe_bleeding`: boolean (0 / 1)
  - `chest_pain`: boolean (0 / 1)
  - `incident_category`: categorical (`FALL`, `TRAFFIC_COLLISION`, `CARDIAC`, `RESPIRATORY`, `BURN`, `ASSAULT`)

- **Dispatch Matching Formula:**
  $$\text{MatchScore}(A) = 0.6 \cdot \frac{1}{\text{Distance}(A, \text{Incident}) + 0.1} + 0.4 \cdot \mathbb{I}_{\text{Tier Match}}(A)$$

---

### 6. Authentication, Security & RBAC

1. **Password Hashing:** Passlib with Argon2 / Bcrypt with configurable cost factor.
2. **Access Tokens:** Short-lived JWTs (30 minutes expiry) containing:
   - `sub`: User UUID
   - `role`: Role string (`REPORTER`, `DRIVER`, `HOSPITAL`, `ADMIN`)
   - `exp`: Expiration timestamp
3. **Role Enforcement Decorators:** FastAPI dependencies `get_current_active_user` and `require_role(["ADMIN", "DRIVER"])` protect critical dispatch and bed update endpoints.
4. **CORS & Environment Isolation:** Secure origin whitelisting allowing only web client (`localhost:5173`) and mobile Expo runtime (`localhost:8081` / LAN IPs).
