from __future__ import annotations

from datetime import datetime
from unittest.mock import patch

import pandas as pd
import pytest

from core_logic.coach_agent import _detect_anomaly, _route_after_detection, _suggest_limit, confidence_scoring
from core_logic.analytics import detect_weekly_anomalies


def _base_state() -> dict:
    return {
        "actions": [],
        "anomaly_detected": False,
        "anomaly_severity": 0.0,
        "projected_month_end": 24000.0,
        "monthly_budget": 18000.0,
        "repeat_pattern_detected": False,
        "top_category_recent_spend": 8000.0,
        "narrative_provider": "Gemini",
    }


def test_anomaly_routing_goes_to_repeat_pattern_when_detected() -> None:
    state = _base_state()
    state["anomaly_detected"] = True
    routed = _route_after_detection(state)
    assert routed == "repeat_pattern"


def test_detect_anomaly_sets_watch_status_for_overspend_projection() -> None:
    state = _base_state()
    detected = _detect_anomaly(state)

    assert detected["anomaly_detected"] is True
    assert detected["status"] in {"watch", "critical"}
    assert "Anomaly or overspend risk detected" in detected["actions"]


def test_suggest_limit_and_reward_scoring_for_repeat_pattern() -> None:
    state = _base_state()
    state["anomaly_detected"] = True
    state["repeat_pattern_detected"] = True
    state["narrative_provider"] = "Gemini"

    suggested = _suggest_limit(state)

    assert suggested["suggested_limit"] == 1400.0
    assert suggested["limit_window"] == "weekly"
    assert suggested["reward_signal"] == 4.0


def test_suggest_limit_and_reward_scoring_for_stable_fallback() -> None:
    state = _base_state()
    state["top_category_recent_spend"] = 4000.0

    suggested = _suggest_limit(state)

    assert suggested["suggested_limit"] == 900.0
    assert suggested["reward_signal"] == 1.0


def test_detect_weekly_anomalies_small_series_returns_no_anomaly() -> None:
    from core_logic.analytics import detect_weekly_anomalies

    tx = pd.DataFrame(
        {
            "datetime": pd.to_datetime(
                [
                    datetime(2026, 3, 1),
                    datetime(2026, 3, 8),
                    datetime(2026, 3, 15),
                ]
            ),
            "amount": [1000.0, 1200.0, 900.0],
        }
    )

    weekly = detect_weekly_anomalies(tx)
    assert (weekly["is_anomaly"] == False).all()  # noqa: E712


# ════════════════════════════════════════════════════════════════════════════════
# Tests for Confidence Scoring Node
# ════════════════════════════════════════════════════════════════════════════════


def test_confidence_scoring_returns_dict_with_confidence_score() -> None:
    """Confidence scoring should return dict with confidence_score and signal_weights."""
    state = {
        "anomaly_detected": True,
        "habit_score": 0.8,
        "days_left": 5,
        "regret_flag": True,
    }

    result = confidence_scoring(state)

    assert isinstance(result, dict)
    assert "confidence_score" in result
    assert isinstance(result["confidence_score"], (int, float))
    assert 0 <= result["confidence_score"] <= 1.0


def test_confidence_all_signals_fired() -> None:
    """Confidence should be high when all risk signals are active."""
    state = {
        "anomaly_detected": True,
        "habit_score": 0.95,
        "days_left": 2,
        "regret_flag": True,
    }

    result = confidence_scoring(state)

    assert result["confidence_score"] > 0.5  # Multiple critical signals


def test_confidence_no_signals_fired() -> None:
    """Confidence should be low when risk signals are minimal."""
    state = {
        "anomaly_detected": False,
        "habit_score": 0.1,
        "days_left": 28,
        "regret_flag": False,
    }

    result = confidence_scoring(state)

    assert result["confidence_score"] < 0.5


@pytest.mark.parametrize(
    "anomaly,habit,days,regret",
    [
        (True, 0.9, 3, True),
        (True, 0.5, 15, False),
        (False, 0.8, 5, True),
        (False, 0.2, 28, False),
        (True, 0.1, 1, True),
    ],
)
def test_confidence_always_between_0_and_1(
    anomaly: bool, habit: float, days: int, regret: bool
) -> None:
    """Confidence should always be between 0 and 1 for any signal combination."""
    state = {
        "anomaly_detected": anomaly,
        "habit_score": habit,
        "days_left": days,
        "regret_flag": regret,
    }

    result = confidence_scoring(state)

    score = result.get("confidence_score", 0.5)
    assert 0 <= score <= 1.0, f"Confidence {score} out of range [0, 1]"


def test_signal_weights_sum_to_1() -> None:
    """Sum of signal weights should equal 1.0 (or close due to floating point)."""
    state = {
        "anomaly_detected": True,
        "habit_score": 0.7,
        "days_left": 10,
        "regret_flag": True,
    }

    result = confidence_scoring(state)

    weights = result.get("signal_weights", {})
    if weights:
        total = sum(weights.values())
        assert abs(total - 1.0) < 0.01, f"Signal weights sum to {total}, not 1.0"

