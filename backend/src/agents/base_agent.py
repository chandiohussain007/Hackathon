"""
KhidmatAI BaseAgent
Follows ADK's BaseAgent pattern. Agents use ModelRouter for LLM calls —
model selection is task-driven, not hardcoded.
"""
from __future__ import annotations
import time
import json
import logging
from typing import Optional, Type, TypeVar
from pydantic import BaseModel
from src.traces.logger import TraceLogger
from src.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

T = TypeVar('T', bound=BaseModel)


class KhidmatBaseAgent:
    """
    Abstract base for all KhidmatAI agents.

    ADK integration note:
    - In full ADK mode, this inherits from google.adk.agents.BaseAgent
      and implements _run_async_impl as an AsyncGenerator[Event, None].
    - In current mode it's a plain async callable that reads/writes
      session.state and emits trace steps.
    - LLM calls go through ModelRouter for provider-agnostic routing.
    """

    name: str = "BaseAgent"
    description: str = "KhidmatAI base agent"

    def __init__(self, name: Optional[str] = None):
        if name:
            self.name = name
        self._logger = logging.getLogger(self.name)

    async def run(self, state: dict) -> dict:
        """Execute agent logic. Reads from and writes to state dict."""
        tracer = TraceLogger(state.get("session_id", ""), state)
        tracer.start(self.name.lower(), self.name, input_summary=self._input_summary(state))
        try:
            updated = await self._execute(state)
            tracer.complete(
                self.name.lower(), self.name,
                reasoning=state.get(f"{self.name}_reasoning", ""),
                decision=state.get(f"{self.name}_decision", {}),
                confidence=state.get(f"{self.name}_confidence", 0.0),
                output_summary=self._output_summary(state),
                fallback_used=state.get(f"{self.name}_fallback", False),
            )
            return updated
        except Exception as exc:
            tracer.fail(self.name.lower(), self.name, str(exc))
            self._logger.exception("Agent %s failed: %s", self.name, exc)
            state[f"{self.name}_error"] = str(exc)
            return await self._fallback(state)

    async def _execute(self, state: dict) -> dict:
        """Override in subclasses."""
        raise NotImplementedError

    async def _call_llm_json(
        self,
        task_type,
        prompt: str,
        schema: Type[T],
        *,
        model_override: Optional[str] = None,
        temperature: float = 0.1,
    ) -> T:
        """
        Call the ModelRouter for a structured JSON LLM response.
        Automatically selects the best model for the given task type.
        Falls back to Gemini if OpenRouter is unavailable.
        """
        from src.llm.router import get_model_router
        router = get_model_router()
        return await router.call_json(
            task=task_type,
            prompt=prompt,
            schema=schema,
            model_override=model_override,
            temperature=temperature,
        )

    # Keep legacy Gemini method for backward compatibility
    async def _call_gemini_json(self, prompt: str, schema: Type[T]) -> T:
        """Legacy method — routes through ModelRouter with Gemini fallback."""
        from src.llm.router import TaskType
        return await self._call_llm_json(TaskType.GENERAL, prompt, schema)

    async def _fallback(self, state: dict) -> dict:
        """Default fallback: mark fallback flag and return state unchanged."""
        state["fallback_activated"] = True
        state[f"{self.name}_fallback"] = True
        return state

    def _input_summary(self, state: dict) -> str:
        return state.get("raw_input", "")[:200]

    def _output_summary(self, state: dict) -> str:
        return ""
