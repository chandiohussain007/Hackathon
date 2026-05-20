"""Seed the database with mock providers and generate availability slots."""
from __future__ import annotations
import json
import uuid
from pathlib import Path
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text
from src.db.database import ProviderRow, engine, Base

MOCK_DATA_PATH = Path(__file__).parent / "mock_providers.json"


def _generate_slots(provider_id: str, days_ahead: int = 7) -> list[dict]:
    """Generate realistic availability slots for the next N days."""
    slots = []
    base = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    time_blocks = [
        ("08:00", "10:00"), ("10:00", "12:00"),
        ("12:00", "14:00"), ("14:00", "16:00"),
        ("16:00", "18:00"),
    ]
    import random
    random.seed(hash(provider_id))
    for day in range(days_ahead):
        date = (base + timedelta(days=day)).strftime("%Y-%m-%d")
        for start, end in time_blocks:
            # ~70% of slots are available
            is_booked = random.random() < 0.30
            slots.append({
                "slot_id": str(uuid.uuid4())[:8],
                "date": date,
                "start_time": start,
                "end_time": end,
                "is_booked": is_booked,
                "travel_buffer_minutes": 30,
            })
    return slots


async def seed_providers() -> None:
    """Load mock_providers.json into the database (idempotent)."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    raw = json.loads(MOCK_DATA_PATH.read_text(encoding="utf-8"))

    async with engine.begin() as conn:
        for p in raw:
            # Check if already exists
            result = await conn.execute(
                text("SELECT id FROM providers WHERE id = :id"), {"id": p["id"]}
            )
            if result.fetchone():
                continue

            slots = _generate_slots(p["id"])
            await conn.execute(
                text(
                    """INSERT INTO providers
                    (id, name, name_urdu, phone, city, area, lat, lng,
                     gender, profile_verified, reputation_score,
                     services_json, metrics_json, status, availability_json)
                    VALUES (:id,:name,:name_urdu,:phone,:city,:area,:lat,:lng,
                            :gender,:profile_verified,:reputation_score,
                            :services_json,:metrics_json,:status,:availability_json)"""
                ),
                {
                    "id": p["id"],
                    "name": p["name"],
                    "name_urdu": p.get("name_urdu"),
                    "phone": p["phone"],
                    "city": p["city"],
                    "area": p["area"],
                    "lat": p["lat"],
                    "lng": p["lng"],
                    "gender": p.get("gender", "male"),
                    "profile_verified": p.get("profile_verified", False),
                    "reputation_score": p.get("reputation_score", 75.0),
                    "services_json": json.dumps(p.get("services", [])),
                    "metrics_json": json.dumps(p.get("metrics", {})),
                    "status": "active",
                    "availability_json": json.dumps(slots),
                },
            )
    print(f"✅ Seeded {len(raw)} providers into database.")


if __name__ == "__main__":
    import asyncio
    asyncio.run(seed_providers())
