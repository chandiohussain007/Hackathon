# KhidmatAI MVP Walkthrough

We have successfully upgraded the **KhidmatAI Agentic Service Orchestrator** from a mock MVP to a **Real Agentic System**. The system now uses live **Google Gemini API** calls for advanced multi-lingual reasoning, resolving noisy intent, and intelligently classifying dispute resolutions.

> [!IMPORTANT]
> The orchestrator strictly follows the Google Agent Development Kit (ADK) documented patterns for `CustomAgent`, `session.state` sharing, and `Callbacks` for trace observability.
> With `MOCK_MODE=False`, agents like `IntentParsingAgent` and `DisputeAgent` dynamically call the Gemini API using Pydantic structured output constraints to guarantee valid JSON responses.

## Architecture & Implementation 

### 1. The Khidmat Supervisor (ADK CustomAgent)
The core of the system is the `KhidmatSupervisor` (in `src/orchestration/supervisor.py`). It orchestrates 8 specialized sub-agents using a deterministic plan-execute-verify pattern:

1. **`IntentParsingAgent`** (Gemini-Powered): Normalizes noisy Urdu/Roman-Urdu/English inputs into structured JSON with confidence scoring. Handles pure script, Roman Urdu slang, and code-switching dynamically.
2. **`ProviderDiscoveryAgent`**: Geo-locates the user and filters mock providers by service and city.
3. **`RankingAgent`** (10-Factor Engine): Executes an advanced 10-factor weighted algorithm (Distance, Specialization, Reliability, Price Fairness, Availability, Urgency, Preference, Historical, Risk Safety, and Rating Confidence).
4. **`SchedulingAgent`**: A constraint-satisfaction engine ensuring strict 30-minute travel buffers, preventing overlap and generating waitlists if needed.
5. **`PricingAgent`**: Calculates dynamic rates (Complexity + Demand Surge) with a strict 50% anti-gouging cap. Now explicitly calculates platform fee vs provider earnings.
6. **`BookingAgent`**: Orchestrates the state machine from `DRAFT` to `CONFIRMED`.
7. **`NotificationAgent`**: Dispatches WhatsApp/SMS events.
8. **`DisputeAgent`** (Gemini-Powered): Classifies unstructured complaints (No Show, Delay, Quality) using an LLM and proposes fair automated refunds.

### 2. State, Tracing, and Reputation
We implemented a `TraceLogger` that tracks the exact reasoning, duration, and fallback chains across the entire agent lifecycle. This trace is emitted directly to the frontend timeline.
- **Resilience**: The supervisor has built-in retry loops and automatically falls back to deterministic parsing if an LLM call fails or confidence drops below 60%.
- **Reputation Agent**: Updates `risk_safety` and `rating_confidence` dynamic metrics post-booking and on disputes to continually filter out bad actors.

### 3. The Backend
- Written in modern, typed **FastAPI** (`src/api/main.py`).
- **Database**: SQLite via `aiosqlite` and `SQLAlchemy 2.0`. We seeded the database with 15 highly realistic, localized Pakistani provider profiles across Karachi, Hyderabad, and Islamabad.

### 4. The Frontend (React + Vite)
- We built a **stunning, glassmorphic UI** using a simulated mobile-phone shell on the left, and a live "Agent Trace" inspector on the right.
- It uses React, Vite, and Lucide icons.
- Powered by a premium, dark-mode CSS variables system in `index.css`.

## How to Test

You can test the system in two ways:

### Method 1: The Terminal Runner
Run the demo script to see the rich terminal output with traces for 10 pre-configured scenarios (including Urdu script, Code-switched Roman Urdu, and Dispute resolution).

```bash
python d:\Hackathon\demo\run_demo.py
```

### Method 2: Full Stack (API + React UI)
Start the backend API in one terminal, bound to all network interfaces so the mobile app can reach it:
```bash
cd d:\Hackathon\backend
uvicorn src.api.main:app --host 0.0.0.0 --port 8000 --reload
```

Start the React Frontend in a second terminal (for web testing):
```bash
cd d:\Hackathon\frontend
npm run dev
```

### Method 3: KhidmatAI Native Android App
We have bundled the mobile-first React frontend into a native Android application using Capacitor!

1. Ensure your backend is running with `--host 0.0.0.0` as shown in Method 2.
2. Ensure your Android device is connected to the **same Wi-Fi network** as your PC.
3. Locate the compiled APK on your PC at:
   `d:\Hackathon\frontend\android\app\build\outputs\apk\debug\app-debug.apk`
4. Transfer this `.apk` file to your Android phone (via USB, email, or WhatsApp) and install it.
5. Open the **KhidmatAI** app on your phone and start typing your service requests!
