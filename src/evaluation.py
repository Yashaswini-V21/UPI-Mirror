from __future__ import annotations

from typing import Any

import pandas as pd

from src.coach_agent import SpendingCoachResult


def _clamp(value: float, low: float = 0.0, high: float = 100.0) -> float:
	return max(low, min(high, value))


def _acceptance_metrics(history: list[dict[str, Any]]) -> dict[str, float]:
	feedback_rows = [row for row in history if row.get("user_feedback") in {"accepted", "dismissed"}]
	if not feedback_rows:
		return {
			"feedback_samples": 0.0,
			"acceptance_rate": 0.0,
		}

	accepted = sum(1 for row in feedback_rows if row.get("user_feedback") == "accepted")
	return {
		"feedback_samples": float(len(feedback_rows)),
		"acceptance_rate": round((accepted / len(feedback_rows)) * 100, 1),
	}


def compute_quality_snapshot(
	*,
	transactions: pd.DataFrame,
	prediction: dict[str, Any],
	addiction_scores: pd.DataFrame,
	regret_stats: pd.DataFrame,
	merchant_late_night: pd.DataFrame,
	weekly: pd.DataFrame,
	coach_result: SpendingCoachResult,
	coach_history: list[dict[str, Any]],
) -> dict[str, Any]:
	signal_count = 0
	signal_count += 1 if not addiction_scores.empty else 0
	signal_count += 1 if not regret_stats.empty else 0
	signal_count += 1 if not merchant_late_night.empty else 0
	signal_count += 1 if not weekly.empty else 0
	ds_signal_coverage = round((signal_count / 4) * 100, 1)

	confidence = float(prediction.get("confidence", 0.0) or 0.0)
	days_left = prediction.get("days_left")
	overspend_flag = 1.0 if (prediction.get("projected_month_end", 0) or 0) > 0 else 0.0
	ml_forecast_readiness = _clamp((confidence * 75.0) + (12.5 if days_left is not None else 0.0) + (12.5 * overspend_flag))

	ai_actionability = 40.0
	ai_actionability += 20.0 if coach_result.narrative.strip() else 0.0
	ai_actionability += 20.0 if coach_result.nudge.strip() else 0.0
	ai_actionability += 20.0 if coach_result.suggested_limit >= 0 else 0.0
	ai_actionability = _clamp(ai_actionability)

	feedback = _acceptance_metrics(coach_history)
	learning_signal_strength = _clamp((feedback["acceptance_rate"] * 0.6) + (min(feedback["feedback_samples"], 10.0) * 4.0))

	platform_score = round(
		(ds_signal_coverage * 0.30)
		+ (ml_forecast_readiness * 0.30)
		+ (ai_actionability * 0.20)
		+ (learning_signal_strength * 0.20),
		1,
	)

	return {
		"total_transactions": int(len(transactions)),
		"ds_signal_coverage": ds_signal_coverage,
		"ml_forecast_readiness": round(ml_forecast_readiness, 1),
		"ai_actionability": round(ai_actionability, 1),
		"learning_signal_strength": round(learning_signal_strength, 1),
		"nudge_acceptance_rate": feedback["acceptance_rate"],
		"feedback_samples": int(feedback["feedback_samples"]),
		"platform_score": platform_score,
	}


def build_quality_breakdown(snapshot: dict[str, Any]) -> pd.DataFrame:
	rows = [
		{
			"layer": "Data Science",
			"metric": "Signal coverage",
			"score": snapshot["ds_signal_coverage"],
			"why_it_matters": "Shows whether behavior features are sufficiently populated.",
		},
		{
			"layer": "Machine Learning",
			"metric": "Forecast readiness",
			"score": snapshot["ml_forecast_readiness"],
			"why_it_matters": "Combines confidence and actionable forecast fields.",
		},
		{
			"layer": "AI Agent",
			"metric": "Actionability",
			"score": snapshot["ai_actionability"],
			"why_it_matters": "Checks whether narrative and nudge outputs are usable.",
		},
		{
			"layer": "Learning Loop",
			"metric": "Feedback strength",
			"score": snapshot["learning_signal_strength"],
			"why_it_matters": "Measures how much real user feedback is available for improvement.",
		},
	]
	return pd.DataFrame(rows)
