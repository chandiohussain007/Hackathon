"""
KhidmatAI Scheduling Engine
Constraint-satisfaction slot finder with travel-time buffers and conflict prevention.
"""
from __future__ import annotations
from datetime import datetime, timedelta
from typing import Optional
from src.models.intent import ParsedIntent, Urgency


def parse_preferred_time(intent: ParsedIntent) -> Optional[datetime]:
    """Resolve intent preferred_time_iso to a datetime."""
    if intent.preferred_time_iso:
        try:
            return datetime.fromisoformat(intent.preferred_time_iso)
        except ValueError:
            pass
    # Default: tomorrow 10 AM
    tomorrow = datetime.now() + timedelta(days=1)
    return tomorrow.replace(hour=10, minute=0, second=0, microsecond=0)


def find_available_slots(
    availability: list[dict],
    intent: ParsedIntent,
    travel_buffer_min: int = 30,
    max_slots: int = 3,
) -> list[dict]:
    """
    Find the best available slots given provider calendar + intent.
    Returns up to max_slots sorted by proximity to preferred time.
    Includes waitlisted slots if free slots run out.
    """
    preferred = parse_preferred_time(intent)

    def slot_dt(s: dict) -> datetime:
        return datetime.strptime(f"{s['date']} {s['start_time']}", "%Y-%m-%d %H:%M")

    def slot_score(s: dict) -> float:
        dt = slot_dt(s)
        diff_hours = abs((dt - preferred).total_seconds()) / 3600
        # Emergency: heavy penalty for slots more than 3h away
        if intent.urgency == Urgency.EMERGENCY:
            return diff_hours * 3
        return diff_hours

    now = datetime.now()
    
    # Extract booked intervals for conflict checking
    booked_slots = [
        {"start": f"{s['date']} {s['start_time']}", "end": f"{s['date']} {s['end_time']}"}
        for s in availability if s.get("is_booked", False)
    ]

    free = []
    waitlist = []
    
    for s in availability:
        dt = slot_dt(s)
        # Filter out past slots
        if dt <= now + timedelta(minutes=travel_buffer_min):
            continue
            
        start_str = f"{s['date']} {s['start_time']}"
        end_str = f"{s['date']} {s['end_time']}"
        
        if s.get("is_booked", False):
            waitlist.append(s)
        else:
            # Check strict travel buffer conflict against actual booked slots
            if check_conflict(booked_slots, start_str, end_str, travel_buffer_min):
                continue
            free.append(s)

    free.sort(key=slot_score)
    waitlist.sort(key=slot_score)
    
    result = []
    for slot in free[:max_slots]:
        dt = slot_dt(slot)
        result.append({
            **slot,
            "display_time": dt.strftime("%A, %d %b %Y at %I:%M %p"),
            "iso_time": dt.isoformat(),
            "travel_buffer_min": travel_buffer_min,
            "urgency": intent.urgency.value,
            "is_waitlist": False,
        })
        
    if len(result) < max_slots:
        for slot in waitlist[:max_slots - len(result)]:
            dt = slot_dt(slot)
            result.append({
                **slot,
                "display_time": dt.strftime("%A, %d %b %Y at %I:%M %p") + " (Waitlist)",
                "iso_time": dt.isoformat(),
                "travel_buffer_min": travel_buffer_min,
                "urgency": intent.urgency.value,
                "is_waitlist": True,
            })
            
    return result


def check_conflict(
    booked_slots: list[dict],
    proposed_start: str,
    proposed_end: str,
    travel_buffer_min: int = 30,
) -> bool:
    """Return True if proposed slot conflicts with any existing booking."""
    fmt = "%Y-%m-%d %H:%M"
    try:
        ps = datetime.strptime(proposed_start, fmt)
        pe = datetime.strptime(proposed_end, fmt)
    except ValueError:
        return False

    buffer = timedelta(minutes=travel_buffer_min)
    for b in booked_slots:
        bs = datetime.strptime(b["start"], fmt)
        be = datetime.strptime(b["end"], fmt)
        # With buffer on each side
        if not (pe + buffer <= bs or ps - buffer >= be):
            return True
    return False


def mark_slot_booked(availability: list[dict], slot_id: str) -> list[dict]:
    """Mutate availability list to mark a slot as booked."""
    for s in availability:
        if s.get("slot_id") == slot_id:
            s["is_booked"] = True
    return availability
