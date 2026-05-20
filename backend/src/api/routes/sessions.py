"""
Sessions route — list and inspect orchestration sessions.
Used by the Orchestration Dashboard to display live session feed.
"""
from __future__ import annotations
from fastapi import APIRouter
from src.traces.logger import session_store  # in-memory store

router = APIRouter()


@router.get("/sessions")
async def list_sessions(limit: int = 50):
    """
    Return last N sessions with trace summaries.
    Used by the Orchestration Dashboard for the live feed.
    """
    sessions = session_store.list_recent(limit=limit)
    return {"sessions": sessions, "total": len(sessions)}


@router.get("/sessions/{session_id}")
async def get_session(session_id: str):
    """Return full state + trace for a specific session."""
    session = session_store.get(session_id)
    if not session:
        return {"error": "Session not found", "session_id": session_id}
    return session
