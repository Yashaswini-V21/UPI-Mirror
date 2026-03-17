from __future__ import annotations

from src.narrative import generate_spending_narrative


def test_narrative_uses_fallback_without_groq_key(monkeypatch) -> None:
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
    assert result.model == "deterministic-template"
    assert "Food Delivery" in result.text
