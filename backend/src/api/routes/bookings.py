"""Bookings routes — confirm, dispute."""
from __future__ import annotations
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from src.orchestration.supervisor import KhidmatSupervisor

router = APIRouter()
_supervisor = KhidmatSupervisor()


class DisputeRequest(BaseModel):
    session_id: str
    booking_id: str
    description: str
    user_id: str = "USR-DEMO"


@router.post("/bookings/dispute")
async def raise_dispute(req: DisputeRequest):
    """Raise a dispute for a completed booking."""
    state = await _supervisor.run(
        raw_input=req.description,
        user_id=req.user_id,
        session_id=req.session_id,
        dispute_mode=True,
        dispute_description=req.description,
    )
    state["booking_id"] = req.booking_id
    return {
        "booking_id": req.booking_id,
        "dispute_result": state.get("dispute_result"),
        "trace_log": state.get("trace_log", []),
    }
