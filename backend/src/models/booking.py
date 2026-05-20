"""Booking lifecycle models for KhidmatAI."""
from __future__ import annotations
from datetime import datetime
from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field
import uuid


class BookingStatus(str, Enum):
    DRAFT = "draft"
    PROPOSED = "proposed"
    CONFIRMED = "confirmed"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    REVIEWED = "reviewed"
    CANCELLED = "cancelled"
    DISPUTED = "disputed"
    REFUNDED = "refunded"


class DisputeType(str, Enum):
    NO_SHOW = "no_show"
    DELAY = "delay"
    QUALITY = "quality"
    PRICE_DISAGREEMENT = "price_disagreement"
    OVERRUN = "overrun"
    OTHER = "other"


class DisputeResolution(str, Enum):
    REFUND_FULL = "refund_full"
    REFUND_PARTIAL = "refund_partial"
    RESCHEDULE = "reschedule"
    COMPENSATION = "compensation"
    BLACKLIST_PROVIDER = "blacklist_provider"
    HUMAN_ESCALATION = "human_escalation"
    NO_ACTION = "no_action"


class LifecycleEvent(BaseModel):
    """A single transition event in the booking lifecycle."""
    event_id: str = Field(default_factory=lambda: str(uuid.uuid4())[:8])
    event_type: str                          # e.g. "confirmed", "provider_en_route"
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    actor: str = "system"                    # "user", "provider", "system", "agent"
    description: str = ""
    metadata: dict = Field(default_factory=dict)


class PriceBreakdown(BaseModel):
    """Dynamic pricing breakdown — fully explainable."""
    base_rate_pkr: float
    complexity_factor: float = 1.0
    urgency_multiplier: float = 0.0          # additive %
    demand_surge: float = 0.0               # additive %
    distance_factor: float = 0.0            # additive %
    loyalty_discount: float = 0.0           # deductive %

    subtotal_pkr: float = 0.0
    final_pkr: float = 0.0
    platform_fee_pkr: float = 0.0
    provider_earnings_pkr: float = 0.0

    # Surge cap enforcement
    surge_capped: bool = False
    original_surge: float = 0.0

    # Explanation
    breakdown_text: str = ""
    breakdown_urdu: str = ""
    fairness_note: str = ""

    # Metadata
    computed_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())


class Booking(BaseModel):
    """Full booking record."""
    booking_id: str = Field(default_factory=lambda: f"BK-{str(uuid.uuid4())[:6].upper()}")
    session_id: str
    user_id: str
    provider_id: str
    provider_name: str

    service_type: str
    service_description: str = ""

    # Timing
    scheduled_date: str = ""
    scheduled_start: str = ""
    scheduled_end: str = ""
    actual_start: Optional[str] = None
    actual_end: Optional[str] = None

    # Location
    service_location: str = ""
    service_lat: Optional[float] = None
    service_lng: Optional[float] = None

    # Pricing
    price_breakdown: Optional[PriceBreakdown] = None
    final_amount_pkr: float = 0.0
    payment_status: str = "pending"

    # Status
    status: BookingStatus = BookingStatus.DRAFT
    lifecycle: list[LifecycleEvent] = Field(default_factory=list)

    # Review
    user_rating: Optional[float] = None
    user_review: Optional[str] = None
    provider_rating: Optional[float] = None

    # Dispute
    dispute_type: Optional[DisputeType] = None
    dispute_description: Optional[str] = None
    dispute_resolution: Optional[DisputeResolution] = None
    dispute_resolved_at: Optional[str] = None

    # Audit
    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    confirmation_code: str = Field(default_factory=lambda: str(uuid.uuid4())[:8].upper())
