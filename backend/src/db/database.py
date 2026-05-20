"""SQLite database setup — swap-ready for PostgreSQL/Firestore."""
from __future__ import annotations
import json
import uuid
from pathlib import Path
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy import String, Float, Integer, Text, Boolean, JSON
from src.config import get_settings

settings = get_settings()

engine = create_async_engine(settings.database_url, echo=False)
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


class ProviderRow(Base):
    __tablename__ = "providers"
    id: Mapped[str] = mapped_column(String, primary_key=True)
    name: Mapped[str] = mapped_column(String)
    name_urdu: Mapped[str] = mapped_column(String, nullable=True)
    phone: Mapped[str] = mapped_column(String)
    city: Mapped[str] = mapped_column(String)
    area: Mapped[str] = mapped_column(String)
    lat: Mapped[float] = mapped_column(Float)
    lng: Mapped[float] = mapped_column(Float)
    gender: Mapped[str] = mapped_column(String, default="male")
    profile_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    reputation_score: Mapped[float] = mapped_column(Float, default=75.0)
    services_json: Mapped[str] = mapped_column(Text, default="[]")
    metrics_json: Mapped[str] = mapped_column(Text, default="{}")
    status: Mapped[str] = mapped_column(String, default="active")
    availability_json: Mapped[str] = mapped_column(Text, default="[]")


class BookingRow(Base):
    __tablename__ = "bookings"
    booking_id: Mapped[str] = mapped_column(String, primary_key=True)
    session_id: Mapped[str] = mapped_column(String)
    user_id: Mapped[str] = mapped_column(String)
    provider_id: Mapped[str] = mapped_column(String)
    provider_name: Mapped[str] = mapped_column(String)
    service_type: Mapped[str] = mapped_column(String)
    status: Mapped[str] = mapped_column(String, default="draft")
    scheduled_date: Mapped[str] = mapped_column(String, nullable=True)
    scheduled_start: Mapped[str] = mapped_column(String, nullable=True)
    final_amount_pkr: Mapped[float] = mapped_column(Float, default=0.0)
    price_breakdown_json: Mapped[str] = mapped_column(Text, default="{}")
    lifecycle_json: Mapped[str] = mapped_column(Text, default="[]")
    created_at: Mapped[str] = mapped_column(String)


class SessionRow(Base):
    __tablename__ = "sessions"
    session_id: Mapped[str] = mapped_column(String, primary_key=True)
    user_id: Mapped[str] = mapped_column(String)
    raw_input: Mapped[str] = mapped_column(Text)
    state_json: Mapped[str] = mapped_column(Text, default="{}")
    trace_json: Mapped[str] = mapped_column(Text, default="[]")
    created_at: Mapped[str] = mapped_column(String)
    updated_at: Mapped[str] = mapped_column(String)


async def init_db() -> None:
    """Create all tables."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def get_db() -> AsyncSession:
    async with AsyncSessionLocal() as session:
        yield session
