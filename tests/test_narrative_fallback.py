"""
Test narrative generation with Gemini backend and fallback handling.
"""

from __future__ import annotations

from unittest.mock import MagicMock, patch

import pytest

from src.narrative import (
    SpendingNarrative,
    generate_narrative,
    generate_spending_narrative,
    generate_structured_narrative,
)


class TestGenerateNarrative:
    """Test basic narrative generation with Gemini."""

    @patch("src.narrative._get_api_key", return_value="test-key")
    @patch("src.narrative._create_model")
    def test_generate_narrative_with_gemini(self, mock_create_model, mock_api_key):
        """Generate narrative should use Gemini LLM when available."""
        mock_model = MagicMock()
        mock_response = MagicMock()
        mock_response.text = "Your Food Delivery spending hit ₹3,200 this week. You have 9 days left. Cut to ₹500 this week."
        mock_model.generate_content.return_value = mock_response
        mock_create_model.return_value = mock_model

        state = {
            "status": "watch",
            "days_left": 9,
            "top_category": "Food Delivery",
            "anomaly_detected": True,
            "habit_score": 0.8,
        }

        result = generate_narrative(state)

        assert isinstance(result, str)
        assert len(result) > 20

    @patch("src.narrative._get_api_key", return_value=None)
    def test_generate_narrative_fallback_when_model_none(self, mock_api_key):
        """Generate narrative should use fallback template when API key is missing."""
        state = {
            "status": "watch",
            "days_left": 9,
            "top_category": "Food Delivery",
            "anomaly_detected": True,
            "habit_score": 0.8,
        }

        result = generate_narrative(state)

        assert isinstance(result, str)
        assert len(result) > 20
        assert "Food Delivery" in result

    @patch("src.narrative._get_api_key", return_value="test-key")
    @patch("src.narrative._create_model")
    def test_generate_narrative_critical_status(self, mock_create_model, mock_api_key):
        """Narrative for critical status should convey urgency."""
        mock_model = MagicMock()
        mock_response = MagicMock()
        mock_response.text = "CRITICAL: Your spending will deplete your budget in 2 days."
        mock_model.generate_content.return_value = mock_response
        mock_create_model.return_value = mock_model

        state = {
            "status": "critical",
            "days_left": 2,
            "top_category": "Entertainment",
            "anomaly_detected": True,
            "habit_score": 0.95,
        }

        result = generate_narrative(state)

        assert len(result) > 0


class TestGenerateStructuredNarrative:
    """Test structured narrative generation with all fields."""

    @patch("src.narrative._get_api_key", return_value="test-key")
    @patch("src.narrative._create_model")
    def test_structured_returns_all_keys(self, mock_create_model, mock_api_key):
        """Structured narrative should include all required keys."""
        mock_model = MagicMock()
        mock_response = MagicMock()
        mock_response.text = json_markdown_fenced = '```json\n{"narrative": "Your spending is high.", "action": "Cut spending by 30%.", "urgency": "high", "tip": "Use a budget app.", "confidence_source": "gemini"}\n```'
        mock_model.generate_content.return_value = mock_response
        mock_create_model.return_value = mock_model

        state = {
            "status": "critical",
            "days_left": 5,
            "top_category": "Shopping",
            "anomaly_detected": True,
            "habit_score": 0.9,
            "suggested_cap": 5000,
        }

        result = generate_structured_narrative(state)

        assert isinstance(result, dict)
        assert "narrative" in result
        assert "action" in result
        assert "urgency" in result
        assert "tip" in result
        assert "confidence_source" in result

    @patch("src.narrative._get_api_key", return_value="test-key")
    @patch("src.narrative._create_model")
    def test_structured_handles_markdown_fences(self, mock_create_model, mock_api_key):
        """Structured narrative should parse JSON from markdown fences."""
        mock_model = MagicMock()
        mock_response = MagicMock()
        mock_response.text = '```json\n{"narrative": "You spent too much", "action": "Reduce by ₹500", "urgency": "high", "tip": "Track daily", "confidence_source": "gemini"}\n```'
        mock_model.generate_content.return_value = mock_response
        mock_create_model.return_value = mock_model

        state = {
            "status": "watch",
            "days_left": 10,
            "top_category": "Food",
            "anomaly_detected": False,
            "habit_score": 0.5,
        }

        result = generate_structured_narrative(state)

        assert result["narrative"] == "You spent too much"
        assert result["confidence_source"] == "gemini"

    @patch("src.narrative._get_api_key", return_value="test-key")
    @patch("src.narrative._create_model")
    def test_structured_fallback_on_bad_json(self, mock_create_model, mock_api_key):
        """Structured narrative should fall back when JSON is invalid."""
        mock_model = MagicMock()
        mock_response = MagicMock()
        mock_response.text = "not valid json"
        mock_model.generate_content.return_value = mock_response
        mock_create_model.return_value = mock_model

        state = {
            "status": "stable",
            "days_left": 25,
            "top_category": "Essentials",
            "anomaly_detected": False,
            "habit_score": 0.2,
        }

        result = generate_structured_narrative(state)

        assert isinstance(result, dict)
        assert result["confidence_source"] == "fallback"
        assert isinstance(result["narrative"], str)
        assert len(result["narrative"]) > 0

    @patch("src.narrative._get_api_key", return_value=None)
    def test_structured_fallback_when_model_none(self, mock_api_key):
        """Structured narrative should use deterministic fallback when API key missing."""
        state = {
            "status": "critical",
            "days_left": 3,
            "top_category": "Food Delivery",
            "anomaly_detected": True,
            "habit_score": 0.85,
        }

        result = generate_structured_narrative(state)

        assert result["confidence_source"] == "fallback"
        assert "Food Delivery" in result["narrative"]


class TestGenerateSpendingNarrative:
    """Test backward-compatible spending narrative wrapper."""

    @patch("src.narrative._get_api_key", return_value="test-key")
    @patch("src.narrative._create_model")
    def test_spending_narrative_returns_obj_with_gemini(self, mock_create_model, mock_api_key):
        """Spending narrative should return SpendingNarrative object with Gemini provider."""
        mock_model = MagicMock()
        mock_response = MagicMock()
        mock_response.text = '```json\n{"narrative": "Watch your spending", "action": "Cut by 20%", "urgency": "medium", "tip": "Budget daily", "confidence_source": "gemini"}\n```'
        mock_model.generate_content.return_value = mock_response
        mock_create_model.return_value = mock_model

        context = {
            "top_category": "Food Delivery",
            "days_left": 9,
            "status": "watch",
            "anomaly_detected": True,
            "habit_score": 0.7,
        }

        result = generate_spending_narrative(context)

        assert isinstance(result, SpendingNarrative)
        assert result.provider == "Gemini"
        assert result.used_fallback is False
        assert result.model == "gemini-1.5-flash"
        assert "Watch your spending" in result.text

    @patch("src.narrative._get_api_key", return_value=None)
    def test_spending_narrative_uses_fallback_without_model(self, mock_api_key):
        """Spending narrative should use fallback provider when model is unavailable."""
        context = {
            "top_category": "Food Delivery",
            "days_left": 9,
            "status": "watch",
            "anomaly_detected": True,
            "habit_score": 0.7,
        }

        result = generate_spending_narrative(context)

        assert isinstance(result, SpendingNarrative)
        assert result.provider == "Rule-based fallback"
        assert result.used_fallback is True
        assert result.model == "deterministic-template"
        assert len(result.text) > 0

    def test_spending_narrative_fallback_handles_missing_context(self):
        """Spending narrative should handle empty context gracefully."""
        context = {}
        result = generate_spending_narrative(context)

        assert isinstance(result, SpendingNarrative)
        assert result.used_fallback is True
        assert len(result.text) > 0


class TestNarrativeEdgeCases:
    """Test narrative generation edge cases."""

    @patch("src.narrative._get_api_key", return_value="test-key")
    @patch("src.narrative._create_model")
    def test_narrative_with_zero_days_left(self, mock_create_model, mock_api_key):
        """Narrative should handle zero days left."""
        mock_model = MagicMock()
        mock_response = MagicMock()
        mock_response.text = '```json\n{"narrative": "Budget depleted today", "action": "Stop spending", "urgency": "high", "tip": "Emergency only", "confidence_source": "gemini"}\n```'
        mock_model.generate_content.return_value = mock_response
        mock_create_model.return_value = mock_model

        state = {
            "status": "critical",
            "days_left": 0,
            "top_category": "Transport",
            "anomaly_detected": True,
            "habit_score": 0.95,
        }

        result = generate_narrative(state)

        assert len(result) > 0

    @patch("src.narrative._get_api_key", return_value="test-key")
    @patch("src.narrative._create_model")
    def test_narrative_with_special_characters_in_category(self, mock_create_model, mock_api_key):
        """Narrative should handle special characters in category."""
        mock_model = MagicMock()
        mock_response = MagicMock()
        mock_response.text = "Spending on Travel & Insurance is under control."
        mock_model.generate_content.return_value = mock_response
        mock_create_model.return_value = mock_model

        state = {
            "status": "stable",
            "days_left": 20,
            "top_category": "Travel & Insurance",
            "anomaly_detected": False,
            "habit_score": 0.3,
        }

        result = generate_narrative(state)

        assert len(result) > 0

