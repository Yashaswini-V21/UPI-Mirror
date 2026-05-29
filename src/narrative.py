from __future__ import annotations

import json
import logging
import os
import re
import time
from dataclasses import dataclass
from typing import Any

DEFAULT_GEMINI_MODEL = "gemini-1.5-flash"
LOGGER = logging.getLogger(__name__)

# ── Resilience: circuit breaker + narrative cache ──────────────────────────────
try:
    from src.resilience import CircuitBreakerError, gemini_breaker, narrative_cache

    _RESILIENCE_AVAILABLE = True
except ImportError:  # pragma: no cover
    gemini_breaker = None  # type: ignore[assignment]
    narrative_cache = None  # type: ignore[assignment]
    CircuitBreakerError = Exception  # type: ignore[misc, assignment]
    _RESILIENCE_AVAILABLE = False

try:
    import google.generativeai as genai
    from google.generativeai.types import GenerationConfig
except ImportError:  # pragma: no cover - exercised when the dependency is unavailable.
    genai = None
    GenerationConfig = None

try:
    from google.api_core.exceptions import ResourceExhausted
except ImportError:  # pragma: no cover - exercised when google-api-core is unavailable.
    class ResourceExhausted(Exception):
        pass


@dataclass(slots=True)
class SpendingNarrative:
    text: str
    provider: str
    model: str
    used_fallback: bool


def _log_structured(level: int, event: str, **fields: Any) -> None:
    payload = {"event": event, **fields}
    LOGGER.log(level, json.dumps(payload, ensure_ascii=False, default=str, sort_keys=True))


def _coerce_float(value: Any, default: float = 0.0) -> float:
    try:
        if value is None:
            return default
        return float(value)
    except (TypeError, ValueError):
        return default


def _coerce_int(value: Any, default: int = 0) -> int:
    try:
        if value is None:
            return default
        return int(float(value))
    except (TypeError, ValueError):
        return default


def _money(value: Any) -> str:
    amount = round(_coerce_float(value, 0.0))
    return f"₹{amount:,}"


def _money_per_day(value: Any) -> str:
    return f"{_money(value)}/day"


def _habit_score_out_of_ten(state: dict[str, Any]) -> float:
    candidate = state.get("habit_score")
    if candidate is None:
        candidate = state.get("top_addiction_score")
    score = _coerce_float(candidate, 0.0)
    if score <= 1.0:
        score *= 10.0
    elif score > 10.0:
        score = score / 10.0
    return max(0.0, min(10.0, score))


def _top_category(state: dict[str, Any]) -> str:
    value = state.get("top_category")
    if value:
        return str(value).strip() or "discretionary spending"
    return "discretionary spending"


def _status(state: dict[str, Any]) -> str:
    value = str(state.get("status") or "watch").strip().lower()
    if value not in {"stable", "watch", "critical"}:
        return "watch"
    return value


def _urgency_for_status(status: str) -> str:
    return {"stable": "low", "watch": "medium", "critical": "high"}.get(status, "medium")


def _action_for_status(state: dict[str, Any], status: str) -> str:
    category = _top_category(state)
    cap = _money(state.get("suggested_cap", state.get("monthly_budget", 0)))
    if status == "critical":
        return f"Cut {category} to {cap} for the next 48 hours."
    if status == "stable":
        return f"Keep {category} at or below {cap} for the next 3 days."
    return f"Trim {category} to {cap} for the next 3 days."


def _tip_for_status(state: dict[str, Any], status: str) -> str:
    category = _top_category(state)
    days_left = _coerce_int(state.get("days_left"), 0)
    burn = _money_per_day(state.get("burn_rate_daily", 0))
    if status == "critical":
        return f"{category} is burning {burn}; stop it for {max(days_left, 1)} day(s)."
    if status == "stable":
        return f"{category} is under control; keep the next {max(days_left, 1)} day(s) disciplined."
    return f"Watch {category} closely; the current burn is {burn}."


def _fallback_confidence(state: dict[str, Any]) -> float:
    base = _coerce_float(state.get("confidence_score"), 0.62)
    return max(0.0, min(1.0, base))


def _build_prompt(state: dict[str, Any]) -> str:
    status = _status(state)
    days_left = _coerce_int(state.get("days_left"), 0)
    top_category = _top_category(state)
    habit_score = _habit_score_out_of_ten(state)
    anomaly_detected = bool(state.get("anomaly_detected"))
    suggested_cap = _money(state.get("suggested_cap", state.get("monthly_budget", 0)))
    burn_rate_daily = _money_per_day(state.get("burn_rate_daily", 0))

    good_example = (
        "GOOD:\n"
        "1. You have 4 days left and ₹18,000 in cap pressure.\n"
        f"2. {top_category} is the exact category causing the risk.\n"
        "3. Freeze {category} to ₹600 for the next 3 days."
    ).replace("{category}", top_category)
    bad_example = (
        "BAD:\n"
        "Your spending looks a little high, so maybe think about saving more.\n"
        "You could probably try to cut back if it feels right."
    )

    return (
        "You are Kira-AI, a blunt but useful spending coach. Write a direct, specific narrative for a user who uploaded transaction data.\n\n"
        f"status: {status}\n"
        f"days_left: {days_left}\n"
        f"top_category: {top_category}\n"
        f"habit_score: {habit_score:.1f}/10\n"
        f"anomaly_detected: {str(anomaly_detected).lower()}\n"
        f"suggested_cap: {suggested_cap}\n"
        f"burn_rate_daily: {burn_rate_daily}\n\n"
        "Hard rules:\n"
        "RULE 1: First sentence MUST include a specific ₹ amount or exact number of days.\n"
        f"RULE 2: Name the exact category: {top_category}. Never say 'your spending'.\n"
        "RULE 3: FORBIDDEN words: maybe, perhaps, consider, try, might, could, should think about.\n"
        "RULE 4: End with ONE action containing a ₹ amount and a time constraint.\n\n"
        "Style rules:\n"
        "- Keep it plain text.\n"
        "- Be direct, concrete, and short.\n"
        "- Mention the specific rupee amount, days left, and the category by exact name.\n"
        "- Do not mention uncertainty.\n\n"
        f"{good_example}\n\n"
        f"{bad_example}\n\n"
        "Write the narrative now."
    )


def _build_structured_prompt(state: dict[str, Any]) -> str:
    prompt = _build_prompt(state)
    return (
        f"{prompt}\n\n"
        "Return ONLY a raw JSON object with these keys exactly: narrative, action, urgency, tip.\n"
        "Do not wrap the JSON in markdown fences. Do not add commentary.\n"
        "Make sure the output is valid JSON and uses double quotes for all keys and strings."
    )


def _strip_json_fences(text: str) -> str:
    content = text.strip()
    if content.startswith("```"):
        content = re.sub(r"^```(?:json)?\s*", "", content, flags=re.IGNORECASE)
        content = re.sub(r"\s*```$", "", content)
    return content.strip()


def _template_narrative(state: dict[str, Any]) -> str:
    status = _status(state)
    category = _top_category(state)
    days_left = max(_coerce_int(state.get("days_left"), 0), 0)
    suggested_cap = _money(state.get("suggested_cap", state.get("monthly_budget", 0)))
    burn_rate_daily = _money_per_day(state.get("burn_rate_daily", 0))
    anomaly_detected = bool(state.get("anomaly_detected"))
    habit_score = _habit_score_out_of_ten(state)

    templates = {
        "stable": (
            f"{days_left} day(s) left and {suggested_cap} is enough if {category} stays controlled. "
            f"Habit score is {habit_score:.1f}/10 and the daily burn is {burn_rate_daily}. "
            f"Keep {category} at {suggested_cap} for the next 3 days."
        ),
        "watch": (
            f"{days_left} day(s) left and {category} is pushing the budget. "
            f"Habit score is {habit_score:.1f}/10, anomaly_detected is {str(anomaly_detected).lower()}, and daily burn is {burn_rate_daily}. "
            f"Reduce {category} to {suggested_cap} for the next 3 days."
        ),
        "critical": (
            f"Only {days_left} day(s) left and {category} is already above safe pace. "
            f"Habit score is {habit_score:.1f}/10 and the daily burn is {burn_rate_daily}. "
            f"Cut {category} to {suggested_cap} for the next 48 hours."
        ),
    }
    narrative = templates.get(status) or templates["watch"]
    return narrative.strip() or f"{days_left} day(s) left. Cut {category} to {suggested_cap} for the next 3 days."


def _structured_fallback(state: dict[str, Any]) -> dict[str, Any]:
    status = _status(state)
    return {
        "narrative": _template_narrative(state),
        "action": _action_for_status(state, status),
        "urgency": _urgency_for_status(status),
        "tip": _tip_for_status(state, status),
        "confidence_source": "fallback",
    }


def _build_generation_config() -> Any:
    if GenerationConfig is None:
        return {"temperature": 0.35, "max_output_tokens": 400, "top_p": 0.9}
    return GenerationConfig(temperature=0.35, max_output_tokens=400, top_p=0.9)


def _get_api_key() -> str | None:
    return (os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY") or "").strip() or None


def _create_model() -> Any:
    if genai is None:
        raise ImportError("google-generativeai is required for Gemini narrative generation")
    api_key = _get_api_key()
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY is not configured")
    genai.configure(api_key=api_key)
    return genai.GenerativeModel(DEFAULT_GEMINI_MODEL)


def _extract_text(response: Any) -> str:
    text = getattr(response, "text", None)
    if text:
        return str(text).strip()

    candidates = getattr(response, "candidates", None) or []
    chunks: list[str] = []
    for candidate in candidates:
        content = getattr(candidate, "content", None)
        parts = getattr(content, "parts", None) or []
        for part in parts:
            part_text = getattr(part, "text", None)
            if part_text:
                chunks.append(str(part_text))
    return "".join(chunks).strip()


def generate_narrative(coach_state: dict[str, Any]) -> str:
    """Generate a coaching narrative, with circuit breaker and TTL cache.

    Resolution order:
      1. Narrative cache hit (TTL 24h) — zero LLM cost
      2. Gemini API call (protected by circuit breaker + 3 retries)
      3. Template fallback (deterministic, always succeeds)
    """
    # ── 1. Check narrative cache ──────────────────────────────────────────────
    if _RESILIENCE_AVAILABLE and narrative_cache is not None:
        cached = narrative_cache.get(coach_state)
        if cached:
            _log_structured(
                logging.DEBUG,
                "narrative_cache_hit",
                top_category=_top_category(coach_state),
                status=_status(coach_state),
            )
            return cached

    # ── 2. Check circuit breaker state ───────────────────────────────────────
    if _RESILIENCE_AVAILABLE and gemini_breaker is not None:
        try:
            import pybreaker
            if gemini_breaker.current_state == pybreaker.STATE_OPEN:
                _log_structured(
                    logging.WARNING,
                    "narrative_fallback",
                    reason="circuit_breaker_open",
                    top_category=_top_category(coach_state),
                    status=_status(coach_state),
                )
                return _template_narrative(coach_state)
        except Exception as exc:
            LOGGER.debug("Could not check circuit breaker state: %s", exc)

    prompt = _build_prompt(coach_state)
    generation_config = _build_generation_config()
    api_key = _get_api_key()

    if genai is None or not api_key:
        _log_structured(
            logging.INFO,
            "narrative_fallback",
            reason="missing_gemini_dependency_or_key",
            top_category=_top_category(coach_state),
            status=_status(coach_state),
        )
        return _template_narrative(coach_state)

    try:
        model = _create_model()
    except Exception as exc:
        _log_structured(
            logging.WARNING,
            "narrative_fallback",
            reason="model_initialization_failed",
            error=str(exc),
            top_category=_top_category(coach_state),
        )
        return _template_narrative(coach_state)

    last_error: Exception | None = None
    for attempt in range(3):
        try:
            # Wrap API call in the circuit breaker
            if _RESILIENCE_AVAILABLE and gemini_breaker is not None:
                response = gemini_breaker.call(
                    model.generate_content, prompt, generation_config=generation_config
                )
            else:
                response = model.generate_content(prompt, generation_config=generation_config)

            text = _extract_text(response)
            if text:
                # Store in cache for future identical requests
                if _RESILIENCE_AVAILABLE and narrative_cache is not None:
                    narrative_cache.set(coach_state, text)
                return text

            last_error = RuntimeError("empty Gemini response")
            if attempt < 2:
                _log_structured(
                    logging.WARNING,
                    "narrative_retry",
                    attempt=attempt + 1,
                    reason="empty_response",
                    top_category=_top_category(coach_state),
                    status=_status(coach_state),
                )
                time.sleep(2**attempt)
                continue
            break
        except ResourceExhausted as exc:
            last_error = exc
            if attempt < 2:
                _log_structured(
                    logging.WARNING,
                    "narrative_retry",
                    attempt=attempt + 1,
                    reason="resource_exhausted",
                    error=str(exc),
                    top_category=_top_category(coach_state),
                    status=_status(coach_state),
                )
                time.sleep(2**attempt)
                continue
            break
        except CircuitBreakerError as exc:
            last_error = exc
            _log_structured(
                logging.WARNING,
                "narrative_fallback",
                reason="circuit_breaker_open",
                error=str(exc),
                top_category=_top_category(coach_state),
                status=_status(coach_state),
            )
            return _template_narrative(coach_state)
        except Exception as exc:
            last_error = exc
            _log_structured(
                logging.WARNING,
                "narrative_fallback",
                reason="gemini_request_failed",
                error=str(exc),
                top_category=_top_category(coach_state),
                status=_status(coach_state),
            )
            return _template_narrative(coach_state)

    _log_structured(
        logging.WARNING,
        "narrative_fallback",
        reason="retry_limit_exhausted",
        error=str(last_error) if last_error else None,
        top_category=_top_category(coach_state),
        status=_status(coach_state),
    )
    return _template_narrative(coach_state)


def generate_structured_narrative(coach_state: dict[str, Any]) -> dict[str, Any]:
    prompt = _build_structured_prompt(coach_state)
    generation_config = _build_generation_config()
    api_key = _get_api_key()

    if genai is None or not api_key:
        _log_structured(
            logging.INFO,
            "structured_narrative_fallback",
            reason="missing_gemini_dependency_or_key",
            top_category=_top_category(coach_state),
            status=_status(coach_state),
        )
        return _structured_fallback(coach_state)

    try:
        model = _create_model()
        response = model.generate_content(prompt, generation_config=generation_config)
        raw_text = _strip_json_fences(_extract_text(response))
        parsed = json.loads(raw_text)
        fallback = _structured_fallback(coach_state)
        result = {
            "narrative": str(parsed.get("narrative") or fallback["narrative"]),
            "action": str(parsed.get("action") or fallback["action"]),
            "urgency": str(parsed.get("urgency") or fallback["urgency"]),
            "tip": str(parsed.get("tip") or fallback["tip"]),
            "confidence_source": "gemini",
        }
        return result
    except json.JSONDecodeError as exc:
        _log_structured(
            logging.WARNING,
            "structured_narrative_fallback",
            reason="json_decode_error",
            error=str(exc),
            top_category=_top_category(coach_state),
            status=_status(coach_state),
        )
        return _structured_fallback(coach_state)
    except Exception as exc:
        _log_structured(
            logging.WARNING,
            "structured_narrative_fallback",
            reason="gemini_request_failed",
            error=str(exc),
            top_category=_top_category(coach_state),
            status=_status(coach_state),
        )
        return _structured_fallback(coach_state)


def generate_spending_narrative(
    context: dict[str, Any],
    *,
    model: str = DEFAULT_GEMINI_MODEL,
) -> SpendingNarrative:
    structured = generate_structured_narrative(context)
    used_fallback = structured.get("confidence_source") != "gemini"
    provider = "Gemini" if not used_fallback else "Rule-based fallback"
    model_name = model if not used_fallback else "deterministic-template"
    return SpendingNarrative(
        text=str(structured["narrative"]),
        provider=provider,
        model=model_name,
        used_fallback=used_fallback,
    )
