"""Trace/observability models for KhidmatAI agent pipeline."""
from __future__ import annotations
from datetime import datetime
from enum import Enum
from typing import Optional, Any
from pydantic import BaseModel, Field
import uuid


class TraceStatus(str, Enum):
    STARTED = "started"
    COMPLETED = "completed"
    FAILED = "failed"
    FALLBACK = "fallback"
    SKIPPED = "skipped"


class TraceStep(BaseModel):
    """
    A single observable step in the agent pipeline.
    Serializable to JSON for the UI timeline.
    """
    step_id: str = Field(default_factory=lambda: str(uuid.uuid4())[:8])
    step: str                                    # e.g. "intent_parsing"
    agent: str                                   # e.g. "IntentParsingAgent"
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    status: TraceStatus = TraceStatus.STARTED

    # Input/Output summaries (truncated for UI)
    input_summary: str = ""
    output_summary: str = ""

    # Reasoning chain (the WOW factor for judges)
    reasoning: str = ""
    decision: dict[str, Any] = Field(default_factory=dict)

    # Quality metrics
    confidence: float = 0.0
    fallback_used: bool = False
    fallback_reason: Optional[str] = None
    retry_attempt: int = 0

    # Performance
    duration_ms: Optional[float] = None
    start_time_epoch: Optional[float] = None

    # Linked entities
    session_id: str = ""
    booking_id: Optional[str] = None


class AgentTrace(BaseModel):
    """Full trace for a single agent invocation."""
    trace_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    session_id: str
    steps: list[TraceStep] = Field(default_factory=list)
    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    total_duration_ms: Optional[float] = None
    final_status: TraceStatus = TraceStatus.STARTED

    # Summary for quick display
    pipeline_summary: str = ""
    provider_selected: Optional[str] = None
    booking_id: Optional[str] = None
    intent_confidence: float = 0.0
    fallback_count: int = 0
