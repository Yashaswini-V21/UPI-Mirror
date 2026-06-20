"""src/utils.py
==============
Shared utility functions for Kira-AI.

Centralises type-coercion, clamping and normalisation helpers that were
previously duplicated across ``coach_agent.py`` and ``narrative.py``.
"""

from __future__ import annotations

from typing import Any


def coerce_float(value: Any, default: float = 0.0) -> float:
    """Safely convert *value* to float, returning *default* on failure.

    Handles ``None``, non-numeric strings, and objects that raise
    ``TypeError`` or ``ValueError`` on ``float()``.

    Args:
        value:   Value to convert.
        default: Fallback float if conversion fails.

    Returns:
        Converted float or *default*.
    """
    try:
        if value is None:
            return default
        return float(value)
    except (TypeError, ValueError):
        return default


def coerce_int(value: Any, default: int = 0) -> int:
    """Safely convert *value* to int (via float), returning *default* on failure.

    Args:
        value:   Value to convert.
        default: Fallback int if conversion fails.

    Returns:
        Converted int or *default*.
    """
    try:
        if value is None:
            return default
        return int(float(value))
    except (TypeError, ValueError):
        return default


def clamp(value: float, low: float = 0.0, high: float = 1.0) -> float:
    """Clamp *value* to the ``[low, high]`` interval.

    Args:
        value: Input value.
        low:   Lower bound (inclusive). Defaults to 0.0.
        high:  Upper bound (inclusive). Defaults to 1.0.

    Returns:
        *value* clamped between *low* and *high*.
    """
    return max(low, min(high, value))


def normalize_unit(value: Any) -> float:
    """Normalise a score to the [0, 1] range.

    Handles raw values on various scales:
      - Already in [0, 1] → returned as-is.
      - In (1, 100] → divided by 100.
      - Above 100 → divided by max(value, 100).

    Args:
        value: Numeric value to normalise.

    Returns:
        Float in [0.0, 1.0].
    """
    score = coerce_float(value, 0.0)
    if score > 1.0:
        if score <= 100.0:
            score = score / 100.0
        else:
            score = score / max(score, 100.0)
    return clamp(score)


def money(value: Any) -> str:
    """Format a numeric *value* as a ₹-prefixed amount string.

    Example: ``money(18000)`` → ``'₹18,000'``.
    """
    amount = round(coerce_float(value, 0.0))
    return f"₹{amount:,}"


def money_per_day(value: Any) -> str:
    """Format a numeric *value* as a ₹-per-day string.

    Example: ``money_per_day(600)`` → ``'₹600/day'``.
    """
    return f"{money(value)}/day"
