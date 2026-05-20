"""KhidmatAI application configuration — pydantic-settings based."""
from functools import lru_cache
from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    # ── App ──────────────────────────────────────────────────
    app_name: str = "KhidmatAI"
    app_version: str = "1.0.0"
    app_env: str = Field(default="development", env="APP_ENV")
    log_level: str = Field(default="INFO", env="LOG_LEVEL")

    # ── Mock mode (no real API calls) ────────────────────────
    mock_mode: bool = Field(default=True, env="MOCK_MODE")

    # ── LLM ──────────────────────────────────────────────────
    google_api_key: str = Field(default="", env="GOOGLE_API_KEY")
    gemini_model: str = Field(default="gemini-2.5-flash", env="GEMINI_MODEL")

    # ── OpenRouter ───────────────────────────────────────────
    openrouter_api_key: str = Field(default="", env="OPENROUTER_API_KEY")
    openrouter_base_url: str = Field(
        default="https://openrouter.ai/api/v1", env="OPENROUTER_BASE_URL"
    )

    # ── Database ─────────────────────────────────────────────
    database_url: str = Field(
        default="sqlite+aiosqlite:///./khidmatai.db", env="DATABASE_URL"
    )

    # ── Maps ─────────────────────────────────────────────────
    google_maps_api_key: str = Field(default="", env="GOOGLE_MAPS_API_KEY")

    # ── CORS ─────────────────────────────────────────────────
    cors_origins: list[str] = Field(
        default=["*"],
        env="CORS_ORIGINS",
    )

    # ── Agent tuning ─────────────────────────────────────────
    intent_confidence_threshold: float = 0.60
    max_provider_candidates: int = 20
    max_ranked_results: int = 5
    max_slot_suggestions: int = 3
    surge_cap_multiplier: float = 1.50  # anti-gouging: max 50% surge
    retry_max_attempts: int = 3

    class Config:
        import os
        env_file = os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env")
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
