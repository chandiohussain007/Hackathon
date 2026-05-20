# KhidmatAI — Principal Architecture Plan
## Two-App System Design

---

## 1. Repository Structure (Final Target)

```
d:\Hackathon\
├── backend/                      ← Existing FastAPI backend (enhanced)
│   └── src/
│       ├── agents/               ← 8 specialized sub-agents
│       ├── orchestration/        ← KhidmatSupervisor
│       ├── engines/              ← matching, scheduling, pricing
│       ├── models/               ← Pydantic schemas
│       ├── traces/               ← TraceLogger
│       ├── db/                   ← SQLite + seed data
│       └── api/                  ← FastAPI routes
│
├── apps/
│   ├── customer-app/             ← APP 1: Premium mobile customer UI
│   │   ├── index.html
│   │   ├── src/
│   │   │   ├── App.jsx           ← SPA router
│   │   │   ├── pages/
│   │   │   │   ├── Splash.jsx
│   │   │   │   ├── Home.jsx      ← AI Chat Home (from Stitch)
│   │   │   │   ├── Matching.jsx  ← Provider Matching (from Stitch)
│   │   │   │   ├── Scheduling.jsx← Smart Scheduling (from Stitch)
│   │   │   │   ├── Booking.jsx   ← Booking Confirmation
│   │   │   │   ├── Tracking.jsx  ← Live booking tracker
│   │   │   │   └── Dispute.jsx   ← Dispute submission
│   │   │   └── components/
│   │   │       ├── ProviderCard.jsx
│   │   │       ├── BookingTimeline.jsx
│   │   │       └── ChatBubble.jsx
│   │   └── package.json
│   │
│   └── orchestration-dashboard/  ← APP 2: Internal ops/judge dashboard
│       ├── index.html
│       ├── src/
│       │   ├── App.jsx
│       │   └── pages/
│       │       ├── Dashboard.jsx ← Live trace feed
│       │       ├── Trace.jsx     ← Per-session deep dive
│       │       ├── Providers.jsx ← Provider analytics
│       │       └── Disputes.jsx  ← Escalation tracker
│       └── package.json
│
└── stitch_khidmatai_*/           ← Source design assets (DO NOT MODIFY)
```

---

## 2. Model Strategy (OpenRouter)

Using the key from `models.md`: `sk-or-v1-ae16c844...`

| Task | Model | Reason |
|------|-------|--------|
| Intent parsing (multilingual Urdu) | `meta-llama/llama-3.3-70b-instruct` | Strong multilingual |
| Provider ranking reasoning | `qwen/qwen3-next-80b-a3b-instruct` | Agentic workflows |
| Dispute classification | `nousresearch/hermes-3-405b-instruct` | Frontier reasoning |
| Fast utility tasks | `liquid/lfm2.5-1.2b-thinking` | Low latency |
| Fallback / default | `google/gemma-4-26b-a4b-it` | Free, reliable |

The backend will route model calls through a `ModelRouter` abstraction that selects the right model per agent task type.

---

## 3. Booking Lifecycle States

```
REQUESTED → MATCHED → PENDING_CONFIRMATION → CONFIRMED
→ EN_ROUTE → IN_PROGRESS → COMPLETED → [DISPUTED → RESOLVED] → CLOSED
```

Each state transition emits a trace event captured by `TraceLogger`.

---

## 4. Agent Responsibilities

| Agent | Responsibility | Model |
|-------|---------------|-------|
| `IntentParsingAgent` | Parse noisy Urdu/Roman-Urdu/English into structured intent | llama-3.3-70b |
| `ProviderDiscoveryAgent` | Geo-filter providers from JSON/DB by service + city | deterministic |
| `RankingAgent` | 10-factor weighted scoring: distance, rating, urgency, risk, etc. | qwen3-80b |
| `SchedulingAgent` | CSP slot finder with 30-min travel buffers + waitlist | deterministic |
| `PricingAgent` | Base + complexity + demand surge, capped at 50% | deterministic |
| `BookingAgent` | State machine: DRAFT → CONFIRMED | deterministic |
| `NotificationAgent` | Simulates WhatsApp/SMS events | deterministic |
| `DisputeAgent` | Classify complaint → propose resolution | hermes-3-405b |

---

## 5. Customer App Flow

```
Splash → Home (AI Chat)
         ↓ user types request
       [POST /api/v1/requests]
         ↓ response arrives
       Matching screen (provider cards)
         ↓ user taps "Book Now"
       Scheduling screen (slot picker)
         ↓ user confirms slot
       [POST /api/v1/bookings/confirm]
         ↓
       Booking Confirmation screen
         ↓ state transitions
       Live Tracking screen
         ↓ after completion
       Feedback / Dispute screen
```

**The customer NEVER sees:**
- Raw trace logs
- Agent confidence scores
- Technical reasoning
- Engineering internals

They only see simple AI explanations like: *"We found 3 experts near you. Zubair is recommended based on his 98% rating and proximity."*

---

## 6. Orchestration Dashboard Flow

```
Dashboard (live session feed)
  ↓ click any session
Session Detail → Full reasoning trace timeline
  ↓
Per-agent trace cards showing:
  - Agent name + duration
  - Input → Decision → Output
  - Confidence score
  - Fallback triggers
  - Rejected providers (with reasons)
  - Scheduling conflict explanations
  - Pricing breakdown logic
```

---

## 7. Implementation Phases

### Phase 1 — Backend Enhancement (OpenRouter)
- [x] FastAPI already running
- [ ] Add `ModelRouter` abstraction (`backend/src/llm/router.py`)
- [ ] Wire `IntentParsingAgent` → llama-3.3-70b via OpenRouter
- [ ] Wire `DisputeAgent` → hermes-3-405b via OpenRouter
- [ ] Add booking lifecycle state machine endpoints
- [ ] Add `/api/v1/sessions` list endpoint for dashboard

### Phase 2 — Customer App (Stitch Designs)
- [ ] Create `apps/customer-app/` Vite project
- [ ] Port Stitch HTML screens into React components
- [ ] Implement SPA routing (Splash → Home → Matching → Scheduling → Booking → Tracking)
- [ ] Wire to backend API
- [ ] Mobile-first responsive layout

### Phase 3 — Orchestration Dashboard
- [ ] Create `apps/orchestration-dashboard/` Vite project
- [ ] Live trace feed with auto-refresh
- [ ] Per-session deep-dive trace viewer
- [ ] Provider analytics panel
- [ ] Futuristic dark-mode design

### Phase 4 — Integration & Polish
- [ ] End-to-end flow testing
- [ ] Multilingual input testing (Urdu/Roman-Urdu/English)
- [ ] APK rebuild for customer app
- [ ] Demo preparation
