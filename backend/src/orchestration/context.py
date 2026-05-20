"""
KhidmatAI Session Context
Maps to ADK's session.state dict. Typed wrapper for IDE support and validation.
"""
from __future__ import annotations
from typing import Optional, Any
from dataclasses import dataclass, field


@dataclass
class SessionContext:
    """
    Typed view over ADK session.state.
    All agents read/write via this object; it serialises back to session.state.
    """
    session_id: str = ""
    user_id: str = ""

    # Input
    raw_input: str = ""
    user_lat: float = 0.0
    user_lng: float = 0.0
    location_label: str = ""

    # Pipeline outputs (written by agents, read by subsequent agents)
    parsed_intent: Optional[dict] = None          # ParsedIntent.model_dump()
    candidates: list[dict] = field(default_factory=list)   # Provider dicts
    ranked_providers: list[dict] = field(default_factory=list)  # MatchScore dicts
    proposed_slots: list[dict] = field(default_factory=list)
    price_breakdown: Optional[dict] = None
    booking: Optional[dict] = None
    booking_id: Optional[str] = None
    dispute_result: Optional[dict] = None

    # Control flow flags
    intent_confidence: float = 0.0
    clarification_needed: bool = False
    clarification_question: str = ""
    provider_unavailable: bool = False
    fallback_activated: bool = False
    retry_count: int = 0
    pipeline_status: str = "started"   # started | completed | failed | needs_input

    # Trace
    trace_log: list[dict] = field(default_factory=list)
    trace_timers: dict[str, float] = field(default_factory=dict)

    @classmethod
    def from_state(cls, state: dict) -> "SessionContext":
        ctx = cls()
        for k, v in state.items():
            if hasattr(ctx, k):
                setattr(ctx, k, v)
        return ctx

    def to_state(self) -> dict:
        import dataclasses
        return dataclasses.asdict(self)

    def merge_into(self, state: dict) -> None:
        """Write all fields back into session.state."""
        import dataclasses
        for k, v in dataclasses.asdict(self).items():
            state[k] = v
