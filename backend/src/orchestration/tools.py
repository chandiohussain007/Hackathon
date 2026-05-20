"""
KhidmatAI ADK-style Tools
Plain Python functions with full docstrings — the ADK tool pattern.
In MOCK_MODE all return realistic simulated data.
"""
from __future__ import annotations
import math
import logging
from datetime import datetime
from src.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

# ── Mock geocode data ─────────────────────────────────────────────────────────
CITY_COORDS = {
    "karachi":    (24.8607, 67.0011),
    "hyderabad":  (25.3960, 68.3578),
    "islamabad":  (33.6844, 73.0479),
    "lahore":     (31.5204, 74.3587),
    "rawalpindi": (33.5651, 73.0169),
    "g-13":       (33.6693, 72.9924),
    "g-11":       (33.6811, 72.9958),
    "f-10":       (33.7000, 72.9783),
    "dha":        (24.8138, 67.0311),
    "clifton":    (24.8052, 67.0309),
    "gulshan":    (24.9215, 67.0998),
    "pechs":      (24.8770, 67.0600),
    "latifabad":  (25.3960, 68.3578),
    "qasimabad":  (25.3630, 68.3440),
}


def geocode_location(location_text: str) -> dict:
    """
    Resolve a location string to lat/lng coordinates.
    In MOCK_MODE uses a hardcoded city dictionary.

    Args:
        location_text: Location string e.g. "G-13 Islamabad" or "DHA Karachi"

    Returns:
        dict with 'lat', 'lng', 'city', 'formatted_address', 'confidence'
    """
    text = location_text.lower()
    for key, (lat, lng) in CITY_COORDS.items():
        if key in text:
            city = "Islamabad" if lat > 33 else ("Hyderabad" if lng > 68 else "Karachi")
            logger.info("Geocoded '%s' → (%.4f, %.4f)", location_text, lat, lng)
            return {
                "lat": lat, "lng": lng,
                "city": city,
                "formatted_address": location_text.title(),
                "confidence": 0.90,
                "mock": True,
            }
    # Default: Karachi centre
    logger.warning("Could not geocode '%s', defaulting to Karachi", location_text)
    return {"lat": 24.8607, "lng": 67.0011, "city": "Karachi",
            "formatted_address": location_text, "confidence": 0.40, "mock": True}


def calculate_distance(lat1: float, lng1: float, lat2: float, lng2: float) -> dict:
    """
    Calculate distance and travel time between two coordinates.

    Args:
        lat1, lng1: Origin coordinates
        lat2, lng2: Destination coordinates

    Returns:
        dict with 'distance_km', 'travel_minutes', 'traffic_factor'
    """
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    a = math.sin(dlat/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlng/2)**2
    km = R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    traffic = 1.3  # 30% traffic factor for Pakistani cities
    travel_min = int(km * 3 * traffic)
    return {"distance_km": round(km, 2), "travel_minutes": travel_min, "traffic_factor": traffic}


def get_current_demand(service_type: str, city: str) -> dict:
    """
    Get current demand level for a service type in a city (0.0–1.0).
    Used by pricing engine for surge calculation.

    Args:
        service_type: e.g. "ac_service"
        city: e.g. "Karachi"

    Returns:
        dict with 'demand_level', 'surge_active', 'message'
    """
    # MOCK API RESPONSE
    # Summer months → AC demand spikes
    month = datetime.now().month
    base_demand = {
        "ac_service": 0.85 if month in [5, 6, 7, 8] else 0.40,
        "plumbing": 0.55,
        "electrical": 0.50,
        "tutoring": 0.70 if month in [9, 10, 11] else 0.45,
        "driver": 0.65,
        "cleaning": 0.60,
        "maid": 0.55,
    }.get(service_type, 0.50)

    return {
        "demand_level": base_demand,
        "surge_active": base_demand > 0.70,
        "message": f"{'High' if base_demand > 0.70 else 'Normal'} demand for {service_type} in {city}",
        "mock": True,
    }


def send_notification(
    recipient_phone: str,
    message: str,
    channel: str = "sms",
) -> dict:
    """
    Send SMS/WhatsApp notification to provider or user.

    Args:
        recipient_phone: Phone number
        message: Message text (supports Urdu)
        channel: 'sms' or 'whatsapp'

    Returns:
        dict with 'status', 'message_id'
    """
    # MOCK API RESPONSE - Replace with Twilio/Jazz Cash SMS API
    logger.info("MOCK NOTIFY [%s] → %s: %s", channel, recipient_phone, message[:50])
    return {
        "status": "sent",
        "message_id": f"MSG-{hash(message) % 99999:05d}",
        "channel": channel,
        "mock": True,
    }


def update_calendar(provider_id: str, slot_id: str, booking_id: str) -> dict:
    """
    Mark a provider's calendar slot as booked.

    Args:
        provider_id: Provider ID
        slot_id: Slot ID to book
        booking_id: Booking reference

    Returns:
        dict with 'status', 'calendar_event_id'
    """
    # MOCK API RESPONSE
    logger.info("MOCK CALENDAR: provider=%s slot=%s booking=%s", provider_id, slot_id, booking_id)
    return {
        "status": "booked",
        "calendar_event_id": f"CAL-{booking_id}",
        "provider_id": provider_id,
        "slot_id": slot_id,
        "mock": True,
    }


def generate_receipt(booking_id: str, amount_pkr: float, user_name: str) -> dict:
    """
    Generate a booking receipt/confirmation.

    Args:
        booking_id: Booking reference
        amount_pkr: Final amount
        user_name: Customer name

    Returns:
        dict with 'receipt_id', 'receipt_url', 'confirmation_code'
    """
    # MOCK API RESPONSE
    code = f"{booking_id[-4:]}-{abs(hash(user_name)) % 9999:04d}"
    return {
        "receipt_id": f"RCP-{booking_id}",
        "receipt_url": f"https://khidmatai.pk/receipt/{booking_id}",
        "confirmation_code": code,
        "amount_pkr": amount_pkr,
        "mock": True,
    }


def classify_dispute(description: str, booking_id: str) -> dict:
    """
    Classify a dispute into categories for automated routing.

    Args:
        description: User's dispute description
        booking_id: Booking reference

    Returns:
        dict with 'dispute_type', 'confidence', 'suggested_resolution'
    """
    desc_lower = description.lower()
    if any(w in desc_lower for w in ["nahi aaya", "no show", "nahin aya", "ghost"]):
        return {"dispute_type": "no_show", "confidence": 0.92,
                "suggested_resolution": "refund_full", "mock": True}
    if any(w in desc_lower for w in ["late", "der", "time", "waqt"]):
        return {"dispute_type": "delay", "confidence": 0.85,
                "suggested_resolution": "compensation", "mock": True}
    if any(w in desc_lower for w in ["kaam sahi nahi", "quality", "poor", "bura"]):
        return {"dispute_type": "quality", "confidence": 0.88,
                "suggested_resolution": "refund_partial", "mock": True}
    if any(w in desc_lower for w in ["price", "qeemat", "zyada", "paise"]):
        return {"dispute_type": "price_disagreement", "confidence": 0.80,
                "suggested_resolution": "refund_partial", "mock": True}
    return {"dispute_type": "other", "confidence": 0.60,
            "suggested_resolution": "human_escalation", "mock": True}
