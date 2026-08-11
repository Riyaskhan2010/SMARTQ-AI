# SmartQ AI

**Intelligent Queue & Service Management Platform**

> Predict • Plan • Navigate • Adapt • Serve

A complete full-stack hackathon prototype for AI-powered queue management, built for the Chennai demo vertical. Covers hospitals, government offices, colleges, and banks with real-time queue tracking, ML-based ETA prediction, and a dynamic admin dashboard.

---

## Table of Contents

- [Quick Start](#quick-start)
- [Demo Credentials](#demo-credentials)
- [Demo Scenario](#demo-scenario)
- [Project Structure](#project-structure)
- [Tech Stack](#tech-stack)
- [Environment Variables](#environment-variables)
- [Running Each Service](#running-each-service)
- [API Reference](#api-reference)
- [Socket.IO Events](#socketio-events)
- [Features Checklist](#features-checklist)
- [File Guide](#file-guide)

---

## Quick Start

### Prerequisites

| Tool | Version |
|------|---------|
| Node.js | 18+ |
| npm | 9+ |
| PostgreSQL | 14+ |
| Python | 3.10+ |
| pip | 23+ |

---

### 1. Clone and configure

```bash
cd smartq-ai
cp .env.example backend/.env
# Edit backend/.env — set DATABASE_URL to your PostgreSQL connection string
```

### 2. Backend setup

```bash
cd backend
npm install
npx prisma migrate dev --name init
node prisma/seed.js
npm run dev
```

Backend runs on **http://localhost:5000**

### 3. AI service setup

```bash
cd ai-service
pip install -r requirements.txt
python run.py
```

AI service runs on **http://localhost:8000**

> The AI service trains a small RandomForest model on first start (takes ~5 seconds), then caches it as `app/model.pkl`. The backend falls back to its built-in formula predictor if the AI service is unavailable.

### 4. Frontend setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on **http://localhost:5173**

---

## Demo Credentials

| Role | Email | Password | Description |
|------|-------|----------|-------------|
| **User** | `demo.user@smartq.ai` | `demo123` | Citizen with active token A105, visit history, upcoming appointment |
| **Admin** | `demo.admin@smartq.ai` | `demo123` | Full admin dashboard with live queue, AI recommendations |
| **Staff** | `demo.staff@smartq.ai` | `demo123` | Counter 1 staff at Government Hospital OPD |

---

## Demo Scenario

Run the full end-to-end demo in under 5 minutes:

1. **Open two browser windows** (or tabs)

2. **Window 1 — Login as User** (`demo.user@smartq.ai / demo123`)
   - Dashboard shows token **A105**, 7 people ahead, ETA 32 min, Crowd: HIGH

3. **Window 2 — Login as Admin** (`demo.admin@smartq.ai / demo123`)
   - Admin dashboard shows live queue, 15 waiting tokens, 3 active counters

4. **Admin: Load Demo Scenario**
   - Click "Load Demo Scenario" button — populates full hospital queue

5. **Admin: Open Counter 4**
   - Find Counter 4 (CLOSED), click the ▶ Play button
   - Watch: ETA drops from **32 → 21 min**
   - User window updates automatically (Socket.IO)

6. **Login as Staff** (`demo.staff@smartq.ai / demo123`) in a third tab
   - Staff panel shows Counter 1 with current serving token

7. **Staff: Click NEXT**
   - Calls next waiting token
   - Public display updates, user gets notified

8. **Staff: Click COMPLETE**
   - Token marked complete, queue recalculates
   - User's position moves up

9. **Admin: View AI Recommendation**
   - Orange card shows "Open Counter 4 — saves 11 minutes"
   - Click "Accept Recommendation"

10. **Admin: Run Simulator**
    - Go to `/admin/simulator`
    - Set +1 Counter, click Run Simulation
    - See current ETA vs predicted ETA side-by-side

11. **Public Display**
    - Open `/display/<departmentId>` in a browser
    - Shows large-screen NOW SERVING + NEXT UP board

---

## Project Structure

```
smartq-ai/
│
├── frontend/                   # React + Vite + Tailwind
│   ├── src/
│   │   ├── App.jsx             # Route definitions
│   │   ├── main.jsx            # App entry point
│   │   ├── index.css           # Tailwind + global styles
│   │   ├── context/
│   │   │   ├── AuthContext.jsx         # JWT auth state
│   │   │   ├── LanguageContext.jsx     # i18n language switching
│   │   │   └── NotificationContext.jsx # Real-time notifications
│   │   ├── services/
│   │   │   ├── api.js          # All axios API calls
│   │   │   └── socket.js       # Socket.IO client helpers
│   │   ├── i18n/
│   │   │   └── translations.js # 8-language dictionary
│   │   ├── components/
│   │   │   ├── layout/Navbar.jsx
│   │   │   └── ui/             # CrowdBadge, LoadingSpinner, EmptyState
│   │   ├── pages/
│   │   │   ├── Landing.jsx             # Hero + feature cards
│   │   │   ├── NotFound.jsx
│   │   │   ├── auth/
│   │   │   │   ├── Login.jsx           # Login + demo quick-fill
│   │   │   │   └── Register.jsx
│   │   │   ├── user/
│   │   │   │   ├── Dashboard.jsx       # Active token, history, appointments
│   │   │   │   ├── SelectSector.jsx    # Step 1: sector picker
│   │   │   │   ├── SelectOrg.jsx       # Step 2: organization picker
│   │   │   │   ├── SelectService.jsx   # Step 3: service picker with ETA
│   │   │   │   ├── BookToken.jsx       # Step 4: book with AI preview
│   │   │   │   ├── TokenTracking.jsx   # Live token + queue view
│   │   │   │   ├── MapView.jsx         # OpenStreetMap travel ETA
│   │   │   │   ├── History.jsx         # Visit history
│   │   │   │   └── Appointments.jsx    # Upcoming appointments
│   │   │   ├── admin/
│   │   │   │   ├── Dashboard.jsx       # Live queue + counter controls + AI rec
│   │   │   │   ├── Analytics.jsx       # Recharts analytics dashboard
│   │   │   │   └── Simulator.jsx       # What-if queue simulation
│   │   │   ├── staff/
│   │   │   │   └── StaffPanel.jsx      # Next/Complete/No-show panel
│   │   │   └── public/
│   │   │       └── PublicDisplay.jsx   # Large-screen display board
│   │   └── utils/helpers.js    # formatTime, haversine, crowdColor, etc.
│   ├── tailwind.config.js
│   └── vite.config.js
│
├── backend/                    # Node.js + Express + Socket.IO
│   ├── src/
│   │   ├── index.js            # Server entry, Socket.IO setup
│   │   ├── middleware/
│   │   │   └── auth.js         # JWT authenticate + requireRole
│   │   ├── services/
│   │   │   ├── socketService.js    # Socket.IO emit helpers
│   │   │   └── queueService.js     # ETA calc, crowd level, token gen
│   │   └── routes/
│   │       ├── auth.js             # /api/auth/*
│   │       ├── sectors.js          # /api/sectors
│   │       ├── organizations.js    # /api/organizations
│   │       ├── services.js         # /api/services
│   │       ├── tokens.js           # /api/tokens  (booking)
│   │       ├── queues.js           # /api/queues  (live state)
│   │       ├── counters.js         # /api/counters/:id/open|close|pause|resume
│   │       ├── staff.js            # /api/staff/next + tokens/complete/no-show
│   │       ├── admin.js            # /api/admin/dashboard + analytics
│   │       ├── notifications.js    # /api/notifications
│   │       ├── appointments.js     # /api/appointments
│   │       ├── history.js          # /api/history
│   │       ├── ai.js               # /api/ai/predict + /api/ai/recommend
│   │       ├── simulation.js       # /api/simulation
│   │       └── demo.js             # /api/demo/load-scenario
│   └── prisma/
│       ├── schema.prisma       # Database schema (all models)
│       └── seed.js             # Chennai demo data
│
├── ai-service/                 # Python + FastAPI
│   ├── run.py                  # uvicorn entry point
│   └── app/
│       ├── main.py             # FastAPI app + CORS
│       ├── models.py           # Pydantic request/response models
│       ├── predictor.py        # RandomForest + formula predictor
│       └── routers/
│           ├── health.py       # GET /health
│           └── predict.py      # POST /predict, POST /simulate, GET /crowd
│
├── prisma/
│   ├── schema.prisma           # Canonical schema (copied to backend/prisma)
│   └── seed.js                 # Seed script
│
├── .env.example                # Environment variable template
└── README.md                   # This file
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite 5, Tailwind CSS 3, React Router 6 |
| Icons | Lucide React |
| Charts | Recharts |
| Backend | Node.js, Express 4, Socket.IO 4 |
| Database | PostgreSQL + Prisma ORM |
| AI Service | Python, FastAPI, scikit-learn (RandomForest) |
| Real-time | Socket.IO (WebSocket) |
| Auth | JWT (jsonwebtoken + bcryptjs) |
| Maps | OpenStreetMap embed (no API key required) |
| Notifications | In-app via Socket.IO + react-hot-toast |
| i18n | Custom translation dictionary (8 languages) |

---

## Environment Variables

Copy `.env.example` to `backend/.env` and configure:

```env
# PostgreSQL connection
DATABASE_URL="postgresql://postgres:password@localhost:5432/smartq_ai"

# JWT
JWT_SECRET="your-super-secret-key"
JWT_EXPIRES_IN="7d"

# Server
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# AI service (optional — backend falls back to built-in predictor)
AI_SERVICE_URL=http://localhost:8000

# Maps (optional — OpenStreetMap works without any key)
MAPS_API_KEY=""

# Demo mode
DEMO_MODE=true
```

---

## Running Each Service

### Backend (Node.js)

```bash
cd backend

# Development (auto-reload)
npm run dev

# Production
npm start

# Database management
npm run db:migrate     # Run pending migrations
npm run db:seed        # Seed demo data
npm run db:reset       # Reset DB + re-seed
npm run db:studio      # Open Prisma Studio GUI
```

### AI Service (Python)

```bash
cd ai-service

# Create virtual environment (recommended)
python -m venv venv
venv\Scripts\activate          # Windows
source venv/bin/activate       # macOS/Linux

pip install -r requirements.txt
python run.py

# API docs available at http://localhost:8000/docs
```

### Frontend (React)

```bash
cd frontend

npm install
npm run dev      # http://localhost:5173
npm run build    # Production build → dist/
npm run preview  # Preview production build
```

---

## API Reference

### Authentication

```
POST /api/auth/register    { name, email, password, phone }
POST /api/auth/login       { email, password }
GET  /api/auth/me          → current user info
PATCH /api/auth/language   { language }
```

### Discovery

```
GET  /api/sectors                      → list all sectors
GET  /api/sectors/:slug                → sector + organizations
GET  /api/organizations                → list (optional ?sector=hospital)
GET  /api/organizations/:id            → org + departments + services + counters
GET  /api/organizations/:id/queue-status
GET  /api/services/:id
GET  /api/services/:id/queue-info      → live ETA preview for booking
```

### Queue & Tokens

```
POST /api/tokens                       → book token { serviceId, isFollowUp }
GET  /api/tokens                       → user's tokens (optional ?status=WAITING)
GET  /api/tokens/:id                   → token detail + waitingAhead + crowdLevel
POST /api/tokens/:id/cancel

GET  /api/queues/:id                   → queue state
GET  /api/queues/department/:deptId    → full queue by department
GET  /api/queues/public/:deptId        → public display data (no auth)
```

### Counter Management (Admin/Staff)

```
POST /api/counters/:id/open
POST /api/counters/:id/close
POST /api/counters/:id/pause
POST /api/counters/:id/resume
```

### Staff Operations

```
GET  /api/staff/counter                → current counter + serving + waiting
POST /api/staff/next                   → call next waiting token
POST /api/staff/tokens/:id/start
POST /api/staff/tokens/:id/complete
POST /api/staff/tokens/:id/no-show
```

### Admin

```
GET  /api/admin/dashboard              → summary + counters + queue + recommendation
GET  /api/admin/analytics?range=7      → daily, peakHours, services breakdown
POST /api/admin/recommendations/:id/accept
```

### AI & Simulation

```
POST /api/ai/predict                   { queueId } → ETA + crowdLevel + confidence
POST /api/ai/recommend                 { queueId } → action recommendation
POST /api/simulation                   { queueId, deltaCounters, deltaArrivalRate, deltaServiceTime }
```

### Notifications

```
GET  /api/notifications
PATCH /api/notifications/:id/read
PATCH /api/notifications/read-all
```

### History & Appointments

```
GET    /api/history
GET    /api/appointments
POST   /api/appointments               { serviceId, scheduledDate, scheduledTime }
DELETE /api/appointments/:id
```

### Demo

```
GET  /api/demo/credentials             → list all demo accounts
POST /api/demo/load-scenario           → reset to full demo state
```

---

## Socket.IO Events

### Client → Server (join rooms)

```js
socket.emit('join:queue',  { queueId })       // subscribe to a queue's updates
socket.emit('join:user',   { userId })        // receive personal notifications
socket.emit('join:admin',  { organizationId }) // admin org events
socket.emit('join:public', { departmentId })  // public display board
socket.emit('join:staff',  { counterId })     // counter-specific events
```

### Server → Client (listen for)

```js
socket.on('queueUpdated',       (data) => {})  // any queue state change
socket.on('etaUpdated',         (data) => {})  // ETA recalculated
socket.on('crowdUpdated',       (data) => {})  // crowd level changed
socket.on('tokenCalled',        (data) => {})  // token called to counter
socket.on('tokenCompleted',     (data) => {})  // service completed
socket.on('counterOpened',      (data) => {})  // counter opened
socket.on('counterPaused',      (data) => {})  // counter paused
socket.on('notificationCreated',(data) => {})  // new notification for user
socket.on('displayUpdated',     (data) => {})  // public display refresh
```

### Payload shape — `queueUpdated`

```json
{
  "action": "COUNTER_OPENED",
  "baseETA": 21,
  "crowdLevel": "HIGH",
  "waitingCount": 15,
  "activeCounters": 4,
  "counter": { "id": "...", "name": "Counter 4", "status": "OPEN" }
}
```

---

## AI Prediction Engine

Located in `ai-service/app/predictor.py`.

**Inputs:**
- `waiting_count` — tokens currently waiting
- `active_counters` — open service counters
- `avg_service_time` — minutes per person
- `hour_of_day` — peak-hour multiplier applied (9–11 AM: +25%, 2–4 PM: +20%)
- `day_of_week` — Monday/Friday: +10%
- `no_show_rate` — reduces effective queue size

**Model:** RandomForest (80 estimators, depth 8) trained on 3,000 synthetic samples. Blended 60% ML + 40% formula for robustness. Falls back to formula-only if scikit-learn is unavailable.

**Outputs:**
- `estimated_wait` (minutes)
- `crowd_level` (LOW / MEDIUM / HIGH / VERY_HIGH)
- `confidence` (0–1 score)
- `recommendation` (plain-English action string)

The Node.js backend calls this service via `POST /predict`. If the AI service is unreachable (timeout 3s), the backend uses its own `queueService.calculateETA()` and labels the result as formula-based.

---

## Multilingual Support

Translations live in `frontend/src/i18n/translations.js`.

Supported languages:

| Code | Language | Script |
|------|----------|--------|
| `en` | English | Latin |
| `ta` | Tamil | தமிழ் |
| `hi` | Hindi | हिन्दी |
| `ar` | Arabic | العربية (RTL) |
| `te` | Telugu | తెలుగు |
| `ml` | Malayalam | മലയാളം |
| `kn` | Kannada | ಕನ್ನಡ |
| `bn` | Bengali | বাংলা |

Switch language via the **globe icon** in the Navbar. The `LanguageContext` stores the preference in `localStorage` and applies `dir="rtl"` for Arabic.

To add a new language, add a new key to the `translations` object and add an entry to `LANGUAGES` in the same file.

---

## Maps

The app uses **OpenStreetMap** embed iframes — no API key required. The `MapView` page renders a live map and calculates travel distance/time using the Haversine formula (assuming ~25 km/h city speed). The "Get Directions" button opens OpenStreetMap routing in a new tab.

To use Google Maps or Mapbox, replace the `embedUrl` and `mapsUrl` construction in `frontend/src/pages/user/MapView.jsx`.

---

## Features Checklist

| Feature | Status |
|---------|--------|
| User registration/login | ✅ |
| Role-based login (User/Admin/Staff) | ✅ |
| Organization selection by sector | ✅ |
| Service selection with live ETA | ✅ |
| Token booking (new + follow-up) | ✅ |
| Unique token number generation | ✅ |
| Live queue tracking | ✅ |
| AI ETA prediction | ✅ |
| Crowd level (LOW/MEDIUM/HIGH/VERY_HIGH) | ✅ |
| Admin dashboard with metrics | ✅ |
| Staff counter panel | ✅ |
| Next / Start / Complete / No-show | ✅ |
| Real-time Socket.IO updates | ✅ |
| AI recommendation with accept button | ✅ |
| What-if queue simulator | ✅ |
| OpenStreetMap travel ETA | ✅ |
| In-app notifications + toasts | ✅ |
| 8-language UI | ✅ |
| Visit history | ✅ |
| Appointments | ✅ |
| Analytics with Recharts | ✅ |
| Public display board | ✅ |
| Responsive UI (mobile + desktop) | ✅ |
| Demo mode + load scenario button | ✅ |
| Seed data (Chennai organizations) | ✅ |
| Read-aloud accessibility button | ✅ |
| JWT auth + password hashing | ✅ |

---

## Database Schema Summary

```
User ──────┬── Token ──── Queue ──── Department ──── Organization ──── Sector
           ├── Appointment
           ├── VisitHistory
           ├── Notification
           └── Staff ──── Counter ──── CounterService ──── Service

Queue ──── Token
Queue ──── Prediction
Queue ──── Recommendation
Counter ── QueueEvent
```

All models are in `backend/prisma/schema.prisma`.

---

## Troubleshooting

**`prisma migrate dev` fails:**
Make sure PostgreSQL is running and `DATABASE_URL` in `backend/.env` is correct.

**AI service not starting:**
```bash
pip install --upgrade pip
pip install -r requirements.txt
```
If scikit-learn install fails on Windows, try: `pip install scikit-learn --only-binary=all`

**Frontend can't reach backend:**
Confirm backend is running on port 5000. The Vite proxy in `vite.config.js` forwards `/api` and `/socket.io` automatically in dev mode.

**Socket.IO not connecting:**
Ensure `FRONTEND_URL` in `backend/.env` matches your frontend origin (`http://localhost:5173`).

**Seed fails with "email already exists":**
Run `npm run db:reset` to wipe and re-seed.

---

## License

MIT — Hackathon prototype. Not for production use without security hardening.
