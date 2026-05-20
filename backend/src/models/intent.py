"""Intent parsing models for KhidmatAI."""
from __future__ import annotations
from datetime import datetime
from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field


class ServiceType(str, Enum):
    PLUMBING = "plumbing"
    ELECTRICAL = "electrical"
    AC_SERVICE = "ac_service"
    CARPENTRY = "carpentry"
    PAINTING = "painting"
    CLEANING = "cleaning"
    TUTORING = "tutoring"
    DRIVER = "driver"
    MAID = "maid"
    MECHANIC = "mechanic"
    BEAUTY = "beauty"
    PEST_CONTROL = "pest_control"
    UNKNOWN = "unknown"


class Urgency(str, Enum):
    EMERGENCY = "emergency"   # right now / abhi
    URGENT = "urgent"         # same day
    NORMAL = "normal"         # tomorrow / kal
    FLEXIBLE = "flexible"     # sometime this week


class ComplexityLevel(str, Enum):
    BASIC = "basic"
    INTERMEDIATE = "intermediate"
    COMPLEX = "complex"


class LanguageMix(str, Enum):
    PURE_URDU = "pure_urdu"
    ROMAN_URDU = "roman_urdu"
    PURE_ENGLISH = "pure_english"
    CODE_SWITCHED = "code_switched"
    MIXED = "mixed"


class ParsedIntent(BaseModel):
    """Structured intent extracted from raw noisy user input."""

    # Core entities
    service_type: ServiceType = ServiceType.UNKNOWN
    service_subtype: Optional[str] = None          # e.g. "pipe_leak", "AC_gas_refill"
    location_raw: str = ""                          # as mentioned by user
    location_normalized: str = ""                   # canonical form
    location_lat: Optional[float] = None
    location_lng: Optional[float] = None
    city: str = "unknown"

    # Time
    urgency: Urgency = Urgency.NORMAL
    preferred_time_raw: str = ""                    # user's phrasing
    preferred_time_iso: Optional[str] = None        # ISO 8601 resolved time
    preferred_date: Optional[str] = None            # YYYY-MM-DD

    # Budget
    budget_sensitive: bool = False
    budget_max_pkr: Optional[float] = None

    # Preferences
    gender_preference: Optional[str] = None         # male/female provider
    verified_only: bool = False
    language_preference: str = "urdu"

    # Complexity
    complexity: ComplexityLevel = ComplexityLevel.BASIC
    issue_description: str = ""                     # normalized issue text

    # Language metadata
    language_mix: LanguageMix = LanguageMix.ROMAN_URDU
    original_script: bool = False                   # True if Urdu script detected

    # Confidence
    confidence: float = 0.0                         # 0.0 - 1.0
    confidence_vector: dict[str, float] = Field(default_factory=dict)
    low_confidence_fields: list[str] = Field(default_factory=list)
    clarification_needed: bool = False
    clarification_question: Optional[str] = None

    # Audit
    raw_input: str = ""
    parsed_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    fallback_used: bool = False
    fallback_reason: Optional[str] = None


class RawRequest(BaseModel):
    """Incoming user request before processing."""

    user_id: str
    session_id: Optional[str] = None
    raw_text: str
    location_lat: Optional[float] = None
    location_lng: Optional[float] = None
    location_label: Optional[str] = None            # "G-13 Islamabad"
    voice_transcript: bool = False
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
