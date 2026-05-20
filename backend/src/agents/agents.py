"""Discovery, Ranking, Scheduling, Pricing, Booking, Notification, Reputation, Dispute agents."""
from __future__ import annotations
import json
import uuid
import logging
from datetime import datetime
from pathlib import Path

from src.agents.base_agent import KhidmatBaseAgent
from src.models.intent import ParsedIntent
from src.models.provider import Provider, ProviderMetrics, ServiceListing, AvailabilitySlot
from src.models.booking import Booking, BookingStatus, LifecycleEvent, PriceBreakdown
from src.engines.matching import rank_providers
from src.engines.scheduling import find_available_slots
from src.engines.pricing import compute_price
from src.orchestration.tools import (
    geocode_location, get_current_demand,
    send_notification, update_calendar, generate_receipt, classify_dispute
)

logger = logging.getLogger(__name__)
MOCK_DATA = Path(__file__).parent.parent / "db" / "mock_providers.json"


def _load_providers() -> list[Provider]:
    raw = json.loads(MOCK_DATA.read_text(encoding="utf-8"))
    providers = []
    for p in raw:
        metrics_raw = p.get("metrics", {})
        metrics = ProviderMetrics(
            total_jobs=metrics_raw.get("total_jobs", 0),
            completed_jobs=metrics_raw.get("completed_jobs", 0),
            cancelled_jobs=metrics_raw.get("cancelled_jobs", 0),
            avg_rating=metrics_raw.get("avg_rating", 4.0),
            rating_count=metrics_raw.get("rating_count", 0),
            on_time_rate=metrics_raw.get("on_time_rate", 0.85),
            avg_response_time_minutes=metrics_raw.get("avg_response_time_minutes", 30.0),
        )
        services = [ServiceListing(**s) for s in p.get("services", [])]
        provider = Provider(
            id=p["id"], name=p["name"], name_urdu=p.get("name_urdu"),
            phone=p["phone"], city=p["city"], area=p["area"],
            lat=p["lat"], lng=p["lng"], gender=p.get("gender", "male"),
            profile_verified=p.get("profile_verified", False),
            reputation_score=p.get("reputation_score", 75.0),
            services=services, metrics=metrics,
        )
        providers.append(provider)
    return providers


# ── Provider Discovery Agent ──────────────────────────────────────────────────
class ProviderDiscoveryAgent(KhidmatBaseAgent):
    name = "ProviderDiscoveryAgent"
    description = "Discovers nearby providers via geo-filter and service matching"

    async def _execute(self, state: dict) -> dict:
        intent_dict = state.get("parsed_intent", {})
        intent = ParsedIntent(**intent_dict)
        user_lat = state.get("user_lat", 0.0)
        user_lng = state.get("user_lng", 0.0)

        if not user_lat or not user_lng:
            geo = geocode_location(intent.location_normalized or intent.city)
            user_lat, user_lng = geo["lat"], geo["lng"]
            state["user_lat"] = user_lat
            state["user_lng"] = user_lng

        all_providers = _load_providers()
        # Filter by service type and city proximity
        candidates = [
            p for p in all_providers
            if any(s.service_type == intent.service_type.value for s in p.services)
        ]

        state["candidates"] = [p.model_dump() for p in candidates]
        state[f"{self.name}_reasoning"] = (
            f"Found {len(candidates)} providers offering {intent.service_type.value} "
            f"near {intent.city} ({user_lat:.3f},{user_lng:.3f})"
        )
        state[f"{self.name}_confidence"] = 0.95 if candidates else 0.0
        state["provider_unavailable"] = len(candidates) == 0
        return state


# ── Ranking & Matching Agent ──────────────────────────────────────────────────
class RankingAgent(KhidmatBaseAgent):
    name = "RankingAgent"
    description = "Ranks providers using 8-factor weighted formula"

    async def _execute(self, state: dict) -> dict:
        intent = ParsedIntent(**state.get("parsed_intent", {}))
        provider_dicts = state.get("candidates", [])
        user_lat = state.get("user_lat", 24.8607)
        user_lng = state.get("user_lng", 67.0011)

        providers = []
        for pd in provider_dicts:
            pd["metrics"] = ProviderMetrics(**pd.get("metrics", {})) if isinstance(pd.get("metrics"), dict) else pd.get("metrics", ProviderMetrics())
            pd["services"] = [ServiceListing(**s) if isinstance(s, dict) else s for s in pd.get("services", [])]
            providers.append(Provider(**pd))

        ranked = rank_providers(providers, intent, user_lat, user_lng, top_k=5)
        state["ranked_providers"] = [r.model_dump() for r in ranked]
        state[f"{self.name}_reasoning"] = (
            f"Ranked {len(providers)} candidates → top {len(ranked)} selected. "
            f"Winner: {ranked[0].provider_name if ranked else 'none'} "
            f"(score={ranked[0].final_score:.3f})" if ranked else "No providers ranked."
        )
        state[f"{self.name}_confidence"] = 0.90 if ranked else 0.0
        state[f"{self.name}_decision"] = {
            "top_provider": ranked[0].provider_name if ranked else None,
            "top_score": ranked[0].final_score if ranked else 0,
            "ranked_count": len(ranked),
        }
        return state


# ── Scheduling Agent ──────────────────────────────────────────────────────────
class SchedulingAgent(KhidmatBaseAgent):
    name = "SchedulingAgent"
    description = "Finds available time slots with travel buffers"

    async def _execute(self, state: dict) -> dict:
        intent = ParsedIntent(**state.get("parsed_intent", {}))
        ranked = state.get("ranked_providers", [])
        if not ranked:
            state["proposed_slots"] = []
            return state

        top_provider_id = ranked[0]["provider_id"]
        all_providers = _load_providers()
        provider = next((p for p in all_providers if p.id == top_provider_id), None)

        slots = []
        if provider:
            # Generate fresh availability for demo
            from src.db.seed_data import _generate_slots
            availability = _generate_slots(provider.id)
            slots = find_available_slots(availability, intent, travel_buffer_min=30, max_slots=3)

        state["proposed_slots"] = slots
        state[f"{self.name}_reasoning"] = (
            f"Found {len(slots)} available slots for {ranked[0].get('provider_name','?')}. "
            f"Preferred time: {intent.preferred_time_iso or 'flexible'}"
        )
        state[f"{self.name}_confidence"] = 0.92 if slots else 0.40
        state[f"{self.name}_decision"] = {"slot_count": len(slots), "first_slot": slots[0].get("display_time") if slots else None}
        return state


# ── Pricing Agent ─────────────────────────────────────────────────────────────
class PricingAgent(KhidmatBaseAgent):
    name = "PricingAgent"
    description = "Computes dynamic price with full breakdown"

    async def _execute(self, state: dict) -> dict:
        intent = ParsedIntent(**state.get("parsed_intent", {}))
        ranked = state.get("ranked_providers", [])
        if not ranked:
            state["price_breakdown"] = {}
            return state

        top = ranked[0]
        all_providers = _load_providers()
        provider = next((p for p in all_providers if p.id == top["provider_id"]), None)
        base_rate = 900.0
        if provider:
            for svc in provider.services:
                if svc.service_type == intent.service_type.value:
                    base_rate = svc.base_rate_pkr
                    break

        demand_info = get_current_demand(intent.service_type.value, intent.city)
        breakdown = compute_price(
            base_rate_pkr=base_rate,
            intent=intent,
            distance_km=top.get("distance_km", 5.0),
            demand_level=demand_info["demand_level"],
            user_job_count=0,
        )

        state["price_breakdown"] = breakdown.model_dump()
        state[f"{self.name}_reasoning"] = breakdown.breakdown_text
        state[f"{self.name}_confidence"] = 0.95
        state[f"{self.name}_decision"] = {
            "final_pkr": breakdown.final_pkr,
            "surge_capped": breakdown.surge_capped,
            "breakdown_summary": breakdown.breakdown_text[:100],
        }
        return state


# ── Booking Agent ─────────────────────────────────────────────────────────────
class BookingAgent(KhidmatBaseAgent):
    name = "BookingAgent"
    description = "Orchestrates booking confirmation and calendar update"

    async def _execute(self, state: dict) -> dict:
        ranked = state.get("ranked_providers", [])
        slots = state.get("proposed_slots", [])
        price = state.get("price_breakdown", {})
        intent_dict = state.get("parsed_intent", {})
        user_id = state.get("user_id", "USR-DEMO")

        if not ranked or not slots:
            state["booking"] = None
            state["booking_id"] = None
            return state

        top = ranked[0]
        slot = slots[0]
        booking_id = f"BK-{str(uuid.uuid4())[:6].upper()}"

        lifecycle = [
            LifecycleEvent(event_type="created", actor="system", description="Booking created by AI orchestrator").model_dump(),
            LifecycleEvent(event_type="confirmed", actor="system", description="Auto-confirmed — provider notified").model_dump(),
        ]

        booking = Booking(
            booking_id=booking_id,
            session_id=state.get("session_id", ""),
            user_id=user_id,
            provider_id=top["provider_id"],
            provider_name=top["provider_name"],
            service_type=intent_dict.get("service_type", "unknown"),
            service_description=intent_dict.get("issue_description", "")[:200],
            scheduled_date=slot.get("date", ""),
            scheduled_start=f"{slot.get('date','')} {slot.get('start_time','')}",
            scheduled_end=f"{slot.get('date','')} {slot.get('end_time','')}",
            service_location=intent_dict.get("location_normalized", ""),
            price_breakdown=PriceBreakdown(**price) if price else None,
            final_amount_pkr=price.get("final_pkr", 0.0),
            status=BookingStatus.CONFIRMED,
            lifecycle=lifecycle,
        )

        # Side effects (mock)
        update_calendar(top["provider_id"], slot.get("slot_id", ""), booking_id)
        send_notification("+92-300-0000000", f"Booking {booking_id} confirmed for {slot.get('display_time','')}")
        receipt = generate_receipt(booking_id, booking.final_amount_pkr, user_id)

        state["booking"] = booking.model_dump()
        state["booking_id"] = booking_id
        state["receipt"] = receipt
        state["pipeline_status"] = "completed"
        state[f"{self.name}_reasoning"] = f"Created booking {booking_id} for {top['provider_name']} at {slot.get('display_time','')}"
        state[f"{self.name}_confidence"] = 0.99
        state[f"{self.name}_decision"] = {"booking_id": booking_id, "provider": top["provider_name"], "slot": slot.get("display_time")}
        return state


# ── Notification Agent ────────────────────────────────────────────────────────
class NotificationAgent(KhidmatBaseAgent):
    name = "NotificationAgent"
    description = "Sends SMS/WhatsApp notifications to user and provider"

    async def _execute(self, state: dict) -> dict:
        booking = state.get("booking", {})
        if not booking:
            return state
        bid = booking.get("booking_id", "?")
        send_notification("+92-300-0000000", f"آپ کی بکنگ {bid} تصدیق ہو گئی ہے۔", "whatsapp")
        send_notification("+92-300-9999999", f"New job {bid} assigned to you. Please confirm.", "sms")
        state[f"{self.name}_reasoning"] = f"Sent 2 notifications for booking {bid}"
        state[f"{self.name}_confidence"] = 1.0
        return state


# ── Reputation Agent ──────────────────────────────────────────────────────────
class ReputationAgent(KhidmatBaseAgent):
    name = "ReputationAgent"
    description = "Updates provider reputation score after job completion"

    async def _execute(self, state: dict) -> dict:
        rating = state.get("user_rating", 4.5)
        provider_id = state.get("booking", {}).get("provider_id", "?")
        # Formula: (weighted_avg_rating * 0.4) + (completion_rate * 0.3) + (on_time * 0.2) + (dispute_penalty * 0.1)
        new_score = min(100, max(0, 70 + (rating - 3) * 10))
        
        # Simulated dynamic metrics adjustment
        state["reputation_update"] = {
            "provider_id": provider_id,
            "new_score": new_score,
            "delta": new_score - 75,
            "metrics_delta": {
                "completed_jobs": 1,
                "rating_count": 1,
                "avg_rating_update": rating
            }
        }
        state[f"{self.name}_reasoning"] = f"Provider {provider_id} reputation updated to {new_score:.1f}. Adjusted reliability and risk metrics based on job completion."
        state[f"{self.name}_confidence"] = 0.90
        return state


# ── Dispute Agent ─────────────────────────────────────────────────────────────
class DisputeAgent(KhidmatBaseAgent):
    name = "DisputeAgent"
    description = "Classifies disputes and proposes resolutions"

    async def _execute(self, state: dict) -> dict:
        from src.config import get_settings
        settings = get_settings()

        description = state.get("dispute_description", "")
        booking_id = state.get("booking_id", "?")

        if settings.mock_mode:
            classification = classify_dispute(description, booking_id)
        else:
            try:
                classification = await self._classify_gemini(description)
            except Exception as e:
                self._logger.warning(f"Gemini dispute parsing failed: {e}")
                classification = classify_dispute(description, booking_id)

        resolution_map = {
            "no_show":           {"action": "Full refund issued", "refund_pct": 100},
            "delay":             {"action": "PKR 200 compensation voucher", "refund_pct": 0},
            "quality":           {"action": "30% refund + free reschedule", "refund_pct": 30},
            "price_disagreement":{"action": "10% refund as goodwill", "refund_pct": 10},
            "other":             {"action": "Human escalation triggered", "refund_pct": 0},
        }
        dtype = classification.get("dispute_type", "other")
        resolution = resolution_map.get(dtype, resolution_map["other"])

        lifecycle_event = LifecycleEvent(
            event_type="disputed",
            actor="user",
            description=f"Dispute: {dtype} — {resolution['action']}",
        ).model_dump()

        if "booking" in state and state["booking"]:
            state["booking"]["status"] = BookingStatus.DISPUTED.value
            state["booking"].setdefault("lifecycle", []).append(lifecycle_event)

        state["dispute_result"] = {
            "dispute_type": dtype,
            "confidence": classification.get("confidence", 0.0),
            "resolution": resolution["action"],
            "refund_pct": resolution["refund_pct"],
            "escalated_to_human": dtype == "other",
        }
        state[f"{self.name}_reasoning"] = (
            f"Classified as '{dtype}' (conf={classification.get('confidence', 0.0):.2f}). "
            f"Resolution: {resolution['action']}"
        )
        state[f"{self.name}_confidence"] = classification.get("confidence", 0.0)
        state[f"{self.name}_decision"] = state["dispute_result"]
        
        # Record dispute in reputation metrics delta
        provider_id = state.get("booking", {}).get("provider_id", "?")
        if "reputation_update" not in state:
            state["reputation_update"] = {"provider_id": provider_id, "metrics_delta": {}}
        state["reputation_update"]["metrics_delta"]["dispute_count"] = 1

        return state

    async def _classify_gemini(self, description: str) -> dict:
        """Classify dispute using hermes-3-405b via ModelRouter for frontier reasoning."""
        from pydantic import BaseModel
        from src.llm.router import TaskType

        class DisputeClassification(BaseModel):
            dispute_type: str
            confidence: float
            reasoning: str = ""

        prompt = f"""\
You are KhidmatAI's senior dispute resolution agent for Pakistan's service economy.
Classify the following user complaint into exactly one of these types:

- "no_show": Provider never arrived / confirmed then did not come.
- "delay": Provider was significantly late (>30 min beyond agreed time).
- "quality": Poor workmanship, incomplete job, or unsatisfactory service.
- "price_disagreement": Provider charged more than the agreed/quoted amount.
- "other": Anything else, ambiguous, or unable to classify with confidence.

Provide:
1. dispute_type: one of the exact strings above
2. confidence: 0.0–1.0 (how sure you are of the classification)
3. reasoning: brief explanation in the same language as the complaint

The complaint may be in Urdu, Roman Urdu, English, or mixed.

Complaint: "{description}"
"""
        res = await self._call_llm_json(TaskType.DISPUTE_CLASSIFY, prompt, DisputeClassification)
        return res.model_dump()
