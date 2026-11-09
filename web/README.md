# PulseRoute AI - Emergency Response & Ambulance Routing System

A full-featured, professional web application built for college project demonstration, technical evaluation, and placement interviews.

---

## 🚀 Quick Start (Windows PowerShell)

```powershell
# 1. Navigate to the web project directory
cd "c:\Users\supri\OneDrive\Microsoft Copilot Chat Files\Desktop\Ambulance\web"

# 2. Install dependencies (First time only)
npm install

# 3. Start local development server
npm run dev
```

Open your browser to:  
👉 **`http://localhost:5173`**

---

## 🗺️ Complete Page & Route Directory

### 🌐 Public Pages
- **`/`**: Public Landing Page with interactive hero, KPIs, role cards, and FAQs.
- **`/login`**: Sign-in portal with 1-click verified role profiles and credentials form.
- **`/register`**: Registration with role selection and form validation.
- **`/forgot-password`**: Password recovery simulation interface.
- **`/ai-assistance`**: Dedicated AI Assistance Sandbox featuring interactive Triage, Ambulance Matcher, and Hospital Ranking.

### 🙋 Citizen / Emergency Reporter
- **`/reporter/dashboard`**: Active emergency summary, past incident count, and quick dispatch trigger.
- **`/reporter/emergency/new`**: Emergency intake form with **One-Tap SOS**, AVPU vitals input, AI priority preview, and map location picker.
- **`/reporter/tracking`**: Real-time ambulance tracking view with moving Leaflet GPS pin, route polyline, live arrival ETA countdown, and driver contact.
- **`/reporter/history`**: Incident archive with search, status filters, and detailed record modal.
- **`/reporter/profile`**: Editable citizen profile, ICE emergency contacts, and pre-hospital medical card.

### 🚑 Ambulance Driver Console
- **`/driver/dashboard`**: Driver cockpit with telematics gauges (speed, battery, medical O2) and active dispatch card.
- **`/driver/requests`**: Incoming emergency requests pool with Accept / Decline actions to prevent multi-driver collisions.
- **`/driver/active-trip`**: Full 6-phase trip workflow:  
  `Accepted` ➔ `On the Way` ➔ `Arrived at Pickup` ➔ `Patient Onboard` ➔ `Hospital Reached` ➔ `Completed`  
  with turn-by-turn route navigation and confirmation dialogs.
- **`/driver/history`**: Completed trip logbook and patient category archive.
- **`/driver/profile`**: Driver duty availability toggle (`On Duty`, `Busy`, `Off Duty`) and vehicle certifications.

### 🏥 Hospital Trauma Command
- **`/hospital/dashboard`**: Trauma command overview, occupancy rates, and facility readiness.
- **`/hospital/incoming`**: Live inbound ambulance stream with expected arrival ETAs, pre-arrival vitals, and arrival confirmation.
- **`/hospital/capacity`**: Interactive bed management hub for **ICU Beds** and **General Beds** with real-time `+` and `-` admission adjusters.
- **`/hospital/profile`**: Emergency department trauma level, contact hotlines, and specialized unit toggles.

### 🛡️ Control Room Dispatch Admin
- **`/admin/dashboard`**: Central command center with city-wide overview metrics and fleet status.
- **`/admin/emergencies`**: Full incident table with search by ID, filters for priority/status, and manual ambulance assignment override modal.
- **`/admin/ambulances`**: Ambulance fleet registry with Add Ambulance unit modal and maintenance toggle.
- **`/admin/drivers`**: Paramedic driver roster with contact placeholders and ratings.
- **`/admin/hospitals`**: Hospital network overview with bed capacities and certifications.
- **`/admin/monitoring`**: Full-screen unified city map showing all ambulances, emergencies, and hospitals with layer toggles.
- **`/admin/analytics`**: Advanced Recharts visualizations (hourly incident surge, priority breakdown donut, category bar charts).
- **`/admin/activity`**: System audit log recording all dispatch allocations, bed adjustments, and state transitions.

---

## ⚡ Shared Mock Workflow Simulation

1. **Reporter Creates Call:** Go to `/reporter/emergency/new`, fill in vitals, and submit.
2. **Admin Observes:** Switch to `/admin/emergencies` or `/admin/monitoring` to see the new incident pin appear on the city map.
3. **Driver Accepts:** Switch to `/driver/requests`, click **Accept Dispatch Run**, and step through the 6 stages in `/driver/active-trip`.
4. **Hospital Prepares:** Switch to `/hospital/incoming` to see the patient inbound with live ETA, and click **Confirm ER Admission** to allocate a bed.
5. **Audit Trail:** Check `/admin/activity` to see every action logged with exact timestamps.
