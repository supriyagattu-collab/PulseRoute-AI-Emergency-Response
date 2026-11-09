# AI-Based Emergency Response & Ambulance Routing System
## Comprehensive Project Overview

---

### 1. Executive Summary & Problem Statement
During medical emergencies, minutes saved directly translate to lives saved ("the Golden Hour"). Conventional emergency response systems often face critical bottlenecks:
1. **Uncertain Priority Assessment:** Call operators must manually gauge urgency without automated symptom triage or severity scoring.
2. **Suboptimal Ambulance Dispatch:** Ambulances are often assigned simply by hospital affiliation or manual phone coordination rather than real-time proximity, traffic congestion, and equipment tier (Basic Life Support vs Advanced Life Support).
3. **Static Routing Delays:** Traditional navigation tools do not optimize for emergency corridors or dynamic congestion choke points.
4. **Hospital Unpreparedness:** Emergency departments frequently receive critical trauma cases without advance warning or real-time ETA, leading to delays in ICU/bed preparation and specialist mobilization.

**Our Solution:**  
An integrated AI-assisted emergency response platform featuring both a **responsive web portal** and a **cross-platform mobile app (React Native / Expo)**, powered by a **FastAPI backend**, **PostgreSQL database**, **WebSocket real-time telematics**, and **Scikit-Learn machine learning pipelines**.

> **Important Academic & Prototype Disclaimer:**  
> This system is designed as an educational engineering prototype for demonstrating full-stack engineering, real-time spatial systems, and applied machine learning. It simulates medical triage, GPS telemetry, and hospital allocation. It is **not** certified for live emergency dispatch or clinical diagnostic usage.

---

### 2. Core Workflow Lifecycle

```
[1. Incident Reported]
   ├── Patient / Bystander submits location, symptoms, trauma type & vitals via Web/Mobile
   ▼
[2. AI Priority & Triage Assessment]
   ├── ML Classifier evaluates severity (Critical [Code Red], Severe [Code Yellow], Stable [Code Green])
   ├── Recommends vehicle tier (ALS - Advanced Life Support vs. BLS - Basic Life Support)
   ▼
[3. Automated / Dispatcher Matching]
   ├── Distance Matrix + Proximity Scoring matches closest optimal ambulance
   ├── Dispatcher in Control Room verifies and confirms assignment
   ▼
[4. Dynamic Routing & Live Navigation]
   ├── Ambulance Driver receives turn-by-turn route, incident summary, and live status updates
   ├── Real-time telemetry streamed via WebSockets to Control Room and Reporter
   ▼
[5. Hospital Recommendation & Advance Notification]
   ├── System ranks nearest available hospitals based on ICU beds, trauma capability, and travel time
   ├── Destination hospital receives early telemetry alert with incoming patient status & live ETA
   ▼
[6. Patient Handover & Emergency Resolution]
   ├── Patient arrives at ER; ambulance status switches to Available/Decontaminating
   ├── Comprehensive emergency timeline is archived for audit & performance analytics
```

---

### 3. User Roles & Capabilities Matrix

| Feature / Capability | Emergency Reporter (Citizen) | Ambulance Driver | Hospital Staff (ER) | Admin / Control Room |
| :--- | :---: | :---: | :---: | :---: |
| **Instant SOS / One-Click Report** | ✅ Yes | ❌ | ❌ | ✅ Can report on behalf |
| **Symptom & Hazard Input** | ✅ Yes | ❌ | ❌ | ✅ |
| **Live Ambulance Tracking & ETA** | ✅ View Only | ✅ GPS Broadcast | ✅ View Incoming | ✅ Global Fleet View |
| **Accept / Reject Dispatch Task** | ❌ | ✅ Yes | ❌ | ✅ Override / Reassign |
| **Turn-by-turn Route View** | ❌ | ✅ Yes | ❌ | ✅ |
| **Patient Status Updates** | ❌ | ✅ (En-route, On-scene, Transporting) | ❌ | ✅ Full audit |
| **Manage Bed / ICU Capacity** | ❌ | ❌ | ✅ Yes | ✅ Global view |
| **Incoming Patient Alert Banner** | ❌ | ❌ | ✅ Real-time | ✅ Real-time |
| **Fleet & Driver Management** | ❌ | ❌ | ❌ | ✅ Yes |
| **ML Model Analytics & Retraining** | ❌ | ❌ | ❌ | ✅ Model Metrics View |

---

### 4. Applied AI & Machine Learning Highlights

1. **Emergency Severity Classification (NLP & Tabular Multi-class):**
   - **Inputs:** Age, conscious state, bleeding status, chest pain, breathing difficulty, accident mechanism, free-text emergency notes.
   - **Target:** Triage Priority (`CRITICAL_P1`, `URGENT_P2`, `MODERATE_P3`, `ROUTINE_P4`).
   - **Algorithm:** Random Forest / Gradient Boosting Classifier trained with scikit-learn, evaluated with F1-Score, Confusion Matrix, and ROC-AUC.

2. **Hospital Allocation & Recommendation Engine:**
   - **Heuristic + ML Scoring:** Evaluates composite score based on:
     $$\text{Score} = w_1 \cdot \text{Proximity (ETA)} + w_2 \cdot \text{Bed Availability} + w_3 \cdot \text{Facility Capability (Trauma/Cath Lab)}$$
   - Ensures critical patients are not diverted to under-equipped local clinics.

3. **Congestion-Adjusted ETA Estimation:**
   - Base geometric routing adjusted by historical time-of-day traffic coefficients to give accurate arrival windows for ER preparation.

---

### 5. Academic & Interview Talking Points

- **Full-Stack Monorepo Engineering:** Clean separation between web client, mobile client, RESTful/WebSocket backend, and ML modeling notebooks/scripts.
- **Micro-Interaction & UI Excellence:** Tailwind CSS + Lucide icons + Leaflet maps providing modern dark/light mode interfaces with role-based routing.
- **Asynchronous Telemetry:** Scalable state synchronization using FastAPI WebSockets rather than expensive polling.
- **Ethical AI & Explainability:** Feature importances (SHAP/permutation importance concepts) exposed to explain why a case was flagged as Code Red.
- **Production-Ready Coding Standards:** Strict Pydantic schemas, typed Python code, JWT bearer tokens with role claims, modular reusable UI components, and exhaustive documentation.
