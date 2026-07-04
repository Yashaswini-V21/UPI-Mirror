from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from core_logic.coach_agent import SpendingCoachResult


@dataclass(slots=True)
class SignalContribution:
    signal_name: str
    raw_value: float
    weight: float
    contribution: float
    interpretation: str


def explain_coach_decision(coach_result: SpendingCoachResult, context: dict[str, Any]) -> dict[str, Any]:
    """
    Break down the coach decision into human-readable signal contributions.
    Shows which signals fired and how much they influenced the recommendation.
    """
    signals: list[SignalContribution] = []

    anomaly_detected = bool(coach_result.anomaly_detected)
    anomaly_severity = float(coach_result.anomaly_severity)
    if anomaly_detected:
        signals.append(
            SignalContribution(
                signal_name="Anomaly Detection",
                raw_value=anomaly_severity,
                weight=0.35,
                contribution=anomaly_severity * 0.35,
                interpretation=f"Weekly spend spike detected with severity {anomaly_severity:.2f}.",
            )
        )

    repeat_pattern = bool(coach_result.repeat_pattern_detected)
    if repeat_pattern:
        signals.append(
            SignalContribution(
                signal_name="Repeat Pattern",
                raw_value=1.0,
                weight=0.25,
                contribution=0.25,
                interpretation=f"Category '{coach_result.suggested_category}' shows repeating habit signals (late-night or regret linked).",
            )
        )

    top_addiction_score = context.get("top_addiction_score", 0)
    if top_addiction_score > 60:
        signals.append(
            SignalContribution(
                signal_name="Addiction Score",
                raw_value=float(top_addiction_score),
                weight=0.20,
                contribution=(top_addiction_score / 100.0) * 0.20,
                interpretation=f"'{coach_result.suggested_category}' scores {top_addiction_score}/100 on habit intensity.",
            )
        )

    days_left = context.get("days_left")
    if days_left is not None and days_left <= 5:
        signals.append(
            SignalContribution(
                signal_name="Days to Budget Limit",
                raw_value=float(days_left),
                weight=0.10,
                contribution=0.10,
                interpretation=f"Only {days_left} day(s) until projected broke date. Urgency: HIGH.",
            )
        )

    regret_score = context.get("top_regret_score", 0.0)
    if regret_score >= 3.5:
        signals.append(
            SignalContribution(
                signal_name="Category Regret",
                raw_value=float(regret_score),
                weight=0.10,
                contribution=(regret_score / 5.0) * 0.10,
                interpretation=f"'{context.get('top_regret_category')}' averaging {regret_score:.1f}/5 on regret—likely impulse spending.",
            )
        )

    total_contribution = sum(s.contribution for s in signals)

    status_mapping = {
        "stable": "All systems normal. No intervention needed today.",
        "watch": "Spending pace warrants monitoring. Gentle nudge issued.",
        "critical": "Multiple risk signals detected. Urgent intervention recommended.",
    }

    return {
        "status": coach_result.status,
        "status_explanation": status_mapping.get(coach_result.status, "Unknown status."),
        "signals": [
            {
                "name": s.signal_name,
                "raw_value": round(s.raw_value, 2),
                "weight": round(s.weight * 100, 1),
                "contribution_pct": round((s.contribution / max(total_contribution, 0.01)) * 100, 1),
                "interpretation": s.interpretation,
            }
            for s in signals
        ],
        "primary_recommendation": coach_result.nudge,
        "suggested_limit": round(coach_result.suggested_limit, 2),
        "limit_window": coach_result.limit_window,
        "source_category": coach_result.suggested_category,
    }


def build_explainability_table(explanation: dict[str, Any]) -> str:
    """Format explanability output as a readable markdown table."""
    signals = explanation.get("signals", [])
    if not signals:
        return "No active signals detected. Budget tracking mode enabled."

    lines = [
        "| Signal | Raw Value | Weight | Impact % | Why This Matters |",
        "|--------|-----------|--------|----------|-----------------|",
    ]

    for sig in signals:
        lines.append(
            f"| {sig['name']} | {sig['raw_value']} | {sig['weight']}% | {sig['contribution_pct']}% | {sig['interpretation']} |"
        )

    return "\n".join(lines)
