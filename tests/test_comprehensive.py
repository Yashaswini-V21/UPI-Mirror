from __future__ import annotations

from datetime import datetime

import pandas as pd
import pytest

from src.analytics import compute_addiction_scores, detect_weekly_anomalies
from src.coach_agent import _detect_anomaly, _route_after_detection, _suggest_limit, run_spending_coach_agent
from src.data import load_transactions
from src.narrative import generate_spending_narrative


@pytest.fixture
def base_state() -> dict:
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


class TestAnomalyDetection:
    """Test anomaly routing and status transitions."""

    def test_anomaly_routing_goes_to_repeat_pattern_when_detected(self, base_state) -> None:
        state = base_state.copy()
        state["anomaly_detected"] = True
        routed = _route_after_detection(state)
        assert routed == "repeat_pattern"

    def test_detect_anomaly_sets_watch_status_for_overspend_projection(self, base_state) -> None:
        state = base_state.copy()
        detected = _detect_anomaly(state)
        assert detected["anomaly_detected"] is True
        assert detected["status"] in {"watch", "critical"}
        assert "Anomaly or overspend risk detected" in detected["actions"]

    def test_detect_anomaly_stable_when_within_budget(self, base_state) -> None:
        state = base_state.copy()
        state["projected_month_end"] = 16000.0
        state["monthly_budget"] = 18000.0
        detected = _detect_anomaly(state)
        assert detected["status"] == "stable"


class TestLimitSuggestion:
    """Test limit suggestion and reward scoring logic."""

    def test_suggest_limit_for_repeat_pattern_with_groq(self, base_state) -> None:
        state = base_state.copy()
        state["anomaly_detected"] = True
        state["repeat_pattern_detected"] = True
        state["narrative_provider"] = "Groq"

        suggested = _suggest_limit(state)

        assert suggested["suggested_limit"] == 1400.0
        assert suggested["limit_window"] == "weekly"
        assert suggested["reward_signal"] == 5.0

    def test_suggest_limit_for_anomaly_without_repeat(self, base_state) -> None:
        state = base_state.copy()
        state["anomaly_detected"] = True
        state["repeat_pattern_detected"] = False
        state["top_category_recent_spend"] = 4000.0

        suggested = _suggest_limit(state)

        assert suggested["suggested_limit"] == 800.0
        assert suggested["reward_signal"] == 2.5

    def test_suggest_limit_stable_fallback(self, base_state) -> None:
        state = base_state.copy()
        state["top_category_recent_spend"] = 4000.0

        suggested = _suggest_limit(state)

        assert suggested["suggested_limit"] == 900.0
        assert suggested["reward_signal"] == 1.0

    def test_suggest_limit_zero_recent_spend(self, base_state) -> None:
        state = base_state.copy()
        state["top_category_recent_spend"] = 0.0

        suggested = _suggest_limit(state)

        assert suggested["suggested_limit"] == 0.0


class TestWeeklyAnomalies:
    """Test anomaly detection on small and edge-case datasets."""

    def test_detect_weekly_anomalies_small_series_returns_no_anomaly(self) -> None:
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
        assert (weekly["is_anomaly"] == False).all()

    def test_detect_weekly_anomalies_with_spike(self) -> None:
        dates = pd.date_range(start="2026-01-01", periods=8, freq="W")
        amounts = [1000.0, 1100.0, 1050.0, 1200.0, 5000.0, 1150.0, 1100.0, 1000.0]

        tx = pd.DataFrame({"datetime": dates, "amount": amounts})
        weekly = detect_weekly_anomalies(tx)

        assert weekly["is_anomaly"].sum() > 0


class TestDataIngestion:
    """Test CSV ingestion robustness and error handling."""

    def test_load_transactions_empty_after_cleaning_raises_error(self) -> None:
        from io import StringIO

        csv_content = "datetime,amount,category,merchant\n2026-01-01,invalid_amount,Food,Zomato\n"
        from src.data import EXPECTED_COLUMNS

        with pytest.raises(ValueError, match="no valid rows after cleaning"):
            from unittest.mock import Mock

            mock_file = Mock()
            mock_file.getvalue.return_value = csv_content.encode("utf-8")
            load_transactions(mock_file)

    @pytest.mark.parametrize(
        "missing_col",
        ["datetime", "amount", "category", "merchant"],
    )
    def test_load_transactions_missing_required_column(self, missing_col: str) -> None:
        from unittest.mock import Mock

        cols = ["datetime", "amount", "category", "merchant"]
        cols.remove(missing_col)
        csv_content = ",".join(cols) + "\n2026-01-01,100.0,Food,Zomato\n"

        with pytest.raises(ValueError, match="missing columns"):
            mock_file = Mock()
            mock_file.getvalue.return_value = csv_content.encode("utf-8")
            load_transactions(mock_file)

    def test_load_transactions_with_regret_column(self) -> None:
        from unittest.mock import Mock

        csv_content = "datetime,amount,category,merchant,regret\n2026-01-01,100.0,Food,Zomato,4\n"

        mock_file = Mock()
        mock_file.getvalue.return_value = csv_content.encode("utf-8")
        df = load_transactions(mock_file)

        assert "regret" in df.columns
        assert df["regret"].iloc[0] == 4.0


class TestNarrativeFallback:
    """Test narrative generation and fallback paths."""

    def test_narrative_uses_fallback_without_groq_key(self, monkeypatch) -> None:
        monkeypatch.delenv("GROQ_API_KEY", raising=False)
        context = {
            "top_category": "Food Delivery",
            "top_addiction_score": 72,
            "anomaly_detected": True,
            "repeat_pattern_detected": True,
            "projected_month_end": 24500.0,
            "monthly_budget": 18000.0,
            "days_left": 4,
            "late_night_merchant": "Zomato",
            "late_night_share": 68.0,
            "top_regret_category": "Food Delivery",
            "top_regret_score": 4.2,
        }

        result = generate_spending_narrative(context)

        assert result.used_fallback is True
        assert result.provider == "Rule-based fallback"
        assert "Food Delivery" in result.text

    def test_narrative_fallback_handles_missing_context(self) -> None:
        context = {}
        result = generate_spending_narrative(context)
        assert result.used_fallback is True
        assert len(result.text) > 0


class TestAddictionScores:
    """Test habit/addiction scoring edge cases."""

    def test_addiction_scores_empty_dataframe(self) -> None:
        tx = pd.DataFrame(
            {
                "datetime": pd.to_datetime([]),
                "amount": [],
                "category": [],
            }
        )
        scores = compute_addiction_scores(tx)
        assert scores.empty

    def test_addiction_scores_single_transaction(self) -> None:
        tx = pd.DataFrame(
            {
                "datetime": pd.to_datetime(["2026-03-01"]),
                "amount": [100.0],
                "category": ["Food"],
            }
        )
        scores = compute_addiction_scores(tx)
        assert not scores.empty
        assert scores["score"].iloc[0] > 0
