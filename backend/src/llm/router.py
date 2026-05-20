"""
KhidmatAI ModelRouter
======================
Provider-agnostic LLM abstraction layer.
Routes different agent task types to the most appropriate
free model via OpenRouter, with automatic fallback to Gemini.

Design: model selection is data-driven (config/models.md-style),
NOT hardcoded into individual agent files.
"""
from __future__ import annotations
import json
import logging
import asyncio
from enum import Enum
from typing import Optional, Type, TypeVar
from pydantic import BaseModel
import httpx

from src.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

T = TypeVar("T", bound=BaseModel)

OPENROUTER_BASE = "https://openrouter.ai/api/v1/chat/completions"


class TaskType(str, Enum):
    """Agent task types used to select the right model."""
    INTENT_PARSING    = "intent_parsing"     # multilingual Urdu/Roman Urdu
    PROVIDER_RANKING  = "provider_ranking"   # agentic reasoning
    DISPUTE_CLASSIFY  = "dispute_classify"   # frontier reasoning
    SCHEDULING        = "scheduling"         # structured logic
    FAST_UTILITY      = "fast_utility"       # low-latency utility
    GENERAL           = "general"            # fallback


# ── Model routing table ────────────────────────────────────────────────────────
# Source: models.md — all free models via OpenRouter
MODEL_ROUTE: dict[TaskType, str] = {
    TaskType.INTENT_PARSING:   "meta-llama/llama-3.3-70b-instruct",  # strong multilingual
    TaskType.PROVIDER_RANKING: "qwen/qwen3-235b-a22b",               # agentic workflows
    TaskType.DISPUTE_CLASSIFY: "nousresearch/hermes-3-405b-instruct", # frontier reasoning
    TaskType.SCHEDULING:       "liquid/lfm2.5-1.2b-thinking",        # fast reasoning
    TaskType.FAST_UTILITY:     "liquid/lfm2.5-1.2b-instruct",        # low latency
    TaskType.GENERAL:          "google/gemma-3-27b-it",              # reliable fallback
}

# Fallback cascade: if primary model fails, try these in order
FALLBACK_MODELS = [
    "google/gemma-3-27b-it",
    "meta-llama/llama-3.2-3b-instruct",
]

SYSTEM_PROMPT = (
    "You are KhidmatAI, an intelligent service orchestration agent for Pakistan's "
    "informal economy. Always respond with valid JSON exactly matching the requested schema. "
    "Never add commentary outside the JSON. Support multilingual inputs in "
    "Urdu script, Roman Urdu, English, and code-switched text."
)


class ModelRouter:
    """
    Routes LLM calls to the appropriate model based on task type.
    Uses OpenRouter as the primary provider (free models).
    Falls back to Gemini if OpenRouter is unavailable.
    Enforces structured JSON output via schema-constrained prompting.
    """

    def __init__(self):
        self._api_key = settings.openrouter_api_key
        self._timeout = httpx.Timeout(30.0, connect=5.0)

    async def call_json(
        self,
        task: TaskType,
        prompt: str,
        schema: Type[T],
        *,
        model_override: Optional[str] = None,
        temperature: float = 0.1,
        max_tokens: int = 2048,
    ) -> T:
        """
        Call the appropriate model and return a validated Pydantic object.

        Args:
            task: TaskType enum - determines which model to use
            prompt: The task prompt (will be wrapped with schema instruction)
            schema: Pydantic model class for structured output validation
            model_override: Optional specific model to use instead of routing
            temperature: LLM temperature (low for structured outputs)
            max_tokens: Max tokens to generate

        Returns:
            Validated Pydantic model instance

        Raises:
            ValueError: If all models fail and no fallback succeeds
        """
        model = model_override or MODEL_ROUTE.get(task, MODEL_ROUTE[TaskType.GENERAL])
        schema_json = json.dumps(schema.model_json_schema(), indent=2)

        full_prompt = (
            f"Respond ONLY with a valid JSON object strictly matching this JSON Schema:\n"
            f"```json\n{schema_json}\n```\n\n"
            f"Task:\n{prompt}"
        )

        # Bypass OpenRouter if key is missing or is the revoked/blocked key
        is_key_blocked = not self._api_key or self._api_key.startswith("sk-or-v1-ae16c844")
        if is_key_blocked:
            if settings.google_api_key:
                logger.info("ModelRouter: OpenRouter key is missing/revoked. Routing directly to Gemini.")
                return await self._call_gemini_fallback(full_prompt, schema)
            else:
                raise ValueError("ModelRouter: Both OpenRouter and Gemini API keys are missing/invalid")

        # Try primary model, then fallbacks
        models_to_try = [model] + [m for m in FALLBACK_MODELS if m != model]

        last_error: Optional[Exception] = None
        for attempt_model in models_to_try:
            try:
                raw = await self._call_openrouter(
                    attempt_model, full_prompt, temperature, max_tokens
                )
                return schema.model_validate_json(raw)
            except Exception as e:
                logger.warning(
                    "ModelRouter: model=%s task=%s failed: %s — trying next",
                    attempt_model, task.value, e
                )
                last_error = e

        # Final fallback: Gemini if key is available
        if settings.google_api_key:
            try:
                return await self._call_gemini_fallback(full_prompt, schema)
            except Exception as e:
                logger.error("ModelRouter: Gemini fallback also failed: %s", e)
                last_error = e

        raise ValueError(
            f"ModelRouter: all models failed for task={task.value}. "
            f"Last error: {last_error}"
        )

    async def _call_openrouter(
        self,
        model: str,
        prompt: str,
        temperature: float,
        max_tokens: int,
    ) -> str:
        """Make an OpenRouter API call and return raw text content."""
        if not self._api_key:
            raise ValueError("OPENROUTER_API_KEY not configured")

        headers = {
            "Authorization": f"Bearer {self._api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://khidmatai.pk",
            "X-Title": "KhidmatAI Orchestrator",
        }
        payload = {
            "model": model,
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user",   "content": prompt},
            ],
            "temperature": temperature,
            "max_tokens": max_tokens,
            "response_format": {"type": "json_object"},
        }

        async with httpx.AsyncClient(timeout=self._timeout) as client:
            resp = await client.post(OPENROUTER_BASE, headers=headers, json=payload)
            resp.raise_for_status()
            data = resp.json()

        content = data["choices"][0]["message"]["content"]
        logger.debug("ModelRouter raw response (model=%s): %s", model, content[:200])
        return content

    async def _call_gemini_fallback(self, prompt: str, schema: Type[T]) -> T:
        """Fallback to Gemini when OpenRouter is unavailable."""
        import google.generativeai as genai
        genai.configure(api_key=settings.google_api_key)
        model = genai.GenerativeModel(
            model_name=settings.gemini_model,
            system_instruction=SYSTEM_PROMPT,
        )
        response = await model.generate_content_async(
            prompt,
            generation_config=genai.types.GenerationConfig(
                response_mime_type="application/json",
            ),
        )
        return schema.model_validate_json(response.text)


# Module-level singleton — import and use directly
_router: Optional[ModelRouter] = None


def get_model_router() -> ModelRouter:
    """Get or create the singleton ModelRouter instance."""
    global _router
    if _router is None:
        _router = ModelRouter()
    return _router
