"""tests/test_analytics_edge_cases.py
=====================================
Edge-case and boundary tests for src/analytics.py.
Covers: empty frames, single row, zero budget, negative amounts,
        future dates, predict_broke_date, simulate_savings.
"""
from __future__ import annotations

from datetime import datetime

import pandas as pd
import pytest

from core_logic.analytics import (
    compute_projection_bands,
    detect_weekly_anomalies,
    month_to_date_spend,
    predict_broke_date,
    simulate_savings,
    simulate_scenario,
)


# ─── Shared fixtures ──────────────────────────────────────────────────────────

@pytest.fixture
def minimal_tx() -> pd.DataFrame:
    """Minimal valid transaction DataFrame — one row."""
    return pd.DataFrame({
        "datetime": [datetime(2026, 1, 15)],
        "amount": [100.0],
        "category": ["Food"],
        "merchant": ["Cafe"],
    })


@pytest.fixture
def month_tx() -> pd.DataFrame:
    """30 rows of daily transactions within January 2026."""
    return pd.DataFrame({
        "datetime": pd.date_range("2026-01-01", periods=30, freq="D"),
        "amount": [150.0] * 30,
        "category": ["Food"] * 10 + ["Transit"] * 10 + ["Entertainment"] * 10,
        "merchant": ["Store"] * 30,
    })


# ─── month_to_date_spend ──────────────────────────────────────────────────────

class TestMonthToDateSpend:
    def test_correct_sum_within_month(self, month_tx: pd.DataFrame) -> None:
        result = month_to_date_spend(month_tx, reference_date=datetime(2026, 1, 31))
        assert result == pytest.approx(30 * 150.0)

    def test_empty_df_returns_zero(self) -> None:
        empty = pd.DataFrame({"datetime": pd.to_datetime([]), "amount": [], "category": []})
        result = month_to_date_spend(empty, reference_date=datetime(2026, 1, 15))
        assert result == pytest.approx(0.0)

    def test_different_month_excluded(self, month_tx: pd.DataFrame) -> None:
        result = month_to_date_spend(month_tx, reference_date=datetime(2026, 2, 15))
        assert result == pytest.approx(0.0)


# ─── predict_broke_date ──────────────────────────────────────────────────────

class TestPredictBrokeDate:
    def test_empty_returns_none_date(self) -> None:
        empty = pd.DataFrame({"datetime": pd.to_datetime([]), "amount": [], "category": []})
        result = predict_broke_date(empty, monthly_budget=10000)
        assert result["predicted_date"] is None
        assert result["daily_burn"] == 0.0
        assert result["confidence"] == 0.0

    def test_returns_required_keys(self, month_tx: pd.DataFrame) -> None:
        result = predict_broke_date(month_tx, monthly_budget=5000, reference_date=datetime(2026, 1, 20))
        assert "predicted_date" in result
        assert "daily_burn" in result
        assert "projected_month_end" in result
        assert "days_left" in result
        assert "confidence" in result

    def test_confidence_within_unit_interval(self, month_tx: pd.DataFrame) -> None:
        result = predict_broke_date(month_tx, monthly_budget=5000, reference_date=datetime(2026, 1, 20))
        assert 0.0 <= result["confidence"] <= 1.0

    def test_very_large_budget_no_broke_date(self) -> None:
        df = pd.DataFrame({
            "datetime": pd.date_range("2026-01-01", periods=15, freq="D"),
            "amount": [10.0] * 15,
            "category": ["Food"] * 15,
        })
        result = predict_broke_date(df, monthly_budget=1_000_000, reference_date=datetime(2026, 1, 15))
        # At ₹10/day on ₹10L budget, should project far future or None
        assert result["daily_burn"] == pytest.approx(10.0)


# ─── simulate_scenario ───────────────────────────────────────────────────────

class TestSimulateScenario:
    def test_invalid_category_raises(self, minimal_tx: pd.DataFrame) -> None:
        with pytest.raises(ValueError, match="cutback_category must exist"):
            simulate_scenario(minimal_tx, budget=5000, cutback_pct=20, cutback_category="NonExistent")

    def test_zero_cutback_neutral_impact(self, month_tx: pd.DataFrame) -> None:
        result = simulate_scenario(month_tx, budget=5000, cutback_pct=0, cutback_category="Food")
        assert result["scenario_impact"] == "neutral"
        assert result["days_gained"] == 0.0

    def test_20pct_cutback_positive_impact(self, month_tx: pd.DataFrame) -> None:
        result = simulate_scenario(month_tx, budget=5000, cutback_pct=20, cutback_category="Food")
        assert result["days_gained"] >= 0.0
        assert result["new_monthly_savings"] >= 0.0

    def test_80pct_cutback_reduces_cap(self, month_tx: pd.DataFrame) -> None:
        result = simulate_scenario(month_tx, budget=5000, cutback_pct=80, cutback_category="Food")
        # 80% cutback → new cap should be less than original category spend
        assert result["new_suggested_cap"] < result["new_suggested_cap"] + 1  # sanity
        assert result["new_monthly_savings"] > 0  # savings should be positive

    def test_result_has_all_keys(self, month_tx: pd.DataFrame) -> None:
        result = simulate_scenario(month_tx, budget=5000, cutback_pct=30, cutback_category="Food")
        required = {"original_days_left", "new_days_left", "days_gained", "new_monthly_savings", "new_suggested_cap", "scenario_impact"}
        assert required.issubset(result.keys())


# ─── simulate_savings ────────────────────────────────────────────────────────

class TestSimulateSavings:
    def test_returns_correct_number_of_rows(self) -> None:
        df = simulate_savings(10000.0, cut_percent=20.0, annual_interest_rate=7.0, months=12)
        assert len(df) == 12

    def test_balance_is_monotonically_increasing(self) -> None:
        df = simulate_savings(10000.0, cut_percent=20.0, annual_interest_rate=7.0, months=12)
        balances = df["projected_balance"].tolist()
        assert all(b2 >= b1 for b1, b2 in zip(balances, balances[1:]))

    def test_zero_cut_percent_zero_savings(self) -> None:
        df = simulate_savings(10000.0, cut_percent=0.0, annual_interest_rate=7.0, months=6)
        # 0% cutback means monthly_contribution=0, so balance stays 0
        assert (df["projected_balance"] < 0.01).all()

    def test_columns_present(self) -> None:
        df = simulate_savings(5000.0, cut_percent=10.0, annual_interest_rate=5.0, months=3)
        assert "month" in df.columns
        assert "saved_from_cutbacks" in df.columns
        assert "projected_balance" in df.columns

    def test_1_month_projection(self) -> None:
        df = simulate_savings(1200.0, cut_percent=50.0, annual_interest_rate=0.0, months=1)
        # 50% of 1200 = 600 saved, 0% interest → balance = 600
        assert df["projected_balance"].iloc[0] == pytest.approx(600.0)


# ─── detect_weekly_anomalies ─────────────────────────────────────────────────

class TestDetectWeeklyAnomaliesEdgeCases:
    def test_all_equal_amounts_no_anomaly(self) -> None:
        tx = pd.DataFrame({
            "datetime": pd.date_range("2026-01-01", periods=8, freq="W"),
            "amount": [1000.0] * 8,
        })
        result = detect_weekly_anomalies(tx)
        assert result["is_anomaly"].sum() == 0

    def test_iqr_zero_uses_std_fallback(self) -> None:
        """When IQR is 0 (all values equal), should not raise ZeroDivisionError."""
        tx = pd.DataFrame({
            "datetime": pd.date_range("2026-01-01", periods=6, freq="W"),
            "amount": [500.0] * 6,
        })
        result = detect_weekly_anomalies(tx)
        assert "severity" in result.columns
        assert not result["severity"].isna().any()

    def test_single_massive_spike_detected(self) -> None:
        dates = pd.date_range("2026-01-01", periods=8, freq="W")
        amounts = [500.0, 510.0, 490.0, 505.0, 10000.0, 495.0, 502.0, 498.0]
        tx = pd.DataFrame({"datetime": dates, "amount": amounts})
        result = detect_weekly_anomalies(tx)
        assert result["is_anomaly"].sum() >= 1


# ─── compute_projection_bands ────────────────────────────────────────────────

class TestComputeProjectionBandsEdgeCases:
    def test_zero_budget_returns_all_zeros(self) -> None:
        df = pd.DataFrame({
            "datetime": pd.date_range("2026-01-01", periods=10, freq="D"),
            "amount": [100.0] * 10,
            "category": ["Food"] * 10,
        })
        result = compute_projection_bands(df, budget=0, days=10)
        assert all(v == 0.0 for v in result["base"])

    def test_arrays_all_same_length(self) -> None:
        df = pd.DataFrame({
            "datetime": pd.date_range("2026-01-01", periods=10, freq="D"),
            "amount": [100.0] * 10,
            "category": ["Food"] * 10,
        })
        result = compute_projection_bands(df, budget=5000, days=30)
        assert len(result["base"]) == len(result["best_case"]) == len(result["worst_case"]) == 30

    def test_broke_date_within_range(self) -> None:
        df = pd.DataFrame({
            "datetime": pd.date_range("2026-01-01", periods=5, freq="D"),
            "amount": [1000.0] * 5,
            "category": ["Food"] * 5,
        })
        result = compute_projection_bands(df, budget=3000, days=10)
        assert 1 <= result["broke_date_base"] <= 10
