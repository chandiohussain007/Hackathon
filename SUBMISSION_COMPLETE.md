# 🏆 KhidmatAI — Complete Hackathon Submission
## AI Service Orchestrator for Pakistan's Informal Economy

> **Team:** Chandio Hussain  
> **Event:** KhidmatAI Hackathon  
> **Repository:** https://github.com/chandiohussain007/Hackathon  
> **APK:** `KhidmatAI_CustomerApp.apk` (6.8 MB — installable Android app)

---

## 🎯 What Is KhidmatAI?

**KhidmatAI** (خدمت AI) is a production-grade, multi-component AI platform that connects Pakistani users with verified local service providers (Plumbers, AC Repair, Deep Cleaning, Electricians, Electricians) using:

- **Multilingual AI Input** — handles Urdu script, Roman Urdu slang, English, and code-switching (e.g., *"bhai AC bilkul kaam nahi kar raha, kal subah G-13 mein technician chahiye"*)
- **8-Agent Orchestration Pipeline** — specialized agents for Intent Parsing, Provider Discovery, Ranking, Scheduling, Pricing, Booking, Notifications, and Dispute Resolution
- **Multi-Model Routing** — intelligently routes tasks to the right free LLM (Llama 3.3 70B, Qwen 235B, Hermes 405B, Liquid LFM, Gemini Flash)
- **Native Android App** — React + Capacitor mobile app with full offline fallback
- **Real-time Observability Dashboard** — live agent trace viewer for judges and engineers
- **Admin Control Panel** — Kanban-style booking management with technician assignment

---

## 📦 System Architecture

```
KhidmatAI/
├── server/               ← Express.js API + Gemini + Firestore (Node.js)
├── backend/              ← FastAPI + 8-Agent ADK Orchestrator (Python)
│   └── src/
│       ├── agents/       ← 8 Specialized AI Agents
│       ├── llm/          ← ModelRouter (OpenRouter + Gemini fallback)
│       ├── orchestration/← KhidmatSupervisor (plan-execute-verify)
│       ├── engines/      ← Matching, Scheduling, Pricing engines
│       ├── models/       ← Pydantic schemas
│       ├── traces/       ← TraceLogger + SessionStore
│       └── api/          ← FastAPI routes
├── frontend/             ← React + Vite + Capacitor (Mobile App)
├── admin/                ← React Admin Kanban Dashboard
└── apps/
    ├── customer-app/     ← Full premium customer SPA
    └── orchestration-dashboard/ ← Live agent trace observer
```

---

## 🌐 Live Deployments (Cloud)

| Component | URL |
|-----------|-----|
| Express Backend API | https://khidmat-backend-1083893144498.us-central1.run.app |
| Admin Dashboard | https://khidmat-admin-1083893144498.us-central1.run.app |

---

## 💻 Local Development URLs

| Component | URL | Description |
|-----------|-----|-------------|
| Express Backend | http://localhost:8080 | API + Gemini + Mock DB |
| Customer Web App | http://localhost:5174 | Mobile-first customer SPA |
| Admin Kanban Panel | http://localhost:5173 | Admin booking management |
| FastAPI Orchestrator | http://localhost:8000 | Python multi-agent backend |
| Observability Dashboard | http://localhost:5175 | Live agent trace viewer |

---

## 🤖 8-Agent Orchestration Pipeline

Every user request flows through a deterministic **plan-execute-verify** pipeline:

| Step | Agent | Model Routed To | Function |
|------|-------|-----------------|----------|
| 1 | **IntentParsingAgent** | `meta-llama/llama-3.3-70b-instruct` | Parses noisy Urdu/Roman-Urdu/English into structured JSON with confidence score |
| 2 | **ProviderDiscoveryAgent** | Deterministic SQL | Geo-filters providers from SQLite DB by service type + city |
| 3 | **RankingAgent** | `qwen/qwen3-235b-a22b` | 10-factor weighted scoring: distance, rating, urgency, risk, specialization |
| 4 | **SchedulingAgent** | `liquid/lfm2.5-1.2b-thinking` | CSP slot finder with 30-min travel buffers + waitlists |
| 5 | **PricingAgent** | Deterministic | Base + complexity + demand surge, capped at 50% anti-gouging |
| 6 | **BookingAgent** | State Machine | DRAFT → CONFIRMED lifecycle manager |
| 7 | **NotificationAgent** | Deterministic | WhatsApp/SMS simulation events |
| 8 | **DisputeAgent** | `nousresearch/hermes-3-405b-instruct` | Classify complaint → arbitrate → propose resolution |

---

## 📋 Challenge Requirements — Coverage

| Requirement | Status | Implementation |
|-------------|--------|----------------|
| Multilingual noisy input handling | ✅ | IntentParsingAgent via Llama-3.3-70b with confidence scoring + fallback |
| 6+ factor provider matching | ✅ | 10-factor weighted algorithm in `ranking_agent.py` + `matching.py` |
| Job complexity classification | ✅ | basic/intermediate/complex in PricingAgent |
| Scheduling intelligence | ✅ | 30-min buffers, anti-overlap, waitlists in SchedulingAgent |
| Dynamic pricing | ✅ | Demand + urgency + distance + complexity + anti-gouging cap |
| Booking simulation | ✅ | Full state machine REQUESTED → MATCHED → CONFIRMED → COMPLETED |
| Service quality loop | ✅ | Tracking page with 5-stage stepper + demo simulator |
| Dispute workflow | ✅ | DisputeAgent with Hermes-3-405b arbitration + refund cards |
| Provider-side optimization | ✅ | Technician assignment, workload balancing in Admin Panel |
| Robustness and fallback | ✅ | Rule-based fallback at every LLM call, memory DB fallback |

---

# 📅 Phase-by-Phase Development Log

---

## Phase 0 — Architecture & Planning

**Documents:**
- [`implementation_plan.md`](implementation_plan.md) — 10-phase detailed build plan with data models, agent specs, API routes, Mermaid diagrams
- [`architecture_plan.md`](architecture_plan.md) — Two-app system design with model routing table
- [`models.md`](models.md) — Free LLM models via OpenRouter + routing strategy

**Key Decisions Made:**
- React + Vite (not Flutter) for mobile-first web app
- FastAPI (Python) for agentic orchestrator backend
- Express.js (Node.js) for simpler customer-facing API with Gemini + Firestore
- Capacitor.js to wrap React app into native Android APK
- OpenRouter for multi-model free LLM access
- SQLite locally, Firestore in production

---

## Phase 1 — Backend Infrastructure & LLM Integration

**Completed:** 2026-05-18  
**Document:** [`phase_1_complete.md`](phase_1_complete.md)

### What Was Built:

**ModelRouter (`backend/src/llm/router.py`)**
- Provider-agnostic LLM abstraction layer
- Routes to optimal free model based on task type
- 3-tier fallback: OpenRouter primary → OpenRouter alternatives → Gemini
- Enforces structured JSON output via schema-constrained prompting

**Model Routing Table Implemented:**
| Task | Model |
|------|-------|
| Intent Parsing (Urdu/multilingual) | `meta-llama/llama-3.3-70b-instruct` |
| Provider Ranking | `qwen/qwen3-235b-a22b` |
| Dispute Classification | `nousresearch/hermes-3-405b-instruct` |
| Scheduling Logic | `liquid/lfm2.5-1.2b-thinking` |
| Fast Utility | `liquid/lfm2.5-1.2b-instruct` |
| General Fallback | `google/gemma-3-27b-it` |

**IntentParsingAgent Upgraded:**
- llama-3.3-70b for best multilingual performance
- Rich few-shot examples for Urdu script, Roman Urdu slang, code-switching
- Rule-based deterministic fallback preserved

**DisputeAgent Upgraded:**
- hermes-3-405b for frontier-scale reasoning
- Structured `reasoning` field in output (explains decision in user's language)

**SessionStore Added:**
- In-memory session persistence (200 session cap)
- `list_recent()` + `get()` methods for dashboard polling

**Sessions API Endpoints:**
- `GET /api/v1/sessions` — list recent sessions
- `GET /api/v1/sessions/{id}` — full trace for dashboard

**Files Created/Modified:**
```
backend/src/llm/__init__.py          ← NEW
backend/src/llm/router.py            ← NEW: ModelRouter
backend/src/agents/base_agent.py     ← UPDATED
backend/src/agents/intent_agent.py   ← UPDATED: llama-3.3-70b
backend/src/agents/agents.py         ← UPDATED: hermes-3-405b
backend/src/orchestration/supervisor.py ← UPDATED: session persistence
backend/src/traces/logger.py         ← UPDATED: SessionStore
backend/src/api/routes/sessions.py   ← UPDATED: Full sessions route
backend/src/config.py                ← UPDATED: openrouter_api_key
backend/.env                         ← UPDATED: OPENROUTER_API_KEY
```

---

## Phase 2 — Premium Customer App (Mobile SPA)

**Completed:** 2026-05-18  
**Document:** [`phase_2_complete.md`](phase_2_complete.md)

### What Was Built:

**7 Premium Screen Components (`apps/customer-app/src/pages/`):**

| Screen | File | Description |
|--------|------|-------------|
| Splash | `Splash.jsx` | Auto-dismissing emerald glass panel logo, glowing animations |
| AI Chat Home | `Home.jsx` | "Salaam! Boliye..." with 4 service chips + floating glass input |
| Provider Matching | `Matching.jsx` | AI-ranked provider cards with distance, ratings, verified badges |
| Smart Scheduling | `Scheduling.jsx` | Interactive date calendar + timeline nodes + AI-suggested slots |
| Booking Confirmation | `Booking.jsx` | Animated confirmation + booking ID + transparent pricing breakdown |
| Live Tracking | `Tracking.jsx` | 5-stage lifecycle tracker + Demo State Simulator for judges |
| Dispute Resolution | `Dispute.jsx` | Pakistani-context complaint form + Hermes-3 AI arbitration card |

**Additional Tabs Added:**
- `ChatTab.jsx` — Persistent AI chat with image upload support
- `BookingsTab.jsx` — User's booking history tab
- `ProfileTab.jsx` — User profile with registered name + phone

**Customer API Integration (`src/api.js`):**
- Wired to FastAPI at `http://localhost:8000`
- Fallback handling when backend unavailable

**Files Created:**
```
apps/customer-app/index.html
apps/customer-app/src/main.jsx
apps/customer-app/src/index.css
apps/customer-app/src/api.js
apps/customer-app/src/App.jsx
apps/customer-app/src/pages/Splash.jsx
apps/customer-app/src/pages/Home.jsx
apps/customer-app/src/pages/Matching.jsx
apps/customer-app/src/pages/Scheduling.jsx
apps/customer-app/src/pages/Booking.jsx
apps/customer-app/src/pages/Tracking.jsx
apps/customer-app/src/pages/Dispute.jsx
apps/customer-app/src/pages/ChatTab.jsx
apps/customer-app/src/pages/BookingsTab.jsx
apps/customer-app/src/pages/ProfileTab.jsx
```

---

## Phase 3 — Orchestration & Observability Dashboard

**Completed:** 2026-05-18  
**Document:** [`phase_3_complete.md`](phase_3_complete.md)

### What Was Built:

**Cyber Obsidian Dark Theme SPA (`apps/orchestration-dashboard/`)**
- Split-pane layout: Session Feed (left) + Trace Observer (right)
- JetBrains Mono monospace typography for trace readability
- 201kB optimized bundle, zero errors

**Agent Trace Components:**
- Color-coded per-agent execution cards
- Neon Green = IntentParsingAgent (llama-3.3-70b)
- Neon Blue = ProviderDiscoveryAgent (SQL)
- Neon Purple = RankingAgent (qwen3-235b)
- Neon Yellow = PricingAgent (deterministic)
- Neon Red = DisputeAgent (hermes-3-405b)

**Real-Time Features:**
- Interval polling (1s / 3s / 5s selectable)
- Hot-pause toggle to freeze trace during inspection
- Structured JSON inspector for each agent's decision payload
- Session confidence percentage display

**Files Created:**
```
apps/orchestration-dashboard/index.html
apps/orchestration-dashboard/src/main.jsx
apps/orchestration-dashboard/src/index.css
apps/orchestration-dashboard/src/api.js
apps/orchestration-dashboard/src/App.jsx
```

---

## Phase 4 — Express Backend + Gemini Integration

### What Was Built:

**Express.js Server (`server/index.js`)**
- Routes: `/api/chat`, `/api/bookings`, `/api/upload`, `/api/bookings/:id/status`
- Gemini 1.5 Flash integration for multilingual AI chat
- Firebase Firestore integration with memory fallback
- Mock DB mode when no service account provided

**AI Chat Capabilities:**
- Intent classification (plumbing, AC, cleaning, electrician)
- Language detection (Urdu, English, Roman Urdu, code-switched)
- Complexity scoring (basic/intermediate/complex)
- Price estimation in PKR
- Roman Urdu + Urdu script dual response

---

## Phase 5 — Android Native App (Capacitor)

**Document:** [`Aimplementation_plan.md`](Aimplementation_plan.md)  
**APK:** `KhidmatAI_CustomerApp.apk` (6.8 MB)

### What Was Built:

**Capacitor Integration:**
- `@capacitor/core`, `@capacitor/cli`, `@capacitor/android` installed
- `capacitor.config.json` configured with `com.khidmat.app` bundle ID
- Android project scaffolded with Gradle build system

**Native Plugins Used:**
- `@capacitor/geolocation` — Real GPS coordinates + reverse geocoding
- `@capacitor/preferences` — Persistent user data (city, language, profile)
- `@capacitor/local-notifications` — 24-hour follow-up booking reminder

**Build Process:**
```bash
npm run build          # Vite production bundle
npx cap sync android   # Sync web assets to Android project
./gradlew assembleDebug # Compile to APK
```

---

## Phase 6 — Cloud Deployment (Google Cloud Run)

### What Was Deployed:

**Backend API on Cloud Run:**
```bash
gcloud run deploy khidmat-backend \
  --source ./server \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars="GEMINI_API_KEY=..."
```
URL: https://khidmat-backend-1083893144498.us-central1.run.app

**Admin Dashboard on Cloud Run:**
```bash
gcloud run deploy khidmat-admin \
  --source ./admin \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```
URL: https://khidmat-admin-1083893144498.us-central1.run.app

---

## Phase 7 — User Registration & Authentication

### What Was Built:

**Registration System (`frontend/src/App.jsx`):**
- First-launch registration screen (Name + Phone Number)
- Persisted to device via `@capacitor/preferences`
- Unique device-level user identity
- Clean slate per-device (no shared data between users)

**Profile Display (`ProfileTab.jsx`):**
- Shows registered user's dynamic Name + Phone Number
- Avatar initials from first letter of name
- Edit capability

**Chat Isolation:**
- Chat history stored per-device in `localStorage`
- Each new install starts with clean chat
- No cross-user data leakage

---

## Phase 8 — Mobile UI Fixes & Polish

### What Was Fixed:

**Input Bar Overflow on Small Screens:**
- Added `w-0 min-w-0` to input elements to prevent flex overflow
- Mic icon and Send button now stay within the rounded input bar on all screen sizes
- Fixed in both `Home.jsx` and `ChatTab.jsx`

**Profile Tab Data Fix:**
- `profile` prop now correctly passed from `Home.jsx` to `<ProfileTab />`
- User's registered name and phone number now display correctly

---

## Phase 9 — Splash Screen & Launcher Icon

### What Was Done:

**Splash Screen Replaced:**
- Default Capacitor blue splash screen removed
- KhidmatAI premium logo (`screen.png`) inserted across all Android drawable density folders
- `capacitor.config.json`: `launchShowDuration: 0` (instant hide)
- `AndroidManifest.xml`: Theme changed from `AppTheme.NoActionBarLaunch` to `AppTheme.NoActionBar` (no native splash at all)

**Launcher Icon Updated:**
- Premium KhidmatAI logo set via Android Studio → Image Asset
- White background, 80% scaling, trim enabled
- Icons replaced across all mipmap density folders (mdpi, hdpi, xhdpi, xxhdpi, xxxhdpi)

---

# 🔑 Key Technical Highlights

## 1. Multi-Model LLM Orchestration
Different LLMs serve different agent tasks — optimal capability-per-cost:
- **Llama 3.3 70B** for multilingual Urdu/Roman-Urdu intent parsing (131K context)
- **Qwen 235B** for complex provider ranking with agentic reasoning (262K context)
- **Hermes 3 405B** for frontier-scale dispute classification
- **Liquid LFM 1.2B** for fast scheduling logic (low latency)
- **Gemini 1.5 Flash** as always-available fallback

## 2. Resilience & Fallback Strategy
Every critical step has deterministic fallback:
- LLM call fails → rule-based keyword matching
- Firebase offline → in-memory mock DB
- Backend unreachable → local state management
- Confidence < 60% → clarification question to user

## 3. Full Booking Lifecycle
```
REQUESTED → MATCHED → PENDING_CONFIRMATION → CONFIRMED
→ EN_ROUTE → IN_PROGRESS → COMPLETED → [DISPUTED → RESOLVED] → CLOSED
```
Each transition emits a trace event to the observability dashboard.

## 4. Urdu-First Design
- RTL text support throughout the app
- Roman Urdu input recognized natively
- AI responds in both Roman Urdu and Urdu script simultaneously
- Voice input with `ur-PK` locale (Web Speech API)

---

# 📁 All Documentation Files

| File | Purpose |
|------|---------|
| [`implementation_plan.md`](implementation_plan.md) | Original 10-phase detailed build plan |
| [`architecture_plan.md`](architecture_plan.md) | Two-app system + model routing design |
| [`new-architecture_plan.md`](new-architecture_plan.md) | Updated architecture with Express backend |
| [`R_implementation_plan.md`](R_implementation_plan.md) | Revised implementation plan |
| [`Aimplementation_plan.md`](Aimplementation_plan.md) | Android APK generation plan |
| [`models.md`](models.md) | Free LLM models + OpenRouter API key |
| [`Chellenge.md`](Chellenge.md) | Hackathon challenge requirements |
| [`walkthrough1.md`](walkthrough1.md) | First MVP walkthrough |
| [`phase_1_complete.md`](phase_1_complete.md) | Phase 1 completion report |
| [`phase_2_complete.md`](phase_2_complete.md) | Phase 2 completion report |
| [`phase_3_complete.md`](phase_3_complete.md) | Phase 3 completion report |
| [`README.md`](README.md) | Project README with setup instructions |
| [`SUBMISSION_COMPLETE.md`](SUBMISSION_COMPLETE.md) | This comprehensive submission doc |

---

# 🚀 How to Run Everything Locally

### Step 1: Start the Express Backend
```bash
cd server
npm install
npm start
# → Running on http://localhost:8080
```

### Step 2: Start the Customer Web App
```bash
cd frontend
npm install
npm run dev
# → http://localhost:5174
```

### Step 3: Start the Admin Dashboard
```bash
cd admin
npm install
npm run dev
# → http://localhost:5173
```

### Step 4: Start the Python FastAPI Orchestrator
```bash
cd backend
pip install -r requirements.txt
uvicorn src.api.main:app --host 0.0.0.0 --port 8000 --reload
# → http://localhost:8000
```

### Step 5: Start the Observability Dashboard
```bash
cd apps/orchestration-dashboard
npm install
npm run dev
# → http://localhost:5175
```

### Step 6: Install the Android App
Transfer `KhidmatAI_CustomerApp.apk` to your Android device and install.

---

# 📱 Android App Test Flow

1. Install `KhidmatAI_CustomerApp.apk`
2. Register your name and phone number (first launch only)
3. Type a service request in Urdu, Roman Urdu, or English
4. Tap the mic icon to speak your request
5. See AI-matched providers with pricing
6. Book a service slot
7. Track your booking in the Bookings tab
8. View your profile in the Profile tab

---

*KhidmatAI — Connecting Pakistan's informal economy, one khidmat at a time. 🇵🇰*
