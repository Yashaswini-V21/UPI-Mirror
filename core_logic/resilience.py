"""
src/resilience.py
=================
Production resilience patterns for Kira-AI.

Provides:
- GeminiCircuitBreaker: stops hammering a failing LLM API automatically
- TwilioCircuitBreaker: same for WhatsApp delivery
- coach_result_cache: TTL-based cache for coach decisions (avoids recomputing)
- narrative_cache: 24h TTL cache for narrative text (same context = same text)

Usage:
    from core_logic.resilience import gemini_breaker, coach_cache

    # Wrap any Gemini call:
    with gemini_breaker:
        result = model.generate_content(prompt)

    # Cache coach results:
    cached = coach_cache.get(upload_id, budget)
    if cached is None:
        cached = run_coach(...)
        coach_cache.set(upload_id, budget, cached)
"""

from __future__ import annotations

import logging
import math
import threading
from typing import Any

LOGGER = logging.getLogger(__name__)

# ── pybreaker ──────────────────────────────────────────────────────────────────
try:
    import pybreaker

    _PYBREAKER_AVAILABLE = True
except ImportError:  # pragma: no cover
    pybreaker = None  # type: ignore[assignment]
    _PYBREAKER_AVAILABLE = False

# ── cachetools ─────────────────────────────────────────────────────────────────
try:
    from cachetools import TTLCache

    _CACHETOOLS_AVAILABLE = True
except ImportError:  # pragma: no cover
    TTLCache = None  # type: ignore[assignment]
    _CACHETOOLS_AVAILABLE = False


# ─────────────────────────────────────────────────────────────────────────────
# CIRCUIT BREAKER LISTENER
# ─────────────────────────────────────────────────────────────────────────────

class _MetricsListener:
    """Hooks circuit state changes into the Prometheus metrics system."""

    def __init__(self, name: str) -> None:
        self._name = name

    def before_call(self, cb: Any, func: Any, *args: Any, **kwargs: Any) -> None:  # noqa: ANN401
        pass

    def call_succeeded(self, cb: Any, func: Any, *args: Any, **kwargs: Any) -> None:  # noqa: ANN401
        pass

    def call_failed(self, cb: Any, func: Any, exc: BaseException, *args: Any, **kwargs: Any) -> None:  # noqa: ANN401
        LOGGER.warning("circuit_breaker_failure", extra={"circuit": self._name, "error": str(exc)})

    def state_change(self, cb: Any, old_state: Any, new_state: Any) -> None:
        LOGGER.warning(
            "circuit_breaker_state_change",
            extra={"circuit": self._name, "from": str(old_state), "to": str(new_state)},
        )
        # Import lazily to avoid circular imports
        try:
            from core_logic.observability import METRICS

            if str(new_state).lower() == "open":
                METRICS.narrative_circuit_open_total.inc()
        except Exception as exc:  # pragma: no cover
            LOGGER.debug("Failed to update metrics for circuit state change: %s", exc)


class _NoOpBreaker:
    """Fallback when pybreaker is not installed — passes all calls through."""

    class _NoOpCtx:
        def __enter__(self) -> "_NoOpBreaker._NoOpCtx":
            return self

        def __exit__(self, *_: Any) -> None:
            pass

    def __enter__(self) -> "_NoOpBreaker._NoOpCtx":
        return self._NoOpCtx()

    def __exit__(self, *_: Any) -> None:
        pass

    def call(self, func: Any, *args: Any, **kwargs: Any) -> Any:  # noqa: ANN401
        return func(*args, **kwargs)


def _make_breaker(name: str, fail_max: int = 5, reset_timeout: int = 60) -> Any:
    if not _PYBREAKER_AVAILABLE:
        return _NoOpBreaker()
    listener = _MetricsListener(name)
    return pybreaker.CircuitBreaker(
        fail_max=fail_max,
        reset_timeout=reset_timeout,
        listeners=[listener],
        name=name,
    )


# Global circuit breakers
gemini_breaker: Any = _make_breaker("gemini", fail_max=5, reset_timeout=60)
twilio_breaker: Any = _make_breaker("twilio", fail_max=3, reset_timeout=120)
resend_breaker: Any = _make_breaker("resend", fail_max=3, reset_timeout=120)

# Expose CircuitBreakerError so callers can catch it without importing pybreaker
if _PYBREAKER_AVAILABLE:
    CircuitBreakerError = pybreaker.CircuitBreakerError
else:
    class CircuitBreakerError(Exception):  # type: ignore[no-redef]
        pass


# ─────────────────────────────────────────────────────────────────────────────
# COACH RESULT CACHE
# ─────────────────────────────────────────────────────────────────────────────

class _SimpleDict:
    """Thread-safe dict fallback when cachetools is unavailable."""

    def __init__(self) -> None:
        self._data: dict[str, Any] = {}
        self._lock = threading.RLock()

    def get(self, key: str) -> Any:
        with self._lock:
            return self._data.get(key)

    def __setitem__(self, key: str, value: Any) -> None:
        with self._lock:
            # Cap at 200 entries to avoid unbounded growth
            if len(self._data) >= 200:
                oldest = next(iter(self._data))
                del self._data[oldest]
            self._data[key] = value

    def __contains__(self, key: str) -> bool:
        with self._lock:
            return key in self._data

    def __delitem__(self, key: str) -> None:
        with self._lock:
            if key in self._data:
                del self._data[key]


class CoachResultCache:
    """TTL cache for coach computation results.

    Key: (upload_id, budget_bucket) where budget_bucket is budget rounded
    to nearest ₹100 for stable cache keys despite minor frontend rounding.

    TTL: 1 hour (coach runs are expensive LLM + ML computation)
    Max size: 500 entries
    Thread-safe: uses RLock
    """

    _BUCKET_SIZE = 100  # Round budget to nearest ₹100

    def __init__(self, maxsize: int = 500, ttl: int = 3600) -> None:
        self._lock = threading.RLock()
        if _CACHETOOLS_AVAILABLE and TTLCache is not None:
            self._cache: Any = TTLCache(maxsize=maxsize, ttl=ttl)
        else:
            self._cache = _SimpleDict()

    def _key(self, upload_id: str, budget: float) -> str:
        bucket = math.floor(budget / self._BUCKET_SIZE) * self._BUCKET_SIZE
        return f"{upload_id}::{bucket}"

    def get(self, upload_id: str, budget: float) -> Any | None:
        key = self._key(upload_id, budget)
        with self._lock:
            return self._cache.get(key)

    def set(self, upload_id: str, budget: float, result: Any) -> None:
        key = self._key(upload_id, budget)
        with self._lock:
            self._cache[key] = result

    def invalidate(self, upload_id: str) -> None:
        """Invalidate all cache entries for a given upload_id."""
        with self._lock:
            keys_to_delete = [k for k in getattr(self._cache, "_data", {}) if k.startswith(f"{upload_id}::")]
            for key in keys_to_delete:
                try:
                    del self._cache[key]
                except (KeyError, TypeError):
                    pass


class NarrativeCache:
    """24h TTL cache for narrative text.

    The same coach state + status should always produce the same narrative.
    Caching eliminates redundant LLM calls on repeated identical requests.

    Key: (status, top_category, days_left_bucket, budget_bucket)
    TTL: 24 hours
    Max size: 200 entries
    """

    def __init__(self, maxsize: int = 200, ttl: int = 86400) -> None:
        self._lock = threading.RLock()
        if _CACHETOOLS_AVAILABLE and TTLCache is not None:
            self._cache: Any = TTLCache(maxsize=maxsize, ttl=ttl)
        else:
            self._cache = _SimpleDict()

    def _key(self, coach_state: dict[str, Any]) -> str:
        status = str(coach_state.get("status", "watch"))
        category = str(coach_state.get("top_category", "Essentials"))
        days = int(coach_state.get("days_left", 0) or 0)
        days_bucket = (days // 5) * 5  # Round to nearest 5 days
        budget = float(coach_state.get("monthly_budget", 0) or 0)
        budget_bucket = math.floor(budget / 1000) * 1000  # Round to nearest ₹1000
        return f"{status}::{category}::{days_bucket}::{budget_bucket}"

    def get(self, coach_state: dict[str, Any]) -> str | None:
        key = self._key(coach_state)
        with self._lock:
            result = self._cache.get(key)
            return str(result) if result is not None else None

    def set(self, coach_state: dict[str, Any], narrative: str) -> None:
        key = self._key(coach_state)
        with self._lock:
            self._cache[key] = narrative


# Global cache singletons
coach_cache = CoachResultCache(maxsize=500, ttl=3600)
narrative_cache = NarrativeCache(maxsize=200, ttl=86400)
