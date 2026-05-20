# Real Agentic System Upgrade Plan

The goal is to transition KhidmatAI from a deterministic, hardcoded mock MVP to a **"Real Agentic System"** powered by live Gemini LLM calls. We will fulfill the comprehensive hackathon requirements spanning multilingual intent parsing, 10-factor matching, complexity classification, intelligent scheduling, dynamic pricing, and deep orchestration loops.

> [!IMPORTANT]
> This upgrade will introduce real API latency (~2-4 seconds per LLM call), replacing the instant mock responses. You provided the Gemini API key, which will be securely injected into the `.env` file to power the agents.

## User Review Required

Please review the proposed approach below. Once you approve, I will systematically rewrite the mock engines and integrate the live Gemini SDK.

## Proposed Changes

### Configuration & Dependencies
- Update `.env` with the provided `GOOGLE_API_KEY`.
- Set `MOCK_MODE=False`.

---

### LLM Integration Layer
#### [MODIFY] `src/agents/base_agent.py`
- Integrate `google-generativeai`.
- Add a shared `_call_gemini_json` method to the base agent that forces structured Pydantic output using `response_schema`.

---

### 1. Intent Parsing & Classification (Gemini Powered)
#### [MODIFY] `src/agents/intent_agent.py`
- Completely replace the regex/keyword dictionary `_parse_mock` function.
- Write a highly-tuned Gemini prompt (Few-Shot) that handles:
  - Urdu script, Roman Urdu, slang, and code-switching.
  - Extraction of Service Type, City, Urgency.
  - **New:** Classification of Job Complexity (basic, intermediate, complex).
  - Confidence scoring and clarification generation.
- Use Gemini's `response_schema` to strictly return a `ParsedIntent` model.

---

### 2. Advanced Provider Matching (10+ Factors)
#### [MODIFY] `src/engines/matching.py`
- Expand the current 8-factor formula to cover all user requirements:
  - **Distance/Travel Time:** (Already implemented, will enhance).
  - **Availability:** Ensure real-time slot checking.
  - **Rating & Review Recency:** Add time-decay weight.
  - **Reliability/On-Time:** Historical metrics.
  - **Skill Specialization:** Match Job Complexity to Provider Certification.
  - **Price/Capacity/Cancellation Rate:** Negative weights for high cancellation rates.
  - **Risk Score:** Flag high-risk providers based on past disputes.

---

### 3. Intelligent Scheduling & Buffers
#### [MODIFY] `src/engines/scheduling.py`
- Enhance the constraint satisfaction engine.
- Enforce strict travel-time buffers (e.g., 30 mins between jobs).
- Prevent double booking.
- Introduce waitlist capability if preferred slots are taken.

---

### 4. Dynamic Pricing & Fairness
#### [MODIFY] `src/engines/pricing.py`
- Incorporate multiple pricing dimensions:
  - Base provider rate based on job complexity.
  - Urgency surge.
  - Distance premium.
  - Loyalty discount (if user has > 5 past jobs).
- Ensure the breakdown clearly shows the platform fee vs. provider earnings (Fairness).

---

### 5. Service-Quality & Dispute Loops
#### [MODIFY] `src/agents/agents.py`
- **ReputationAgent:** Will now adjust the "Risk Score" and "Reliability Score" dynamically.
- **DisputeAgent:** Use Gemini to classify the dispute description (no-show, quality complaint, price disagreement) and determine the exact refund/compensation policy.
- **Booking Simulation:** We will enhance the `BookingAgent` and `NotificationAgent` to emit detailed trace steps showing SMS dispatch, receipt generation, and provider-side workload balancing.

## Verification Plan

### Automated Tests
- Run the `demo/run_demo.py` runner to verify that the live Gemini calls parse messy Roman Urdu correctly and return structured JSON.
- Verify the 10-factor matching engine correctly prioritizes high-reliability, low-cancellation providers over closer, riskier ones.

### Manual Verification
- Launch the React frontend and submit the exact query: *"Mujhe kal morning main AC service chahiye"*. Verify the live trace timeline accurately reflects the LLM reasoning and the comprehensive matching breakdown.
