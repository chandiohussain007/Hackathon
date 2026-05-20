"""Provider and service listing models for KhidmatAI."""
from __future__ import annotations
from datetime import datetime
from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field


class ProviderStatus(str, Enum):
    ACTIVE = "active"
    BUSY = "busy"
    OFFLINE = "offline"
    SUSPENDED = "suspended"


class AvailabilitySlot(BaseModel):
    """A single time slot in a provider's calendar."""
    slot_id: str
    date: str                      # YYYY-MM-DD
    start_time: str                # HH:MM (24h)
    end_time: str                  # HH:MM (24h)
    is_booked: bool = False
    travel_buffer_minutes: int = 30


class ProviderMetrics(BaseModel):
    """Live performance metrics for ranking."""
    total_jobs: int = 0
    completed_jobs: int = 0
    cancelled_jobs: int = 0
    no_show_count: int = 0
    avg_response_time_minutes: float = 30.0
    avg_rating: float = 4.0
    rating_count: int = 0
    on_time_rate: float = 0.85
    dispute_count: int = 0
    last_active: Optional[str] = None

    @property
    def completion_rate(self) -> float:
        if self.total_jobs == 0:
            return 1.0
        return self.completed_jobs / self.total_jobs

    @property
    def cancellation_rate(self) -> float:
        if self.total_jobs == 0:
            return 0.0
        return self.cancelled_jobs / self.total_jobs


class ServiceListing(BaseModel):
    """A specific service a provider offers."""
    service_type: str
    service_subtype: Optional[str] = None
    base_rate_pkr: float
    complexity_supported: list[str] = Field(default_factory=lambda: ["basic"])
    description: str = ""
    certifications: list[str] = Field(default_factory=list)
    tools_available: list[str] = Field(default_factory=list)
    years_experience: int = 1


class Provider(BaseModel):
    """Full provider profile."""
    id: str
    name: str
    name_urdu: Optional[str] = None
    phone: str
    city: str
    area: str
    lat: float
    lng: float

    services: list[ServiceListing] = Field(default_factory=list)
    availability: list[AvailabilitySlot] = Field(default_factory=list)
    metrics: ProviderMetrics = Field(default_factory=ProviderMetrics)
    status: ProviderStatus = ProviderStatus.ACTIVE

    gender: str = "male"
    languages: list[str] = Field(default_factory=lambda: ["urdu"])
    profile_verified: bool = False
    cnic_verified: bool = False
    photo_url: Optional[str] = None
    bio: str = ""

    joined_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    reputation_score: float = 75.0   # 0-100 composite


class MatchScore(BaseModel):
    """Score breakdown for a single provider match."""
    provider_id: str
    provider_name: str

    # Individual factor scores (normalized 0-1)
    distance_score: float = 0.0
    specialization_score: float = 0.0
    reliability_score: float = 0.0
    price_fairness_score: float = 0.0
    availability_score: float = 0.0
    urgency_compatibility_score: float = 0.0
    preference_score: float = 0.0
    historical_success_score: float = 0.0

    # Computed
    final_score: float = 0.0
    rank: int = 0
    distance_km: float = 0.0
    estimated_travel_minutes: int = 0

    # Explainability
    explanation: str = ""
    explanation_urdu: str = ""
    weight_breakdown: dict[str, float] = Field(default_factory=dict)
    fairness_boosted: bool = False
