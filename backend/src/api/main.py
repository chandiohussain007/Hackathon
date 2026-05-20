"""FastAPI application — KhidmatAI backend."""
from __future__ import annotations
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.config import get_settings
from src.db.database import init_db
from src.db.seed_data import seed_providers
from src.api.routes import requests_router, sessions_router, bookings_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("🚀 KhidmatAI starting up — mock_mode=%s", settings.mock_mode)
    if not settings.mock_mode:
        try:
            await init_db()
            await seed_providers()
            logger.info("Database initialized and seeded.")
        except Exception as e:
            logger.warning("⚠️ Database initialization failed (e.g., greenlet DLL load error on Python 3.14). "
                           "Falling back to in-memory/JSON store for this run. Error: %s", e)
    else:
        logger.info("MOCK_MODE=True: Bypassing SQLite DB initialization (using JSON directly).")
    yield
    logger.info("KhidmatAI shutting down.")


app = FastAPI(
    title="KhidmatAI API",
    description="AI Service Orchestrator for Pakistan's Informal Economy",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(requests_router, prefix="/api/v1", tags=["requests"])
app.include_router(sessions_router, prefix="/api/v1", tags=["sessions"])
app.include_router(bookings_router, prefix="/api/v1", tags=["bookings"])


@app.get("/health")
async def health():
    return {"status": "ok", "service": "KhidmatAI", "mock_mode": settings.mock_mode}
