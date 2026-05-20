"""POST /api/v1/requests — main entry point for user service requests."""
from __future__ import annotations
import uuid
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from src.orchestration.supervisor import KhidmatSupervisor

router = APIRouter()
_supervisor = KhidmatSupervisor()


class ServiceRequest(BaseModel):
    raw_input: str
    user_id: str = "USR-DEMO"
    location_lat: Optional[float] = None
    location_lng: Optional[float] = None
    location_label: Optional[str] = ""


@router.post("/requests")
async def submit_request(req: ServiceRequest):
    """Submit a noisy multilingual service request. Returns session state + trace."""
    session_id = f"SES-{str(uuid.uuid4())[:8].upper()}"
    state = await _supervisor.run(
        raw_input=req.raw_input,
        user_id=req.user_id,
        user_lat=req.location_lat or 0.0,
        user_lng=req.location_lng or 0.0,
        location_label=req.location_label or "",
        session_id=session_id,
    )
    return {
        "session_id": session_id,
        "status": state.get("pipeline_status"),
        "intent": state.get("parsed_intent"),
        "ranked_providers": state.get("ranked_providers", []),
        "proposed_slots": state.get("proposed_slots", []),
        "price_breakdown": state.get("price_breakdown"),
        "booking": state.get("booking"),
        "booking_id": state.get("booking_id"),
        "clarification_needed": state.get("clarification_needed", False),
        "clarification_question": state.get("clarification_question", ""),
        "fallback_message": state.get("fallback_message"),
        "trace_log": state.get("trace_log", []),
    }
