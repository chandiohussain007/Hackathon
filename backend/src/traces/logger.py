"""
KhidmatAI Trace Logger
Implements the ADK callback pattern: before/after agent hooks emit TraceStep objects.
All traces are stored in session.state["trace_log"] — the same shared dict ADK uses.
"""
from __future__ import annotations
import time
from datetime import datetime
from typing import Any, Optional
from src.models.trace import TraceStep, TraceStatus


class TraceLogger:
    """
    Thread-safe append-only trace emitter.
    Call emit() at each agent step. Results accumulate in session_state["trace_log"].
    """

    def __init__(self, session_id: str, session_state: dict):
        self.session_id = session_id
        self.state = session_state
        if "trace_log" not in self.state:
            self.state["trace_log"] = []
        if "trace_timers" not in self.state:
            self.state["trace_timers"] = {}

    def start(self, step: str, agent: str, input_summary: str = "") -> str:
        """Mark a step as started. Returns step_id."""
        step_obj = TraceStep(
            step=step,
            agent=agent,
            timestamp=datetime.utcnow().isoformat(),
            status=TraceStatus.STARTED,
            input_summary=input_summary[:300],
            session_id=self.session_id,
            start_time_epoch=time.time(),
        )
        self.state["trace_log"].append(step_obj.model_dump())
        self.state["trace_timers"][step] = time.time()
        return step_obj.step_id

    def complete(
        self,
        step: str,
        agent: str,
        reasoning: str = "",
        decision: Optional[dict] = None,
        confidence: float = 0.0,
        output_summary: str = "",
        fallback_used: bool = False,
        fallback_reason: Optional[str] = None,
    ) -> None:
        """Mark most recent matching step as completed."""
        elapsed = None
        if step in self.state.get("trace_timers", {}):
            elapsed = (time.time() - self.state["trace_timers"][step]) * 1000

        step_obj = TraceStep(
            step=step,
            agent=agent,
            timestamp=datetime.utcnow().isoformat(),
            status=TraceStatus.FALLBACK if fallback_used else TraceStatus.COMPLETED,
            reasoning=reasoning[:500],
            decision=decision or {},
            confidence=confidence,
            output_summary=output_summary[:300],
            fallback_used=fallback_used,
            fallback_reason=fallback_reason,
            duration_ms=elapsed,
            session_id=self.session_id,
        )
        self.state["trace_log"].append(step_obj.model_dump())

    def fail(self, step: str, agent: str, reason: str) -> None:
        step_obj = TraceStep(
            step=step,
            agent=agent,
            timestamp=datetime.utcnow().isoformat(),
            status=TraceStatus.FAILED,
            fallback_used=True,
            fallback_reason=reason,
            session_id=self.session_id,
        )
        self.state["trace_log"].append(step_obj.model_dump())

    def get_timeline(self) -> list[dict]:
        return self.state.get("trace_log", [])

    def get_summary(self) -> str:
        steps = [s["step"] for s in self.state.get("trace_log", [])
                 if s["status"] in ("completed", "fallback")]
        return " → ".join(steps)


# ── In-Memory Session Store ────────────────────────────────────────────────────
class SessionStore:
    """
    Thread-safe in-memory store of recent sessions.
    Used by the Orchestration Dashboard's /api/v1/sessions endpoint.
    Capped at 200 sessions to prevent unbounded memory growth.
    """
    MAX_SESSIONS = 200

    def __init__(self):
        self._sessions: dict[str, dict] = {}
        self._order: list[str] = []  # insertion-ordered list of session IDs

    def save(self, session_id: str, state: dict) -> None:
        """Save or update a session state."""
        if session_id not in self._sessions:
            self._order.append(session_id)
        self._sessions[session_id] = {
            "session_id": session_id,
            "user_id": state.get("user_id", "?"),
            "raw_input": state.get("raw_input", ""),
            "status": state.get("pipeline_status", "unknown"),
            "started_at": state.get("started_at", ""),
            "completed_at": state.get("completed_at", ""),
            "service_type": state.get("parsed_intent", {}).get("service_type", "unknown"),
            "booking_id": state.get("booking_id"),
            "provider_name": state.get("booking", {}).get("provider_name") if state.get("booking") else None,
            "confidence": state.get("intent_confidence", 0.0),
            "trace_log": state.get("trace_log", []),
            "error": state.get("error"),
        }
        # Evict oldest if at capacity
        while len(self._order) > self.MAX_SESSIONS:
            oldest = self._order.pop(0)
            self._sessions.pop(oldest, None)

    def get(self, session_id: str) -> dict | None:
        return self._sessions.get(session_id)

    def list_recent(self, limit: int = 50) -> list[dict]:
        """Return last N sessions in reverse-chronological order (summary only)."""
        recent_ids = list(reversed(self._order[-limit:]))
        return [
            {k: v for k, v in self._sessions[sid].items() if k != "trace_log"}
            for sid in recent_ids
            if sid in self._sessions
        ]


# Module-level singleton
session_store = SessionStore()
