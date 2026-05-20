# KhidmatAI - Conversation & Build History

This document chronicles the journey of building the **KhidmatAI Agentic Service Orchestrator MVP** during this session.

## Phase 0: Ideation & Architecture
- **Objective:** Build a multi-agent AI Service Orchestrator for Pakistan's informal economy (plumbers, electricians, maids, etc.).
- **Architecture Chosen:** Google Agent Development Kit (ADK) CustomAgent patterns, Python/FastAPI backend, React/Vite frontend.
- **Constraints:** The system needed to be highly robust and fully functional locally for hackathon judging, with a strong focus on "explainability" (traces) and mobile-first design.

## Phase 1: Models & Database
- Scoped out strictly-typed Pydantic models: `ParsedIntent`, `Provider`, `Booking`, and `TraceStep`.
- Configured asynchronous SQLAlchemy with SQLite (`aiosqlite`).
- Created an idempotent database seeder (`seed_data.py`) and generated a `mock_providers.json` dataset featuring 15 highly realistic, localized Pakistani provider profiles across Karachi, Hyderabad, and Islamabad.

## Phase 2: Core Engines
Built three pure-Python logic engines to handle complex offline processing:
1. **Matching Engine:** An 8-factor weighted formula (distance, reliability, urgency compatibility, etc.) to rank providers.
2. **Scheduling Engine:** A constraint-satisfaction finder to calculate available time slots with proper travel buffers.
3. **Pricing Engine:** A dynamic pricing model with urgency/demand surge multipliers and a strict 50% anti-gouging cap.

## Phase 3: Orchestration & Agents
- Implemented the `KhidmatSupervisor`, a central orchestrator mimicking ADK's `CustomAgent` pattern.
- Built 8 specialized sub-agents:
  - `IntentParsingAgent`: Handles noisy Roman Urdu, Urdu script, and English code-switching.
  - `ProviderDiscoveryAgent`: Filters geo-proximate providers.
  - `RankingAgent`, `SchedulingAgent`, `PricingAgent`: Wrappers around the core engines.
  - `BookingAgent`, `NotificationAgent`, `DisputeAgent`: Handle state lifecycle and post-booking flows.
- Implemented a `TraceLogger` that records every agent's reasoning, duration, and confidence, acting as the foundation for the "WOW" factor.

## Phase 4: API & Frontend
- **Backend:** Exposed the orchestrator via a robust FastAPI server. Bypassed DB initialization in mock mode to solve a Greenlet DLL issue on Python 3.14.
- **Frontend:** Scoped a React + Vite application featuring:
  - A mobile-first phone mockup shell for user interaction.
  - A massive, glassmorphic Vanilla CSS architecture (`index.css`) with premium dark mode styling and animations.
  - A live "Agent Trace Dashboard" that visualizes the orchestrator's decision-making timeline.

## Phase 5: Demo & Walkthrough
- Created a `sample_requests.json` file with 10 diverse test scenarios (e.g., typos, urgency, language mixes).
- Wrote a terminal CLI runner (`run_demo.py`) utilizing the `rich` library to show off the traces in the console.
- Wrote the final `walkthrough.md` to guide the judges through testing the application.

## Phase 6: UI Fixes & Mobile Features (Capacitor Integration)
- **UI Adjustments:** Restructured the chat input bar on `Home.jsx` to utilize standard CSS Flex alignment, eliminating mic and "+" icon overflows, adding spacing/padding, and preventing overlap on smaller device viewports.
- **Capacitor Geolocation**: Installed `@capacitor/geolocation` and `@capacitor/preferences`. Configured Android permissions and iOS keys, resolved user location coordinates, reverse-geocoded them using OpenStreetMap Nominatim API, and saved the state in Capacitor Preferences.
- **AI Chat Tab & Profile View**: Implemented fully functional `ChatTab.jsx`, `BookingsTab.jsx`, and `ProfileTab.jsx`. Designed an interactive profile bottom-drawer for language settings (Urdu/English toggle), address handling, and logout. Added support for mock image uploads in chat with auto-cost estimation.
- **Pakistan-specific Surcharges & Local Notifications**: Added an "Emergency Dispatch" (+PKR 200) surcharge checkbox, updating checkout estimates instantly, and scheduled a follow-up local notification exactly 24 hours after booking.

## Phase 7: Node.js Express API & React Admin Dashboard (Google Cloud Ready)
- **Node.js Express Server**: Created a `/server` directory hosting an Express API that tracks bookings, proxies requests to Gemini via official `@google/generative-ai` models, and saves data to Firebase Firestore (falling back to a local mock memory DB automatically when credentials are missing).
- **Kanban Admin Dashboard**: Created a React admin application (`/admin`) with custom authentication and a 4-stage Kanban tracking board (`New` > `Assigned` > `In Progress` > `Done`) for instant scheduling management.
- **Deployment & Containers**: Configured `Dockerfile` for both backend and admin static assets, matching Google Cloud Run specs. Provided `firebase.json`, `.env.example`, and CLI deploy command guidelines in a root `README.md`.
