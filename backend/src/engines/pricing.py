"""
KhidmatAI Dynamic Pricing Engine
Formula: base × complexity → dynamic (urgency + surge + distance) → loyalty discount
Anti-gouging cap: surge ≤ 50%.
"""
from __future__ import annotations
from src.models.booking import PriceBreakdown
from src.models.intent import ParsedIntent, Urgency, ComplexityLevel
from src.config import get_settings

settings = get_settings()

COMPLEXITY_FACTOR = {
    ComplexityLevel.BASIC: 1.0,
    ComplexityLevel.INTERMEDIATE: 1.35,
    ComplexityLevel.COMPLEX: 1.75,
}

URGENCY_MULTIPLIER = {
    Urgency.EMERGENCY: 0.40,
    Urgency.URGENT: 0.20,
    Urgency.NORMAL: 0.0,
    Urgency.FLEXIBLE: -0.05,  # slight discount for flexible
}


def compute_price(
    base_rate_pkr: float,
    intent: ParsedIntent,
    distance_km: float,
    demand_level: float = 0.5,   # 0-1 current demand
    user_job_count: int = 0,     # for loyalty discount
) -> PriceBreakdown:
    complexity = intent.complexity
    urgency = intent.urgency

    complexity_factor = COMPLEXITY_FACTOR.get(complexity, 1.0)
    base_adjusted = base_rate_pkr * complexity_factor

    # Additive multipliers
    urgency_mult = URGENCY_MULTIPLIER.get(urgency, 0.0)
    demand_surge = max(0.0, (demand_level - 0.6) * 0.5)  # surge only above 60% demand
    distance_factor = min(0.20, distance_km * 0.01)       # max +20% for distance

    total_surge = urgency_mult + demand_surge + distance_factor

    # Anti-gouging cap
    surge_capped = False
    original_surge = total_surge
    cap = settings.surge_cap_multiplier - 1.0  # e.g. 0.50
    if total_surge > cap:
        total_surge = cap
        surge_capped = True

    dynamic = base_adjusted * (1 + total_surge)

    # Loyalty discount (returning users)
    loyalty_discount = min(0.10, user_job_count * 0.02)  # 2% per job, max 10%
    final = dynamic * (1 - loyalty_discount)
    final = round(max(final, base_rate_pkr * 0.8), 0)   # floor: 80% of base

    subtotal = round(base_adjusted * (1 + total_surge), 0)

    platform_fee_pkr = round(final * 0.15, 0)
    provider_earnings_pkr = final - platform_fee_pkr

    breakdown_text = _build_breakdown_text(
        base_rate_pkr, complexity_factor, urgency_mult,
        demand_surge, distance_factor, loyalty_discount,
        surge_capped, subtotal, final, platform_fee_pkr, provider_earnings_pkr
    )
    breakdown_urdu = _build_breakdown_urdu(base_rate_pkr, final, surge_capped)

    return PriceBreakdown(
        base_rate_pkr=base_rate_pkr,
        complexity_factor=complexity_factor,
        urgency_multiplier=round(urgency_mult, 3),
        demand_surge=round(demand_surge, 3),
        distance_factor=round(distance_factor, 3),
        loyalty_discount=round(loyalty_discount, 3),
        subtotal_pkr=subtotal,
        final_pkr=final,
        platform_fee_pkr=platform_fee_pkr,
        provider_earnings_pkr=provider_earnings_pkr,
        surge_capped=surge_capped,
        original_surge=round(original_surge, 3),
        breakdown_text=breakdown_text,
        breakdown_urdu=breakdown_urdu,
        fairness_note="Surge capped at 50% — anti-gouging policy applied." if surge_capped else "",
    )


def _build_breakdown_text(base, cf, um, ds, df, ld, capped, subtotal, final, platform, provider) -> str:
    lines = [
        f"Base rate: PKR {base:.0f}",
        f"Complexity factor: ×{cf:.2f} → PKR {base*cf:.0f}",
    ]
    if um > 0:
        lines.append(f"Urgency premium: +{um*100:.0f}%")
    if ds > 0:
        lines.append(f"Demand surge: +{ds*100:.0f}%")
    if df > 0:
        lines.append(f"Distance charge: +{df*100:.0f}%")
    if capped:
        lines.append("⚠️ Surge capped at 50% (anti-gouging)")
    if ld > 0:
        lines.append(f"Loyalty discount: -{ld*100:.0f}%")
    lines.append(f"Final price: PKR {final:.0f}")
    lines.append(f"Provider earnings: PKR {provider:.0f} (Platform fee: PKR {platform:.0f})")
    return " | ".join(lines)


def _build_breakdown_urdu(base, final, capped) -> str:
    text = f"بنیادی قیمت: {base:.0f} روپے | آخری قیمت: {final:.0f} روپے"
    if capped:
        text += " | قیمت حد سے زیادہ نہیں بڑھائی گئی"
    return text
