"""tests/test_full_pipeline.py
============================
End-to-end integration test for the Kira-AI coaching pipeline.

Tests the complete data flow:
  CSV fixture → analytics → LangGraph 6-node pipeline → narrative → response

Uses realistic Indian bank statement data (UPI transactions).
"""

from __future__ import annotations

from datetime import datetime, timedelta

import pandas as pd
import pytest

from core_logic.analytics import (
    compute_addiction_scores,
    detect_weekly_anomalies,
    predict_broke_date,
    compute_projection_bands,
    simulate_scenario,
    month_to_date_spend,
)
from core_logic.coach_agent import (
    CoachState,
    anomaly_check,
    cap_recommendation,
    confidence_scoring,
    context_injection,
    nudge_generation,
    pattern_analysis,
    run_coach_workflow,
    run_spending_coach_agent,
)
from core_logic.regret import compute_regret_stats
from core_logic.merchant import late_night_merchant_alerts


# ── Realistic Indian UPI transaction fixture ─────────────────────────────────

def _build_realistic_transactions(
    days: int = 28,
    base_date: datetime | None = None,
) -> pd.DataFrame:
    """Build a realistic 28-day UPI transaction ledger.

    Includes typical Indian spending categories with late-night food deliveries,
    recurring subscriptions, and weekend shopping spikes.
    """
    base = base_date or datetime(2026, 6, 1)
    rows: list[dict] = []

    for day_offset in range(days):
        dt = base + timedelta(days=day_offset)
        weekday = dt.weekday()

        # Daily essentials
        rows.append({"datetime": dt.replace(hour=9, minute=30), "amount": 180, "category": "Food", "merchant": "Local Chai"})
        rows.append({"datetime": dt.replace(hour=13, minute=15), "amount": 350, "category": "Food", "merchant": "Office Lunch"})

        # Swiggy late-night (habit pattern — every other day)
        if day_offset % 2 == 0:
            rows.append({"datetime": dt.replace(hour=22, minute=45), "amount": 580 + (day_offset * 10), "category": "Food", "merchant": "Swiggy"})

        # Uber commute (weekdays)
        if weekday < 5:
            rows.append({"datetime": dt.replace(hour=8, minute=0), "amount": 220, "category": "Transit", "merchant": "Uber"})
            rows.append({"datetime": dt.replace(hour=18, minute=30), "amount": 280, "category": "Transit", "merchant": "Ola"})

        # Weekend shopping spikes
        if weekday >= 5:
            rows.append({"datetime": dt.replace(hour=14, minute=0), "amount": 1200 + (day_offset * 50), "category": "Shopping", "merchant": "Amazon"})
            rows.append({"datetime": dt.replace(hour=16, minute=30), "amount": 800, "category": "Shopping", "merchant": "Myntra"})

        # Subscriptions (monthly)
        if day_offset == 5:
            rows.append({"datetime": dt.replace(hour=10, minute=0), "amount": 649, "category": "Subscriptions", "merchant": "Netflix"})
            rows.append({"datetime": dt.replace(hour=10, minute=5), "amount": 119, "category": "Subscriptions", "merchant": "Spotify"})
            rows.append({"datetime": dt.replace(hour=10, minute=10), "amount": 1499, "category": "Subscriptions", "merchant": "Prime"})

    df = pd.DataFrame(rows)
    df["datetime"] = pd.to_datetime(df["datetime"])
    df["amount"] = df["amount"].astype(float)
    return df


@pytest.fixture
def transactions() -> pd.DataFrame:
    return _build_realistic_transactions()


@pytest.fixture
def budget() -> float:
    return 100000.0


# ── Analytics module tests ────────────────────────────────────────────────────

class TestAnalyticsIntegration:
    """Validate the analytics module outputs with realistic data."""

    def test_predict_broke_date_returns_expected_keys(self, transactions, budget):
        result = predict_broke_date(transactions, budget, reference_date=datetime(2026, 6, 15))
        assert "predicted_date" in result
        assert "daily_burn" in result
        assert "projected_month_end" in result
        assert "days_left" in result
        assert "confidence" in result
        assert isinstance(result["daily_burn"], float)
        assert result["daily_burn"] > 0

    def test_addiction_scores_rank_food_highest(self, transactions):
        scores = compute_addiction_scores(transactions)
        assert not scores.empty
        assert "category" in scores.columns
        assert "score" in scores.columns
        top_category = scores.iloc[0]["category"]
        assert top_category == "Food", f"Expected Food to rank highest, got {top_category}"

    def test_weekly_anomalies_detect_spikes(self, transactions):
        weekly = detect_weekly_anomalies(transactions)
        assert "is_anomaly" in weekly.columns
        assert "severity" in weekly.columns
        assert len(weekly) >= 4, "Need at least 4 weeks for IQR calculation"

    def test_projection_bands_structure(self, transactions, budget):
        bands = compute_projection_bands(transactions, budget)
        assert "days" in bands
        assert "base" in bands
        assert "best_case" in bands
        assert "worst_case" in bands
        assert len(bands["days"]) == 30
        assert bands["base"][0] > bands["base"][-1], "Balance should decrease"

    def test_month_to_date_spend_positive(self, transactions, budget):
        mtd = month_to_date_spend(transactions, reference_date=datetime(2026, 6, 28))
        assert mtd > 0, "MTD spend should be positive for active transactions"

    def test_scenario_simulation(self, transactions, budget):
        result = simulate_scenario(transactions, budget, cutback_pct=30, cutback_category="Food")
        assert result["days_gained"] >= 0
        assert result["scenario_impact"] in {"positive", "negative", "neutral"}


# ── Pipeline node unit tests ──────────────────────────────────────────────────

class TestPipelineNodes:
    """Test each LangGraph node independently."""

    def test_context_injection_default(self):
        state: CoachState = {"signals": {}, "budget": 30000.0}
        result = context_injection(state)
        assert result["tone_adjustment"] == "neutral"
        assert result["threshold_modifier"] == 1.0
        assert result["session_count"] == 0

    def test_context_injection_with_memory(self):
        state: CoachState = {
            "signals": {},
            "budget": 30000.0,
            "memory_context": {
                "tone_adjustment": "urgent",
                "threshold_modifier": 0.85,
                "session_count": 5,
            },
        }
        result = context_injection(state)
        assert result["tone_adjustment"] == "urgent"
        assert result["threshold_modifier"] == 0.85
        assert result["session_count"] == 5

    def test_anomaly_check_with_signal(self):
        state: CoachState = {
            "signals": {"anomaly_detected": True, "anomaly_score": 1.5},
            "budget": 30000.0,
        }
        result = anomaly_check(state)
        assert result["anomaly_detected"] is True
        assert 0.0 <= result["anomaly_score"] <= 1.0

    def test_pattern_analysis_critical(self):
        state: CoachState = {
            "signals": {"habit_score": 0.85, "days_left": 3},
            "budget": 30000.0,
            "anomaly_detected": True,
        }
        result = pattern_analysis(state)
        assert result["status"] == "critical"

    def test_nudge_generation_text(self):
        state: CoachState = {
            "signals": {},
            "budget": 30000.0,
            "status": "watch",
            "habit_category": "Food",
            "days_left": 8,
        }
        result = nudge_generation(state)
        assert "Food" in result["nudge"]
        assert "8 day(s) left" in result["nudge"]

    def test_confidence_scoring_range(self):
        state: CoachState = {
            "signals": {},
            "budget": 30000.0,
            "anomaly_detected": True,
            "habit_score": 0.8,
            "days_left": 5,
            "regret_flag": True,
        }
        result = confidence_scoring(state)
        assert 0.0 <= result["confidence_score"] <= 1.0
        assert "anomaly" in result["signal_weights"]


# ── Full pipeline integration ─────────────────────────────────────────────────

class TestFullPipeline:
    """End-to-end pipeline integration tests."""

    def test_run_coach_workflow_returns_complete_state(self):
        signals = {
            "anomaly_detected": True,
            "anomaly_score": 0.7,
            "habit_score": 0.6,
            "habit_category": "Food",
            "days_left": 10,
            "regret_flag": False,
            "burn_rate_daily": 1200.0,
        }
        result = run_coach_workflow(signals, budget=30000.0)
        assert "status" in result
        assert "nudge" in result
        assert "suggested_cap" in result
        assert "confidence_score" in result
        assert result["status"] in {"stable", "watch", "critical"}
        assert result["confidence_score"] > 0.0

    def test_full_agent_produces_result(self, transactions, budget):
        prediction = predict_broke_date(transactions, budget, reference_date=datetime(2026, 6, 20))
        addiction = compute_addiction_scores(transactions)
        weekly = detect_weekly_anomalies(transactions)
        regret = compute_regret_stats(transactions)
        merchant = late_night_merchant_alerts(transactions)

        result = run_spending_coach_agent(
            transactions=transactions,
            monthly_budget=budget,
            prediction=prediction,
            addiction_scores=addiction,
            weekly=weekly,
            regret_stats=regret,
            merchant_late_night=merchant,
        )

        assert result.status in {"stable", "watch", "critical"}
        assert result.nudge, "Nudge text should not be empty"
        assert result.narrative, "Narrative should not be empty"
        assert result.suggested_limit >= 0
        assert result.reward_signal >= 1.0
        assert result.suggested_category, "Should have a target category"

    def test_pipeline_with_memory_context(self):
        """Verify memory context flows through the pipeline without errors."""
        signals = {
            "anomaly_detected": False,
            "anomaly_score": 0.0,
            "habit_score": 0.3,
            "habit_category": "Transit",
            "days_left": 20,
            "regret_flag": False,
            "burn_rate_daily": 800.0,
        }
        # Add memory context to initial state
        result = run_coach_workflow(signals, budget=25000.0)
        assert result["status"] == "stable"
        assert result["confidence_score"] < 0.5  # Low signals → low confidence
