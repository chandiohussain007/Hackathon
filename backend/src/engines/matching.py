"""
KhidmatAI Matching Engine
8-factor weighted scoring formula — fully explainable.
Pure Python, no LLM dependency. Testable in isolation.
"""
from __future__ import annotations
import math
from src.models.provider import Provider, MatchScore, ProviderMetrics
from src.models.intent import ParsedIntent, Urgency

# ── Weights (must sum to 1.0) ────────────────────────────────────────────────
WEIGHTS = {
    "distance":          0.20,
    "specialization":    0.15,
    "reliability":       0.15,
    "price_fairness":    0.10,
    "availability":      0.10,
    "urgency_compat":    0.10,
    "preference":        0.05,
    "historical":        0.05,
    "risk_safety":       0.05,
    "rating_confidence": 0.05,
}

MAX_DISTANCE_KM = 30.0   # beyond this → distance_score = 0


def haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    a = math.sin(dlat / 2) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlng / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def _distance_score(km: float) -> float:
    if km >= MAX_DISTANCE_KM:
        return 0.0
    return 1.0 - (km / MAX_DISTANCE_KM)


def _specialization_score(provider: Provider, intent: ParsedIntent) -> float:
    for svc in provider.services:
        if svc.service_type == intent.service_type.value:
            # Bonus for matching complexity
            if intent.complexity.value in svc.complexity_supported:
                return 1.0
            return 0.75
    return 0.0


def _reliability_score(m: ProviderMetrics) -> float:
    rating_norm = (m.avg_rating - 1.0) / 4.0           # 1-5 → 0-1
    completion = m.completion_rate
    on_time = m.on_time_rate
    cancel_penalty = min(1.0, m.cancellation_rate * 2)  # heavy penalty
    raw = (rating_norm * 0.4 + completion * 0.3 + on_time * 0.3) - cancel_penalty * 0.2
    return max(0.0, min(1.0, raw))


def _price_fairness_score(provider: Provider, intent: ParsedIntent, market_avg: float) -> float:
    rates = [s.base_rate_pkr for s in provider.services if s.service_type == intent.service_type.value]
    if not rates:
        return 0.5
    rate = rates[0]
    if intent.budget_sensitive:
        # Lower price → higher score when budget-sensitive
        ratio = market_avg / max(rate, 1)
        return min(1.0, ratio)
    else:
        # Moderate pricing is best
        diff = abs(rate - market_avg) / max(market_avg, 1)
        return max(0.0, 1.0 - diff)


def _availability_score(provider: Provider, intent: ParsedIntent) -> float:
    if not provider.availability:
        return 0.5
    free_slots = [s for s in provider.availability if not s.get("is_booked", False)]
    ratio = len(free_slots) / max(len(provider.availability), 1)
    # Urgency: if emergency and no slots → bad
    if intent.urgency == Urgency.EMERGENCY and ratio < 0.1:
        return 0.1
    return min(1.0, ratio * 1.5)


def _urgency_compatibility(provider: Provider, intent: ParsedIntent, m: ProviderMetrics) -> float:
    if intent.urgency == Urgency.EMERGENCY:
        return m.on_time_rate  # best proxy for emergency readiness
    if intent.urgency == Urgency.URGENT:
        return (m.on_time_rate + (1 - m.avg_response_time_minutes / 120)) / 2
    return 0.8  # normal urgency — most providers fine


def _preference_score(provider: Provider, intent: ParsedIntent) -> float:
    score = 1.0
    if intent.gender_preference and provider.gender != intent.gender_preference:
        score -= 0.8
    if intent.verified_only and not provider.profile_verified:
        score -= 0.5
    return max(0.0, score)


def _historical_score(m: ProviderMetrics) -> float:
    if m.total_jobs < 5:
        return 0.5  # new provider — neutral
    success_rate = m.completed_jobs / max(m.total_jobs, 1)
    return max(0.0, success_rate)


def _risk_safety_score(m: ProviderMetrics) -> float:
    # High dispute rate or extreme cancellation rate lowers safety score
    risk_factor = (m.dispute_count * 2 + m.cancelled_jobs) / max(m.total_jobs, 1)
    return max(0.0, 1.0 - min(1.0, risk_factor * 2))


def _rating_confidence_score(m: ProviderMetrics) -> float:
    from datetime import datetime, timezone
    
    # Volume confidence
    volume_score = min(1.0, m.rating_count / 50.0)
    
    # Recency decay based on last_active
    recency_score = 0.5
    if m.last_active:
        try:
            last_active_dt = datetime.fromisoformat(m.last_active.replace('Z', '+00:00'))
            # If active in last 7 days = 1.0, drops off after that
            days_since = (datetime.now(timezone.utc) - last_active_dt).days
            recency_score = max(0.0, 1.0 - (days_since / 30.0))
        except ValueError:
            pass
            
    return volume_score * 0.6 + recency_score * 0.4


def compute_match(
    provider: Provider,
    intent: ParsedIntent,
    user_lat: float,
    user_lng: float,
    market_avg_rate: float = 900.0,
) -> MatchScore:
    m = ProviderMetrics(**provider.metrics) if isinstance(provider.metrics, dict) else provider.metrics
    km = haversine_km(user_lat, user_lng, provider.lat, provider.lng)
    travel_min = int(km * 3)  # rough: 3 min/km in city

    scores = {
        "distance":       _distance_score(km),
        "specialization": _specialization_score(provider, intent),
        "reliability":    _reliability_score(m),
        "price_fairness": _price_fairness_score(provider, intent, market_avg_rate),
        "availability":   _availability_score(provider, intent),
        "urgency_compat": _urgency_compatibility(provider, intent, m),
        "preference":     _preference_score(provider, intent),
        "historical":     _historical_score(m),
        "risk_safety":    _risk_safety_score(m),
        "rating_confidence": _rating_confidence_score(m),
    }

    final = sum(WEIGHTS[k] * v for k, v in scores.items())

    # Fairness boost: under-utilised verified providers get +5%
    fairness_boosted = False
    if m.total_jobs < 20 and provider.profile_verified and final > 0.4:
        final = min(1.0, final + 0.05)
        fairness_boosted = True

    explanation = _generate_explanation(provider, scores, km, travel_min, intent)

    return MatchScore(
        provider_id=provider.id,
        provider_name=provider.name,
        distance_score=round(scores["distance"], 3),
        specialization_score=round(scores["specialization"], 3),
        reliability_score=round(scores["reliability"], 3),
        price_fairness_score=round(scores["price_fairness"], 3),
        availability_score=round(scores["availability"], 3),
        urgency_compatibility_score=round(scores["urgency_compat"], 3),
        preference_score=round(scores["preference"], 3),
        historical_success_score=round(scores["historical"], 3),
        # risk and rating are internal to matching engine mostly, but could be added to MatchScore model if we update the model.
        # For now, we will add them to weight_breakdown.
        final_score=round(final, 4),
        distance_km=round(km, 2),
        estimated_travel_minutes=travel_min,
        explanation=explanation,
        weight_breakdown={k: round(WEIGHTS[k] * v, 4) for k, v in scores.items()},
        fairness_boosted=fairness_boosted,
    )


def rank_providers(
    providers: list[Provider],
    intent: ParsedIntent,
    user_lat: float,
    user_lng: float,
    top_k: int = 5,
) -> list[MatchScore]:
    scores = []
    market_avg = _compute_market_avg(providers, intent)

    for p in providers:
        if p.status != "active":
            continue
        ms = compute_match(p, intent, user_lat, user_lng, market_avg)
        if ms.specialization_score > 0:  # must offer the service
            scores.append(ms)

    scores.sort(key=lambda x: x.final_score, reverse=True)

    # Diversity: max 2 from same area
    seen_areas: dict[str, int] = {}
    diverse = []
    for s in scores:
        p = next((p for p in providers if p.id == s.provider_id), None)
        if p:
            area = p.area
            if seen_areas.get(area, 0) < 2:
                seen_areas[area] = seen_areas.get(area, 0) + 1
                diverse.append(s)
        if len(diverse) >= top_k:
            break

    for i, s in enumerate(diverse):
        s.rank = i + 1

    return diverse


def _compute_market_avg(providers: list[Provider], intent: ParsedIntent) -> float:
    rates = []
    for p in providers:
        for s in p.services:
            if s.service_type == intent.service_type.value:
                rates.append(s.base_rate_pkr)
    return sum(rates) / len(rates) if rates else 900.0


def _generate_explanation(
    provider: Provider, scores: dict, km: float, travel_min: int, intent: ParsedIntent
) -> str:
    parts = []
    if scores["specialization"] >= 1.0:
        parts.append(f"Specializes in {intent.service_type.value} including {intent.complexity.value} jobs")
    if scores["reliability"] >= 0.8:
        parts.append(f"Highly reliable ({provider.metrics.avg_rating:.1f}★, {int(provider.metrics.on_time_rate * 100)}% on-time)")
    elif scores["reliability"] < 0.5:
        parts.append("Moderate reliability — recent cancellations noted")
    parts.append(f"{km:.1f}km away (~{travel_min} min travel)")
    if scores["price_fairness"] >= 0.8:
        parts.append("Competitively priced")
    if provider.profile_verified:
        parts.append("Verified profile")
    return ". ".join(parts) + "."
