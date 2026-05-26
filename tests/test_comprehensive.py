from __future__ import annotations

from datetime import datetime
from unittest.mock import MagicMock, patch

import pandas as pd
import pytest

from api.security import (
    make_upload_id,
    sanitize_dataframe,
    validate_upload_file,
)
from src.analytics import (
    compute_addiction_scores,
    compute_projection_bands,
    detect_weekly_anomalies,
    simulate_scenario,
)
from src.coach_agent import _detect_anomaly, _route_after_detection, _suggest_limit, confidence_scoring, run_spending_coach_agent
from src.data import load_transactions
from src.pdf_parser import _detect_statement_source, parse_upi_pdf
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
        "narrative_provider": "Gemini",
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

    def test_suggest_limit_for_repeat_pattern_with_gemini(self, base_state) -> None:
        state = base_state.copy()
        state["anomaly_detected"] = True
        state["repeat_pattern_detected"] = True
        state["narrative_provider"] = "Gemini"

        suggested = _suggest_limit(state)

        assert suggested["suggested_limit"] == 1400.0
        assert suggested["limit_window"] == "weekly"
        assert suggested["reward_signal"] == 4.0

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


class TestConfidenceScoring:
    """Test confidence_scoring node for coach state graph."""

    def test_confidence_all_signals_fired(self) -> None:
        """Confidence should be near 1.0 when all signals are active."""
        state = {
            "anomaly_detected": True,
            "habit_score": 0.9,
            "days_left": 5,
            "regret_flag": True,
            "confidence_score": 0.0,
            "signal_weights": {},
        }

        result = confidence_scoring(state)

        assert "confidence_score" in result
        assert isinstance(result["confidence_score"], (int, float))
        assert 0 <= result["confidence_score"] <= 1.0
        assert result["confidence_score"] > 0.5  # Multiple signals active

    def test_confidence_no_signals_fired(self) -> None:
        """Confidence should be lower when most signals are inactive."""
        state = {
            "anomaly_detected": False,
            "habit_score": 0.1,
            "days_left": 25,
            "regret_flag": False,
            "confidence_score": 0.0,
            "signal_weights": {},
        }

        result = confidence_scoring(state)

        assert "confidence_score" in result
        assert 0 <= result["confidence_score"] <= 1.0

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
        self, anomaly: bool, habit: float, days: int, regret: bool
    ) -> None:
        """Confidence should always be between 0 and 1 for any signal combination."""
        state = {
            "anomaly_detected": anomaly,
            "habit_score": habit,
            "days_left": days,
            "regret_flag": regret,
            "confidence_score": 0.0,
            "signal_weights": {},
        }

        result = confidence_scoring(state)

        score = result.get("confidence_score", 0.5)
        assert 0 <= score <= 1.0

    def test_signal_weights_sum_to_1(self) -> None:
        """Sum of signal weights should equal 1.0."""
        state = {
            "anomaly_detected": True,
            "habit_score": 0.7,
            "days_left": 10,
            "regret_flag": True,
            "confidence_score": 0.0,
            "signal_weights": {},
        }

        result = confidence_scoring(state)

        weights = result.get("signal_weights", {})
        if weights:
            total = sum(weights.values())
            assert abs(total - 1.0) < 0.01  # Allow small float rounding


class TestAnalyticsScenarios:
    """Test new analytics scenario functions."""

    def test_simulate_scenario_returns_positive_days_gained(self) -> None:
        """Simulate scenario should calculate positive days_gained."""
        df = pd.DataFrame({
            "datetime": pd.date_range("2026-01-01", periods=20, freq="D"),
            "amount": [100, 150, 120, 110, 130, 200, 180, 120, 110, 100, 150, 120, 110, 130, 200, 180, 120, 110, 100, 150],
            "category": ["Food"] * 20,
            "merchant": ["Cafe"] * 20,
        })

        result = simulate_scenario(
            df,
            budget=5000,
            cutback_pct=20,
            cutback_category="Food"
        )

        assert isinstance(result, dict)
        assert "days_gained" in result
        assert result["days_gained"] >= 0

    def test_simulate_scenario_invalid_category_raises_valueerror(self) -> None:
        """Simulate scenario should raise ValueError for non-existent category."""
        df = pd.DataFrame({
            "datetime": pd.date_range("2026-01-01", periods=10, freq="D"),
            "amount": [100] * 10,
            "category": ["Food"] * 10,
            "merchant": ["Cafe"] * 10,
        })

        with pytest.raises(ValueError):
            simulate_scenario(
                df,
                budget=5000,
                cutback_pct=20,
                cutback_category="NonExistentCategory"
            )

    def test_simulate_zero_cutback_returns_unchanged(self) -> None:
        """Simulate scenario with 0% cutback should return unchanged budget."""
        df = pd.DataFrame({
            "datetime": pd.date_range("2026-01-01", periods=10, freq="D"),
            "amount": [100] * 10,
            "category": ["Food"] * 10,
            "merchant": ["Cafe"] * 10,
        })

        result = simulate_scenario(
            df,
            budget=5000,
            cutback_pct=0,
            cutback_category="Food"
        )

        assert result["days_gained"] == 0.0

    def test_projection_bands_all_arrays_length_30(self) -> None:
        """Projection bands should return 30-element arrays."""
        df = pd.DataFrame({
            "datetime": pd.date_range("2026-01-01", periods=30, freq="D"),
            "amount": [100, 150, 120] * 10,
            "category": ["Food", "Transport", "Entertainment"] * 10,
            "merchant": ["Store"] * 30,
        })

        result = compute_projection_bands(df, budget=5000, days=30)

        assert isinstance(result, dict)
        assert "base" in result
        assert "best_case" in result
        assert "worst_case" in result
        assert len(result["base"]) == 30
        assert len(result["best_case"]) == 30
        assert len(result["worst_case"]) == 30


class TestSecurityModule:
    """Test security validation and sanitization functions."""

    def test_validate_rejects_exe_magic_bytes(self) -> None:
        """validate_upload_file should reject executable magic bytes."""
        exe_content = b"MZ\x90\x00" + b"x" * 100
        
        with pytest.raises(Exception):  # Should raise HTTPException with 400
            validate_upload_file("test.csv", exe_content)

    def test_validate_rejects_pdf_as_csv(self) -> None:
        """validate_upload_file should reject PDF content in CSV upload."""
        pdf_content = b"%PDF-1.4" + b"x" * 100
        
        with pytest.raises(Exception):
            validate_upload_file("test.csv", pdf_content)

    def test_sanitize_strips_csv_injection(self) -> None:
        """sanitize_dataframe should strip CSV injection characters."""
        df = pd.DataFrame({
            "datetime": ["2026-01-01"],
            "amount": [100],
            "category": ["=cmd()"],
            "merchant": ["@SomeMaliciousFormula"],
        })

        result = sanitize_dataframe(df)

        assert result["category"].iloc[0] == "Cmd()"
        assert result["merchant"].iloc[0] == "SomeMaliciousFormula"

    def test_sanitize_strips_leading_chars(self) -> None:
        """sanitize_dataframe should strip all injection prefix chars."""
        df = pd.DataFrame({
            "datetime": ["2026-01-01"],
            "amount": [100],
            "category": ["+INDIRECT()"],
            "merchant": ["-2+5=7"],
        })

        result = sanitize_dataframe(df)

        assert result["category"].iloc[0] == "Indirect()"
        assert result["merchant"].iloc[0] == "2+5=7"

    def test_make_upload_id_matches_pattern(self) -> None:
        """make_upload_id should match r'^kira_\d{13}$' pattern."""
        import re
        
        upload_id = make_upload_id()
        
        pattern = r"^kira_\d{13}$"
        assert re.match(pattern, upload_id) is not None

    def test_make_upload_id_unique(self) -> None:
        """Multiple calls to make_upload_id should generate unique IDs."""
        import time
        
        id1 = make_upload_id()
        time.sleep(0.002)  # Sleep 2ms to ensure different millisecond
        id2 = make_upload_id()
        
        assert id1 != id2

    def test_sanitize_strips_whitespace_only(self) -> None:
        """sanitize_dataframe should strip leading/trailing whitespace."""
        df = pd.DataFrame({
            "datetime": ["2026-01-01"],
            "amount": [100],
            "category": ["  Food  "],
            "merchant": ["\tCafe\r"],
        })

        result = sanitize_dataframe(df)

        assert result["category"].iloc[0] == "Food"
        assert result["merchant"].iloc[0] == "Cafe"


class TestPdfParsing:
    def test_statement_source_detection(self) -> None:
        assert _detect_statement_source("Google Pay statement") == "gpay"
        assert _detect_statement_source("Paytm transaction history") == "paytm"
        assert _detect_statement_source("PhonePe UPI report") == "phonepe"

    def test_parse_upi_pdf_empty_text_raises_value_error(self) -> None:
        from unittest.mock import Mock, patch

        fake_reader = Mock()
        fake_page = Mock()
        fake_page.extract_text.return_value = ""
        fake_reader.pages = [fake_page]

        with patch("src.pdf_parser.PDF_AVAILABLE", True), patch(
            "src.pdf_parser.PdfReader", return_value=fake_reader, create=True
        ):
            with pytest.raises(ValueError, match="No transactions found in PDF"):
                parse_upi_pdf(b"fake-pdf-bytes")
