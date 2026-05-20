"""
KhidmatAI Supervisor Agent — The Antigravity Orchestrator
=========================================================
Implements ADK's CustomAgent pattern (BaseAgent + _run_async_impl).
Executes a deterministic plan-execute-verify pipeline with:
  - Parallel pre-processing (translation + context enrichment)
  - Sequential happy path (intent → discovery → ranking → scheduling + pricing → booking)
  - LoopAgent-style recovery (retry on low confidence, fallback on no providers)
  - Dispute workflow branch
  - Full trace emission at every step

ADK-native swap: In full ADK mode, wrap each await self._agent.run(state) call
in "async for event in agent.run_async(ctx): yield event" — identical logic.
"""
from __future__ import annotations
import uuid
import logging
from datetime import datetime
from src.agents import (
    IntentParsingAgent, ProviderDiscoveryAgent, RankingAgent,
    SchedulingAgent, PricingAgent, BookingAgent,
    NotificationAgent, DisputeAgent,
)
from src.traces.logger import TraceLogger, session_store
from src.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


class KhidmatSupervisor:
    """
    Central orchestrator for KhidmatAI.

    Maps to ADK architecture:
    - This class ≡ CustomAgent(BaseAgent) implementing _run_async_impl
    - session.state ≡ the `state` dict passed through all agents
    - Each agent.run(state) ≡ async for event in sub_agent.run_async(ctx): yield event
    - Conditional branching on state values ≡ ADK's documented pattern for custom orchestration

    Sub-agents (equivalent to ADK sub_agents=[...]):
        intent_agent, discovery_agent, ranking_agent,
        scheduling_agent, pricing_agent, booking_agent,
        notification_agent, dispute_agent
    """

    def __init__(self):
        # Sub-agents — matches ADK's sub_agents list on BaseAgent
        self.intent_agent        = IntentParsingAgent()
        self.discovery_agent     = ProviderDiscoveryAgent()
        self.ranking_agent       = RankingAgent()
        self.scheduling_agent    = SchedulingAgent()
        self.pricing_agent       = PricingAgent()
        self.booking_agent       = BookingAgent()
        self.notification_agent  = NotificationAgent()
        self.dispute_agent       = DisputeAgent()

    async def run(
        self,
        raw_input: str,
        user_id: str = "USR-DEMO",
        user_lat: float = 0.0,
        user_lng: float = 0.0,
        location_label: str = "",
        session_id: str = "",
        dispute_mode: bool = False,
        dispute_description: str = "",
        selected_slot_index: int = 0,
    ) -> dict:
        """
        Execute the full KhidmatAI pipeline.
        Returns the final session state (includes trace_log, booking, ranked_providers, etc.)
        """
        session_id = session_id or f"SES-{str(uuid.uuid4())[:8].upper()}"
        started_at = datetime.utcnow().isoformat()

        # ── Initialise shared state (≡ ADK session.state) ────────────────────
        state: dict = {
            "session_id": session_id,
            "user_id": user_id,
            "raw_input": raw_input,
            "user_lat": user_lat,
            "user_lng": user_lng,
            "location_label": location_label,
            "trace_log": [],
            "trace_timers": {},
            "pipeline_status": "started",
            "started_at": started_at,
            "retry_count": 0,
            "fallback_activated": False,
        }

        tracer = TraceLogger(session_id, state)
        tracer.start("supervisor", "KhidmatSupervisor",
                     input_summary=f"Processing: '{raw_input[:100]}'")

        try:
            # ── DISPUTE BRANCH ────────────────────────────────────────────────
            if dispute_mode:
                state["dispute_description"] = dispute_description
                state = await self.dispute_agent.run(state)
                state["pipeline_status"] = "dispute_resolved"
                tracer.complete("supervisor", "KhidmatSupervisor",
                                reasoning="Dispute workflow executed",
                                decision=state.get("dispute_result", {}),
                                confidence=state.get(f"{self.dispute_agent.name}_confidence", 0))
                return state

            # ── STEP 1: Intent Parsing ────────────────────────────────────────
            state = await self.intent_agent.run(state)

            # ── RECOVERY LOOP: low confidence → retry up to 2x ───────────────
            # Equivalent to ADK LoopAgent with CheckCondition + escalate=True
            while (state.get("intent_confidence", 0) < settings.intent_confidence_threshold
                   and state["retry_count"] < 2):
                state["retry_count"] += 1
                logger.warning("Low confidence %.2f — retry %d",
                               state["intent_confidence"], state["retry_count"])
                # Augment input with retry context, re-parse
                state["raw_input"] = state["raw_input"] + " [retry attempt]"
                state = await self.intent_agent.run(state)

            # ── CLARIFICATION CHECK ───────────────────────────────────────────
            if state.get("clarification_needed") and state.get("intent_confidence", 0) < 0.45:
                state["pipeline_status"] = "needs_clarification"
                tracer.complete("supervisor", "KhidmatSupervisor",
                                reasoning="Clarification required from user",
                                confidence=state.get("intent_confidence", 0))
                return state

            # ── STEP 2: Provider Discovery ────────────────────────────────────
            state = await self.discovery_agent.run(state)

            # ── NO PROVIDER FALLBACK ──────────────────────────────────────────
            if state.get("provider_unavailable"):
                state["pipeline_status"] = "no_providers"
                state["fallback_message"] = (
                    "Maafi chahte hain — abhi is area mein koi provider available nahi hai. "
                    "Hum aapko jald hi notify karenge."
                )
                tracer.complete("supervisor", "KhidmatSupervisor",
                                reasoning="No providers found — fallback activated",
                                fallback_used=True)
                return state

            # ── STEP 3: Ranking ───────────────────────────────────────────────
            state = await self.ranking_agent.run(state)

            # ── STEPS 4+5: Scheduling + Pricing (parallel in full ADK mode) ───
            # In ADK: ParallelAgent([scheduling_agent, pricing_agent])
            # Here: sequential (same result, ordering doesn't matter)
            state = await self.scheduling_agent.run(state)
            state = await self.pricing_agent.run(state)

            # ── STEP 6: Booking (requires user confirmation in real app) ──────
            # For demo: auto-confirm with top provider + first slot
            if state.get("ranked_providers") and state.get("proposed_slots"):
                state = await self.booking_agent.run(state)
                state = await self.notification_agent.run(state)

            state["pipeline_status"] = "completed"
            state["completed_at"] = datetime.utcnow().isoformat()

            tracer.complete(
                "supervisor", "KhidmatSupervisor",
                reasoning="Pipeline completed successfully",
                decision={
                    "booking_id": state.get("booking_id"),
                    "provider": state.get("ranked_providers", [{}])[0].get("provider_name") if state.get("ranked_providers") else None,
                    "status": state["pipeline_status"],
                },
                confidence=0.95,
                output_summary=f"Booking {state.get('booking_id','?')} created",
            )

        except Exception as exc:
            logger.exception("Supervisor pipeline failed: %s", exc)
            state["pipeline_status"] = "failed"
            state["error"] = str(exc)
            tracer.fail("supervisor", "KhidmatSupervisor", str(exc))

        # Persist session for Orchestration Dashboard
        session_store.save(session_id, state)
        return state
