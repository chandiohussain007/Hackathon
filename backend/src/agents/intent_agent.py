"""
KhidmatAI Intent Parsing Agent
Handles noisy multilingual input: Urdu, Roman Urdu, English, code-switched.
Mock mode: rule-based keyword extraction + confidence scoring.
Gemini mode: structured output with 20+ few-shot examples.
"""
from __future__ import annotations
import re
import logging
from datetime import datetime, timedelta
from src.agents.base_agent import KhidmatBaseAgent
from src.models.intent import (
    ParsedIntent, ServiceType, Urgency, ComplexityLevel, LanguageMix
)

logger = logging.getLogger(__name__)

# ── Roman Urdu / Mixed keyword dictionaries ───────────────────────────────────
SERVICE_KEYWORDS: dict[ServiceType, list[str]] = {
    ServiceType.PLUMBING:    ["plumber", "plumb", "pipe", "leakage", "leak", "tap", "nal", "nalka", "paani", "pani", "nashtar", "sewage", "drain"],
    ServiceType.ELECTRICAL:  ["electrician", "electric", "wiring", "bijli", "light", "switch", "socket", "short circuit", "fuse", "wire"],
    ServiceType.AC_SERVICE:  ["ac", "air condition", "a.c", "a/c", "cooling", "thanda", "ठंडा", "gas refill", "compressor", "hvac", "aircon"],
    ServiceType.CARPENTRY:   ["carpenter", "carpentry", "wood", "lakri", "lakdi", "furniture", "door", "darwaza", "almar", "almari"],
    ServiceType.PAINTING:    ["painter", "paint", "rang", "rung", "wall", "deewar", "polish"],
    ServiceType.CLEANING:    ["cleaning", "clean", "safai", "صفائی", "mop", "sweep", "dust", "jharu"],
    ServiceType.TUTORING:    ["tutor", "teacher", "ustani", "ustad", "padhai", "parhna", "math", "science", "english", "study", "homework", "lesson"],
    ServiceType.DRIVER:      ["driver", "drive", "car", "gaadi", "gari", "transport", "airport", "travel", "safar"],
    ServiceType.MAID:        ["maid", "maasi", "massi", "khana", "cook", "cooking", "ghar ka kaam", "domestic"],
    ServiceType.MECHANIC:    ["mechanic", "car repair", "engine", "gaadi kharab", "gari theek", "motor", "tyre", "battery"],
    ServiceType.BEAUTY:      ["beautician", "beauty", "salon", "mehndi", "makeup", "bridal", "facial"],
    ServiceType.PEST_CONTROL:["pest", "cockroach", "keeray", "spray", "termite", "rat", "chuha"],
}

URGENCY_KEYWORDS = {
    Urgency.EMERGENCY: ["abhi", "ابھی", "now", "emergency", "urgent", "foran", "فوری", "asap", "immediately", "jaldi", "bilkul abhi"],
    Urgency.URGENT:    ["aaj", "آج", "today", "same day", "jald", "jldi"],
    Urgency.NORMAL:    ["kal", "کل", "tomorrow", "aglay din", "next day", "subah", "صبح", "morning", "evening", "sham"],
    Urgency.FLEXIBLE:  ["is hafta", "this week", "kisi din", "any day", "flexible", "jab bhi"],
}

BUDGET_KEYWORDS = ["budget", "sasta", "ارزاں", "cheap", "affordable", "zyada nahi", "kam paise", "low cost", "thora"]
COMPLEXITY_KEYWORDS = {
    ComplexityLevel.COMPLEX: ["complex", "major", "bara", "بڑا", "full", "poora", "complete", "overhaul", "bilkul nahi chal raha"],
    ComplexityLevel.INTERMEDIATE: ["repair", "fix", "theek karo", "thodi", "problem", "issue", "kharab"],
}

URDU_SCRIPT_RE = re.compile(r'[\u0600-\u06FF]')
TIME_PATTERNS = {
    r'kal\s+subah|tomorrow\s+morning': ("08:00", 1),
    r'kal\s+sham|tomorrow\s+evening':  ("17:00", 1),
    r'aaj\s+subah|this\s+morning':     ("09:00", 0),
    r'aaj\s+sham|this\s+evening':      ("17:00", 0),
    r'(\d{1,2})\s*(baj|baje|am|pm|:00)': None,
}

CITY_KEYWORDS = {
    "karachi": ["karachi", "khi", "کراچی"],
    "hyderabad": ["hyderabad", "hyd", "حیدرآباد"],
    "islamabad": ["islamabad", "isb", "g-13", "g-11", "f-10", "e-11", "اسلام آباد"],
    "lahore": ["lahore", "lhr", "لاہور"],
}


class IntentParsingAgent(KhidmatBaseAgent):
    """
    Extracts structured intent from raw noisy multilingual text.

    Mock mode: deterministic keyword extraction with confidence scoring.
    Gemini mode: structured output using 20+ few-shot examples.
    """

    name = "IntentParsingAgent"
    description = "Parses multilingual service requests into structured JSON"

    async def _execute(self, state: dict) -> dict:
        from src.config import get_settings
        settings = get_settings()

        raw = state.get("raw_input", "")
        if settings.mock_mode:
            intent = self._parse_mock(raw)
        else:
            try:
                intent = await self._parse_with_llm(raw)
            except Exception as e:
                self._logger.warning(f"LLM parsing failed, falling back to rule-based: {e}")
                intent = self._parse_mock(raw)
                intent.fallback_used = True
                intent.fallback_reason = str(e)

        state["parsed_intent"] = intent.model_dump()
        state["intent_confidence"] = intent.confidence
        state["clarification_needed"] = intent.clarification_needed
        state["clarification_question"] = intent.clarification_question or ""
        state[f"{self.name}_reasoning"] = self._reasoning(intent)
        state[f"{self.name}_confidence"] = intent.confidence
        state[f"{self.name}_decision"] = {
            "service_type": intent.service_type.value,
            "urgency": intent.urgency.value,
            "city": intent.city,
            "complexity": intent.complexity.value,
            "confidence": intent.confidence,
        }
        return state

    async def _parse_with_llm(self, raw: str) -> ParsedIntent:
        from src.llm.router import TaskType
        prompt = f"""\
You are KhidmatAI's intent extraction agent specializing in Pakistan's multilingual service economy.
Parse the following noisy user request. Input may be Urdu script, Roman Urdu, English, code-switched, slang, or typos.

Rules:
1. Identify 'service_type' from: plumbing, electrical, ac_service, carpentry, painting, cleaning, tutoring, driver, maid, mechanic, beauty, pest_control, unknown
2. Identify 'urgency' from: emergency (abhi/now/asap), urgent (aaj/today), normal (kal/tomorrow), flexible
3. Extract 'city' and 'location_raw' — Pakistani cities/sectors like G-13, F-7, DHA etc.
4. Classify 'complexity': basic (minor fix), intermediate (repair), complex (major/full overhaul)
5. Detect 'language_mix': pure_urdu, roman_urdu, pure_english, code_switched, mixed
6. Score 'confidence' 0.0–1.0 based on how clearly the service and location were identified.
7. If confidence < 0.6, set clarification_needed=true and write clarification_question in same language as input.
8. Fill 'confidence_vector' with service/location/urgency sub-scores (0.0–1.0).

Few-shot examples:
Input: "AC bilkul kaam nahi kar raha, kal subah G-13 mein technician chahiye"
→ service_type=ac_service, urgency=normal, complexity=complex, city=islamabad, location_raw=G-13, language_mix=roman_urdu, confidence=0.92

Input: "bhai plummer chahye abhi ghr ka pipe leak ho rha hai"
→ service_type=plumbing, urgency=emergency, complexity=basic, city=unknown, language_mix=roman_urdu, confidence=0.78

Input: "مجھے فوری طور پر ایک الیکٹریشن چاہیے"
→ service_type=electrical, urgency=emergency, complexity=basic, language_mix=pure_urdu, confidence=0.85

Input: "I need someone to deep clean my house in DHA Karachi this weekend"
→ service_type=cleaning, urgency=flexible, complexity=intermediate, city=karachi, language_mix=pure_english, confidence=0.95

Now parse this input:
Input: "{raw}"
"""
        return await self._call_llm_json(TaskType.INTENT_PARSING, prompt, ParsedIntent)

    async def _parse_gemini(self, raw: str) -> ParsedIntent:
        """Legacy alias — now routes through ModelRouter."""
        return await self._parse_with_llm(raw)

    def _parse_mock(self, raw: str) -> ParsedIntent:
        text = raw.lower().strip()
        intent = ParsedIntent(raw_input=raw)

        # Language detection
        has_urdu_script = bool(URDU_SCRIPT_RE.search(raw))
        has_english = bool(re.search(r'[a-zA-Z]{3,}', raw))
        if has_urdu_script and has_english:
            intent.language_mix = LanguageMix.CODE_SWITCHED
        elif has_urdu_script:
            intent.language_mix = LanguageMix.PURE_URDU
            intent.original_script = True
        else:
            intent.language_mix = LanguageMix.ROMAN_URDU

        # Service type detection
        best_svc, best_count = ServiceType.UNKNOWN, 0
        for svc, keywords in SERVICE_KEYWORDS.items():
            count = sum(1 for kw in keywords if kw in text)
            if count > best_count:
                best_svc, best_count = svc, count
        intent.service_type = best_svc

        # Urgency
        for urgency, keywords in URGENCY_KEYWORDS.items():
            if any(kw in text for kw in keywords):
                intent.urgency = urgency
                break

        # Budget sensitivity
        intent.budget_sensitive = any(kw in text for kw in BUDGET_KEYWORDS)

        # Complexity
        for level, keywords in COMPLEXITY_KEYWORDS.items():
            if any(kw in text for kw in keywords):
                intent.complexity = level
                break

        # Location / city
        for city, keywords in CITY_KEYWORDS.items():
            if any(kw in text for kw in keywords):
                intent.city = city
                intent.location_raw = city
                intent.location_normalized = city.title()
                break
        if not intent.location_raw:
            state_val = self._extract_location(text)
            if state_val:
                intent.location_raw = state_val
                intent.location_normalized = state_val

        # Time resolution
        intent.preferred_time_iso = self._resolve_time(text)

        # Confidence scoring
        c_vector = {
            "service": 1.0 if best_count >= 2 else (0.7 if best_count == 1 else 0.0),
            "location": 0.9 if intent.city != "unknown" else 0.3,
            "urgency": 0.85 if intent.urgency != Urgency.NORMAL else 0.6,
        }
        intent.confidence_vector = c_vector
        intent.confidence = round(
            c_vector["service"] * 0.5 + c_vector["location"] * 0.3 + c_vector["urgency"] * 0.2, 3
        )

        # Low confidence fields
        if c_vector["service"] < 0.5:
            intent.low_confidence_fields.append("service_type")
        if c_vector["location"] < 0.5:
            intent.low_confidence_fields.append("location")

        # Clarification needed?
        if intent.confidence < 0.60 or intent.service_type == ServiceType.UNKNOWN:
            intent.clarification_needed = True
            intent.clarification_question = self._build_clarification(intent)

        intent.issue_description = raw
        return intent

    def _extract_location(self, text: str) -> str:
        # Try to extract block/sector patterns like G-13, F-7, E-11
        m = re.search(r'\b([A-Fa-f]-\d+)\b', text)
        if m:
            return m.group(1).upper()
        return ""

    def _resolve_time(self, text: str) -> str:
        now = datetime.now()
        for pattern, (hour_str, day_offset) in [
            (r'kal subah|tomorrow morning', ("09:00", 1)),
            (r'kal sham|tomorrow evening', ("17:00", 1)),
            (r'aaj subah|this morning',    ("09:00", 0)),
            (r'aaj sham|this evening',     ("17:00", 0)),
            (r'subah|morning',             ("09:00", 1)),
            (r'sham|evening',              ("17:00", 0)),
        ]:
            if re.search(pattern, text, re.IGNORECASE):
                target = now + timedelta(days=day_offset)
                h, m2 = map(int, hour_str.split(":"))
                return target.replace(hour=h, minute=m2, second=0, microsecond=0).isoformat()
        return (now + timedelta(days=1)).replace(hour=10, minute=0, second=0).isoformat()

    def _build_clarification(self, intent: ParsedIntent) -> str:
        if intent.service_type == ServiceType.UNKNOWN:
            return "Aap kaunsi service chahte hain? (Plumber, electrician, AC tech, tutor...)"
        if not intent.location_raw:
            return "Aap ka address ya area kya hai?"
        return "Kuch aur detail de sakte hain?"

    def _reasoning(self, intent: ParsedIntent) -> str:
        return (
            f"Detected service={intent.service_type.value} "
            f"(conf={intent.confidence_vector.get('service', 0):.2f}), "
            f"urgency={intent.urgency.value}, city={intent.city}, "
            f"budget_sensitive={intent.budget_sensitive}, "
            f"language={intent.language_mix.value}, "
            f"overall_confidence={intent.confidence:.2f}"
        )

    def _output_summary(self, state: dict) -> str:
        i = state.get("parsed_intent", {})
        return f"service={i.get('service_type')} loc={i.get('city')} conf={i.get('confidence', 0):.2f}"
