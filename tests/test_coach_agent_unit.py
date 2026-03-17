from __future__ import annotations

from datetime import datetime

import pandas as pd

from src.coach_agent import _detect_anomaly, _route_after_detection, _suggest_limit


def _base_state() -> dict:
    return {
        "actions": [],
        "anomaly_detected": False,
        "anomaly_severity": 0.0,
        "projected_month_end": 24000.0,
        "monthly_budget": 18000.0,
        "repeat_pattern_detected": False,
        "top_category_recent_spend": 8000.0,
        "narrative_provider": "Rule-based fallback",
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
    state["narrative_provider"] = "Groq"

    suggested = _suggest_limit(state)

    assert suggested["suggested_limit"] == 1400.0
    assert suggested["limit_window"] == "weekly"
    assert suggested["reward_signal"] == 5.0


def test_suggest_limit_and_reward_scoring_for_stable_fallback() -> None:
    state = _base_state()
    state["top_category_recent_spend"] = 4000.0

    suggested = _suggest_limit(state)

    assert suggested["suggested_limit"] == 900.0
    assert suggested["reward_signal"] == 1.0


def test_detect_weekly_anomalies_small_series_returns_no_anomaly() -> None:
    from src.analytics import detect_weekly_anomalies

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
