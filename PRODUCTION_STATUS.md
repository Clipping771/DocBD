# DocBD — Production Readiness & Architecture Report

> **Status:** Production Ready (v1.0.0)  
> **Server Active:** `http://localhost:5000`  
> **Live WebSocket Gateway:** `ws://localhost:5000/ws/queue`  
> **PWA & Mobile Ready:** Yes (Service Worker `sw.js` + `manifest.json`)

---

## 1. System Architecture Overview

DocBD is engineered specifically for Bangladesh's healthcare ecosystem with offline resilience, low-bandwidth optimization, and synchronized multi-role interfaces.

```mermaid
graph TD
    Client1["📱 Patient App (PWA)"] <-->|WebSocket & REST| Server["🚀 DocBD Fastify Server (Port 5000)"]
    Client2["📋 Compounder Tablet Register"] <-->|WebSocket & REST| Server
    Client3["👨‍⚕️ Doctor Portal (e-Prescription)"] <-->|WebSocket & REST| Server
    Client4["🏢 Hospital Central OPD Dashboard"] <-->|WebSocket & REST| Server
    Client5["📺 Waiting Room TV Display"] <-->|WebSocket (Live Push)| Server
    Server --> QueueEngine["⚙️ Real-time Queue Engine"]
    Server --> SMSEngine["📨 Bengali SMS Gateway Engine"]
    Server --> StaticPWA["📦 Static PWA File Server"]
```

---

## 2. Core Modules & Production Capabilities

### 📱 A. Patient Mobile App
- **Live Queue Ticket:** Synchronous status display (currently inside serial, user's token number, estimated time range).
- **Proximity Self Check-in ("আমি পৌঁছেছি"):** Patient arrives at clinic, taps check-in, notifying reception and compounder instantly with celebratory audio feedback.
- **Doctor Directory & Smart Search:** BMDC-verified doctor search with specialty filters, consultation fees, and real-time slot availability.
- **Doc-Buddy Mascot (Kids & Family Mode):** Dispels doctor anxiety with encouraging messages, interactive quotes, and bravery stickers.
- **bKash & Emergency Integration:** Seamless simulation for bKash fee collection and direct one-touch 999 / 16263 emergency dialing.

### 📋 B. Compounder Serial Register
- **Single Source of Truth:** Master patient ledger supporting Walk-in, Online, and Telephone bookings.
- **One-Tap Actions:**
  - `পরবর্তী রোগী ডাকুন` (Call Next Patient with Bengali Voice synthesis & SMS alert)
  - `ক্যাশ জমা / রসিদ` (Toggle Fee Payment)
  - `উপস্থিতি` (Toggle Check-in)
  - `হোল্ড` (Test report waiting) & `অনুপস্থিত` (No-Show)
  - `ডাক্তার বিলম্ব ব্রডকাস্ট` (Sends 30-min delay SMS to all waiting serials)

### 👨‍⚕️ C. Doctor Portal & e-Prescription
- **Live Active Patient Badge:** Automatically binds to the current patient in chamber.
- **Quick-Rx Builder:** Dosage, frequency, timing, and diagnostic test recommendations.
- **Auto-Recall SMS Engine:** Automatically schedules return visit reminders sent via SMS.
- **Print / PDF Export:** Formatted prescription pad for physical printing or mobile PDF download.

### 🏢 D. Hospital Central OPD Dashboard
- **Executive KPIs:** Total daily OPD patients, active chambers, average patient waiting time, and in-house diagnostic retention rate.
- **Footfall Analysis:** Hourly patient surge visualization.
- **Multi-Doctor Chamber Roster:** Live status across all departments (Cardiology, Gynae, Pediatrics, Orthopedics).

### 📺 E. Waiting Room TV Display
- **Large Format Display:** Current token number, patient name, live clock, and upcoming queue list.
- **Bengali Audio Chime & Announcement:** Audio notification upon each patient call.

---

## 3. Verified Backend API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Server healthcheck & connected client count |
| `GET` | `/api/hospitals/nearby` | Geospatial GPS hospital search with Dhaka traffic factors |
| `GET` | `/api/doctors` | BMDC verified doctor directory and search |
| `GET` | `/api/chambers/summary` | Real-time multi-chamber status for Hospital OPD |
| `GET` | `/api/queue/live/:chamberId` | Live queue state for specific chamber |
| `POST` | `/api/queue/call-next` | Advance queue to next waiting patient |
| `POST` | `/api/queue/done` | Complete visit for current patient |
| `POST` | `/api/queue/checkin` | Patient proximity check-in |
| `POST` | `/api/queue/delay-broadcast` | Doctor delay broadcast SMS trigger |
| `POST` | `/api/queue/payment-toggle` | Toggle cash payment status |
| `POST` | `/api/queue/checkin-toggle` | Toggle manual check-in status |
| `POST` | `/api/serials/book` | Book new online or walk-in serial |
| `POST` | `/api/prescriptions/issue` | Save digital Rx and send recall SMS |
| `GET` | `/api/prescriptions` | Retrieve patient health vault prescriptions |
| `GET` | `/api/sms/logs` | Inspect dispatched SMS notifications |
| `WS` | `/ws/queue` | Bi-directional real-time WebSocket stream |

---

## 4. How to Run Locally & In Production

### Run Directly with Node.js
```bash
# Navigate to server
cd server

# Start Production Server
npm start
```
The application is served at `http://localhost:5000` with the complete full-stack experience.

### Run with Docker Compose
```bash
# In project root
docker-compose up --build -d
```
