"""src/coach_agent.py
====================
Kira-AI spending coach orchestration.

This module implements a merge-safe LangGraph pipeline where each node returns
only the keys it writes, making state propagation additive rather than
destructive.  The graph is compiled once at import time and reused thread-safely
via ``_COACH_GRAPH_LOCK``.

Pipeline topology (linear)::

  START -> anomaly_check -> pattern_analysis -> nudge_generation
        -> cap_recommendation -> confidence_scoring -> END

Public entry points:
  - run_coach_workflow():        Low-level; accepts pre-built signal dict.
  - run_spending_coach_agent():  High-level convenience wrapper used by the API.

Legacy helpers (``_detect_anomaly``, ``_suggest_limit``, etc.) are retained for
compatibility with the existing test suite.
"""

from __future__ import annotations

from dataclasses import asdict, dataclass
import os
from threading import RLock
from typing import Any, TypedDict
import logging

import pandas as pd

from src.narrative import DEFAULT_GEMINI_MODEL, generate_narrative

try:
    from langgraph.graph import END, START, StateGraph

    LANGGRAPH_AVAILABLE = True
except ImportError:  # pragma: no cover - exercised only when langgraph is absent.
    END = "__end__"
    START = "__start__"
    StateGraph = None
    LANGGRAPH_AVAILABLE = False


class CoachState(TypedDict, total=False):
    df: Any
    budget: float
    signals: dict[str, Any]
    anomaly_detected: bool
    anomaly_score: float
    habit_score: float
    habit_category: str
    days_left: int
    regret_flag: bool
    status: str
    nudge: str
    suggested_cap: float
    confidence_score: float
    signal_weights: dict[str, float]
    top_overspend_category: str
    burn_rate_daily: float
    narrative: str
    narrative_provider: str
    narrative_model: str
    coach_title: str
    reward_signal: float
    limit_window: str
    repeat_pattern_detected: bool
    anomaly_severity: float
    top_category_recent_spend: float
    top_regret_category: str | None
    top_regret_score: float
    current_spend: float
    monthly_budget: float
    projected_month_end: float
    actions: list[str]


@dataclass(slots=True)
class SpendingCoachResult:
    title: str
    status: str
    anomaly_detected: bool
    anomaly_severity: float
    repeat_pattern_detected: bool
    suggested_category: str
    narrative: str
    narrative_provider: str
    narrative_model: str
    nudge: str
    suggested_limit: float
    limit_window: str
    reward_signal: float
    actions: list[str]

    def as_dict(self) -> dict[str, Any]:
        return asdict(self)


LOGGER = logging.getLogger(__name__)
_COACH_GRAPH_LOCK = RLock()

# ── Named constants (no magic numbers) ────────────────────────────────────────
# Spending cap factors (fraction of budget) per alert status
CRITICAL_CAP_FACTOR: float = 0.12
WATCH_CAP_FACTOR: float = 0.18
STABLE_CAP_FACTOR: float = 0.25

# Alternative cap factors used in cap_recommendation node
CRITICAL_CAP_STRICT: float = 0.15
WATCH_CAP_STRICT: float = 0.20
STABLE_CAP_STRICT: float = 0.30

# Signal weights for confidence scoring
ANOMALY_WEIGHT: float = 0.4
HABIT_WEIGHT: float = 0.3
DAYS_WEIGHT: float = 0.2
REGRET_WEIGHT: float = 0.1

# Thresholds for status classification
CRITICAL_HABIT_THRESHOLD: float = 0.75   # habit_score >= this AND anomaly → critical
WATCH_HABIT_THRESHOLD: float = 0.45      # habit_score >= this OR anomaly → watch
WATCH_DAYS_LEFT_THRESHOLD: int = 5       # days_left <= this → watch

# Repeat-pattern detection thresholds
REPEAT_PATTERN_HABIT_THRESHOLD: float = 0.65
REPEAT_PATTERN_REGRET_THRESHOLD: float = 3.5
REPEAT_PATTERN_LATE_NIGHT_THRESHOLD: float = 30.0

# Regret flag threshold
REGRET_FLAG_THRESHOLD: float = 3.5

# Reward signal bonuses
REWARD_BASE: float = 1.0
REWARD_ANOMALY_BONUS: float = 1.5
REWARD_REPEAT_BONUS: float = 1.5
REWARD_GEMINI_BONUS: float = 1.0



def _coerce_float(value: Any, default: float = 0.0) -> float:
    try:
        if value is None:
            return default
        return float(value)
    except (TypeError, ValueError):
        return default


def _coerce_int(value: Any, default: int = 0) -> int:
    try:
        if value is None:
            return default
        return int(float(value))
    except (TypeError, ValueError):
        return default


def _clamp(value: float, low: float = 0.0, high: float = 1.0) -> float:
    return max(low, min(high, value))


def _normalize_unit(value: Any) -> float:
    score = _coerce_float(value, 0.0)
    if score > 1.0:
        if score <= 100.0:
            score = score / 100.0
        else:
            score = score / max(score, 100.0)
    return _clamp(score)


def _legacy_signal_bundle(state: CoachState) -> dict[str, Any]:
    signals = dict(state.get("signals") or {})
    legacy_keys = {
        "anomaly_detected",
        "anomaly_score",
        "habit_score",
        "habit_category",
        "days_left",
        "regret_flag",
        "top_category",
        "burn_rate_daily",
        "suggested_cap",
        "confidence_score",
        "signal_weights",
        "top_overspend_category",
    }
    for key in legacy_keys:
        if key in state and key not in signals:
            signals[key] = state[key]
    return signals


def _merge_state(state: CoachState, update: dict[str, Any]) -> CoachState:
    merged: CoachState = dict(state)
    merged.update(update)
    return merged


def _top_row(frame: pd.DataFrame, key: str) -> dict[str, Any]:
    if frame.empty:
        return {}
    return {column: frame.iloc[0][column] for column in frame.columns if column in frame.iloc[0] and column != key} | {
        key: frame.iloc[0][key]
    }


def _build_initial_state(
    transactions: pd.DataFrame,
    monthly_budget: float,
    prediction: dict[str, Any],
    addiction_scores: pd.DataFrame,
    weekly: pd.DataFrame,
    regret_stats: pd.DataFrame,
    merchant_late_night: pd.DataFrame,
) -> CoachState:
    top_addiction = _top_row(addiction_scores, "category")
    top_regret = _top_row(regret_stats, "category")
    top_merchant = _top_row(merchant_late_night, "merchant")
    latest_week = weekly.sort_values("datetime", ascending=False).head(1)
    latest_anomaly = bool(latest_week.iloc[0]["is_anomaly"]) if not latest_week.empty else False
    latest_severity = float(latest_week.iloc[0]["severity"]) if not latest_week.empty else 0.0
    top_category = str(top_addiction.get("category", "Essentials"))

    recent_window_start = transactions["datetime"].max() - pd.Timedelta(days=30)
    recent_category_spend = transactions.loc[
        (transactions["datetime"] >= recent_window_start) & (transactions["category"] == top_category),
        "amount",
    ].sum()

    budget_month_total = float(
        transactions[transactions["datetime"].dt.to_period("M") == transactions["datetime"].max().strftime("%Y-%m")]["amount"].sum()
    )

    signals: dict[str, Any] = {
        "anomaly_detected": latest_anomaly,
        "anomaly_score": latest_severity,
        "habit_score": float(top_addiction.get("score", 0) or 0) / 100.0,
        "habit_category": top_category,
        "days_left": prediction.get("days_left"),
        "regret_flag": bool((top_regret.get("mean_regret", 0.0) or 0.0) >= 3.5),
        "top_category": top_category,
        "burn_rate_daily": float(prediction.get("daily_burn", 0.0) or 0.0),
        "suggested_cap": float(prediction.get("projected_month_end", 0.0) or 0.0),
        "confidence_score": float(prediction.get("confidence", 0.0) or 0.0),
        "top_overspend_category": top_category,
        "top_category_recent_spend": round(float(recent_category_spend), 2),
        "top_regret_category": str(top_regret.get("category")) if top_regret.get("category") is not None else None,
        "top_regret_score": float(top_regret.get("mean_regret", 0.0) or 0.0),
        "late_night_merchant": str(top_merchant.get("merchant")) if top_merchant.get("merchant") is not None else None,
        "late_night_share": float(top_merchant.get("late_night_share", 0.0) or 0.0),
        "repeat_pattern_detected": False,
        "anomaly_severity": latest_severity,
        "current_spend": budget_month_total,
        "monthly_budget": monthly_budget,
        "projected_month_end": float(prediction.get("projected_month_end", 0.0) or 0.0),
    }

    return {
        "df": transactions,
        "budget": monthly_budget,
        "signals": signals,
        "current_spend": budget_month_total,
        "monthly_budget": monthly_budget,
        "projected_month_end": float(prediction.get("projected_month_end", 0.0) or 0.0),
        "burn_rate_daily": float(prediction.get("daily_burn", 0.0) or 0.0),
        "anomaly_detected": latest_anomaly,
        "anomaly_score": latest_severity,
        "habit_score": float(top_addiction.get("score", 0) or 0) / 100.0,
        "habit_category": top_category,
        "days_left": prediction.get("days_left"),
        "regret_flag": bool((top_regret.get("mean_regret", 0.0) or 0.0) >= 3.5),
        "status": "stable",
        "nudge": "",
        "suggested_cap": 0.0,
        "confidence_score": 0.0,
        "signal_weights": {"anomaly": 0.4, "habit": 0.3, "days": 0.2, "regret": 0.1},
        "top_overspend_category": top_category,
        "actions": [],
        "reward_signal": 0.0,
        "limit_window": "weekly",
        "repeat_pattern_detected": False,
        "anomaly_severity": latest_severity,
        "top_category_recent_spend": round(float(recent_category_spend), 2),
        "top_regret_category": str(top_regret.get("category")) if top_regret.get("category") is not None else None,
        "top_regret_score": float(top_regret.get("mean_regret", 0.0) or 0.0),
        "late_night_merchant": str(top_merchant.get("merchant")) if top_merchant.get("merchant") is not None else None,
        "late_night_share": float(top_merchant.get("late_night_share", 0.0) or 0.0),
    }


def anomaly_check(state: CoachState) -> dict[str, Any]:
    """LangGraph node: read anomaly signal and normalise anomaly score to [0, 1].

    Inputs from state: ``signals.anomaly_detected``, ``signals.anomaly_score``
    Outputs to state: ``anomaly_detected`` (bool), ``anomaly_score`` (float 0–1)
    """
    signals = _legacy_signal_bundle(state)
    anomaly_detected = bool(signals.get("anomaly_detected", state.get("anomaly_detected", False)))
    anomaly_score = _normalize_unit(signals.get("anomaly_score", signals.get("anomaly_severity", state.get("anomaly_score", 0.0))))
    if anomaly_detected and anomaly_score == 0.0:
        anomaly_score = 0.7
    return {
        "anomaly_detected": anomaly_detected,
        "anomaly_score": anomaly_score,
    }


def pattern_analysis(state: CoachState) -> dict[str, Any]:
    """LangGraph node: classify spending status (stable/watch/critical).

    Uses habit score, anomaly flag and days_left against named thresholds.
    Inputs: ``anomaly_detected``, ``signals.habit_score``, ``signals.days_left``
    Outputs: ``status``, ``habit_category``, ``days_left``, ``habit_score``, ``burn_rate_daily``
    """
    signals = _legacy_signal_bundle(state)
    anomaly_detected = bool(state.get("anomaly_detected", signals.get("anomaly_detected", False)))
    habit_score = _normalize_unit(signals.get("habit_score", state.get("habit_score", 0.0)))
    habit_category = str(signals.get("habit_category") or signals.get("top_category") or "Essentials")
    burn_rate_daily = _coerce_float(signals.get("burn_rate_daily", state.get("burn_rate_daily", 0.0)), 0.0)

    days_left_value = signals.get("days_left", state.get("days_left"))
    days_left = _coerce_int(days_left_value, 30)
    if days_left < 0:
        days_left = 0

    if anomaly_detected and habit_score >= CRITICAL_HABIT_THRESHOLD:
        status = "critical"
    elif anomaly_detected or habit_score >= WATCH_HABIT_THRESHOLD or days_left <= WATCH_DAYS_LEFT_THRESHOLD:
        status = "watch"
    else:
        status = "stable"

    return {
        "status": status,
        "habit_category": habit_category,
        "days_left": days_left,
        "habit_score": habit_score,
        "burn_rate_daily": burn_rate_daily,
    }


def nudge_generation(state: CoachState) -> dict[str, Any]:
    """LangGraph node: generate the short in-app nudge text.

    Computes a spending cap and formats a human-readable nudge message.
    Inputs: ``status``, ``habit_category``, ``days_left``, ``budget``, ``burn_rate_daily``
    Outputs: ``nudge`` (str)
    """
    signals = _legacy_signal_bundle(state)
    status = str(state.get("status") or "watch")
    habit_category = str(state.get("habit_category") or signals.get("habit_category") or signals.get("top_category") or "Essentials")
    days_left = _coerce_int(state.get("days_left", signals.get("days_left", 0)), 0)
    budget = _coerce_float(state.get("budget", signals.get("budget", 0.0)), 0.0)
    burn_rate_daily = _coerce_float(state.get("burn_rate_daily", signals.get("burn_rate_daily", 0.0)), 0.0)

    factor = CRITICAL_CAP_FACTOR if status == "critical" else WATCH_CAP_FACTOR if status == "watch" else STABLE_CAP_FACTOR
    cap = _coerce_float(signals.get("suggested_cap", 0.0), 0.0)
    if cap <= 0:
        if budget > 0:
            cap = budget * factor
        elif burn_rate_daily > 0:
            cap = burn_rate_daily * max(days_left, 1)
        else:
            cap = 0.0

    cap_text = f"₹{round(cap):,}"
    if status == "critical":
        nudge = f"{days_left} day(s) left. Freeze {habit_category} at {cap_text} for the next 48 hours."
    elif status == "watch":
        nudge = f"{days_left} day(s) left. Keep {habit_category} under {cap_text} for the next 3 days."
    else:
        nudge = f"{days_left} day(s) left. Hold {habit_category} to {cap_text} for the next 3 days."

    return {"nudge": nudge}


def cap_recommendation(state: CoachState) -> dict[str, Any]:
    """LangGraph node: compute the suggested spending cap for the top category.

    Derives a weekly cap using burn rate and days left, or a budget fraction.
    Inputs: ``status``, ``budget``, ``burn_rate_daily``, ``days_left``
    Outputs: ``suggested_cap`` (float), ``top_overspend_category`` (str)
    """
    signals = _legacy_signal_bundle(state)
    status = str(state.get("status") or "watch")
    budget = _coerce_float(state.get("budget", signals.get("budget", 0.0)), 0.0)
    burn_rate_daily = _coerce_float(state.get("burn_rate_daily", signals.get("burn_rate_daily", 0.0)), 0.0)
    days_left = _coerce_int(state.get("days_left", signals.get("days_left", 0)), 0)
    top_overspend_category = str(
        signals.get("top_overspend_category") or state.get("habit_category") or signals.get("top_category") or "Essentials"
    )

    suggested_cap = _coerce_float(signals.get("suggested_cap", 0.0), 0.0)
    if suggested_cap <= 0:
        if burn_rate_daily > 0 and days_left > 0:
            suggested_cap = min(budget, burn_rate_daily * days_left)
        else:
            factor = CRITICAL_CAP_STRICT if status == "critical" else WATCH_CAP_STRICT if status == "watch" else STABLE_CAP_STRICT
            suggested_cap = budget * factor

    return {
        "suggested_cap": round(max(suggested_cap, 0.0), 2),
        "top_overspend_category": top_overspend_category,
    }


def confidence_scoring(state: CoachState) -> dict[str, Any]:
    """LangGraph node: compute a weighted confidence score for the coach decision.

    Weights are defined in module constants ANOMALY_WEIGHT, HABIT_WEIGHT,
    DAYS_WEIGHT, REGRET_WEIGHT. Score range: [0, 1].
    Inputs: ``anomaly_detected``, ``habit_score``, ``days_left``, ``regret_flag``
    Outputs: ``confidence_score`` (float 0–1), ``signal_weights`` (dict)
    """
    anomaly = bool(state.get("anomaly_detected", False))
    habit_score = _normalize_unit(state.get("habit_score", 0.0))
    days_left = state.get("days_left")
    if days_left is None:
        days_component = 0.5
    else:
        days_component = 1.0 - min(max(float(days_left), 0.0), 30.0) / 30.0
    days_component = _clamp(days_component)
    regret_flag = bool(state.get("regret_flag", False))

    signal_weights = {
        "anomaly": ANOMALY_WEIGHT,
        "habit": HABIT_WEIGHT,
        "days": DAYS_WEIGHT,
        "regret": REGRET_WEIGHT,
    }
    confidence = (
        signal_weights["anomaly"] * (1.0 if anomaly else 0.0)
        + signal_weights["habit"] * habit_score
        + signal_weights["days"] * days_component
        + signal_weights["regret"] * (1.0 if regret_flag else 0.0)
    )
    return {
        "confidence_score": round(_clamp(confidence), 3),
        "signal_weights": signal_weights,
    }


def _validate_state(result: dict[str, Any]) -> None:
    required_keys = [
        "signals",
        "budget",
        "anomaly_detected",
        "anomaly_score",
        "habit_score",
        "habit_category",
        "days_left",
        "regret_flag",
        "status",
        "nudge",
        "suggested_cap",
        "confidence_score",
        "signal_weights",
        "top_overspend_category",
        "burn_rate_daily",
    ]
    missing = [key for key in required_keys if key not in result]
    if missing:
        LOGGER.warning("Coach state missing keys: %s", ", ".join(sorted(missing)))


def _build_coach() -> Any:
    if not LANGGRAPH_AVAILABLE:
        class _FallbackCoach:
            def invoke(self, initial_state: CoachState) -> dict[str, Any]:
                state = dict(initial_state)
                for node in (anomaly_check, pattern_analysis, nudge_generation, cap_recommendation, confidence_scoring):
                    state.update(node(state))
                return state

        return _FallbackCoach()

    graph = StateGraph(CoachState)
    graph.add_node("anomaly_check", anomaly_check)
    graph.add_node("pattern_analysis", pattern_analysis)
    graph.add_node("nudge_generation", nudge_generation)
    graph.add_node("cap_recommendation", cap_recommendation)
    graph.add_node("confidence_scoring", confidence_scoring)
    graph.add_edge(START, "anomaly_check")
    graph.add_edge("anomaly_check", "pattern_analysis")
    graph.add_edge("pattern_analysis", "nudge_generation")
    graph.add_edge("nudge_generation", "cap_recommendation")
    graph.add_edge("cap_recommendation", "confidence_scoring")
    graph.add_edge("confidence_scoring", END)
    return graph.compile()


coach = _build_coach()


def run_coach_workflow(signals: dict, budget: float) -> dict[str, Any]:
    """Execute the merge-safe coaching graph and return the final state dict.

    Low-level entry point for the LangGraph pipeline.  Each node mutates only
    its own keys so the full state accumulates without overwriting unrelated
    fields.

    Args:
        signals: Pre-built signal dict (e.g. from :func:`_build_initial_state`).
        budget:  Monthly budget in ₹.

    Returns:
        Final merged ``CoachState`` dict after all pipeline nodes have run.
    """
    initial_state: CoachState = {"signals": dict(signals or {}), "budget": float(budget)}
    result = coach.invoke(initial_state)
    if not isinstance(result, dict):
        result = dict(result)
    _validate_state(result)
    return result


# ---------------------------------------------------------------------------
# Legacy compatibility helpers used by tests and the rest of the repo.
# ---------------------------------------------------------------------------

def _detect_anomaly(state: CoachState) -> CoachState:
    projected_overspend = _coerce_float(state.get("projected_month_end", 0.0), 0.0) > _coerce_float(state.get("monthly_budget", 0.0), 0.0) if state.get("monthly_budget") else False
    anomaly_detected = bool(state.get("anomaly_detected", False) or projected_overspend)
    severity = _coerce_float(state.get("anomaly_severity", state.get("anomaly_score", 0.0)), 0.0)
    if projected_overspend and severity == 0.0:
        budget_gap = max(_coerce_float(state.get("projected_month_end", 0.0), 0.0) - _coerce_float(state.get("monthly_budget", 0.0), 0.0), 0.0)
        severity = round(budget_gap / max(_coerce_float(state.get("monthly_budget", 0.0), 0.0), 1.0), 2)

    actions = list(state.get("actions", []))
    if anomaly_detected:
        actions.append("Anomaly or overspend risk detected")
        status = "critical" if severity >= 1 else "watch"
    else:
        actions.append("No anomaly detected; continue baseline monitoring")
        status = "stable"

    return _merge_state(
        state,
        {
            "anomaly_detected": anomaly_detected,
            "anomaly_severity": severity,
            "status": status,
            "actions": actions,
        },
    )


def _route_after_detection(state: CoachState) -> str:
    anomaly_detected = bool(state.get("anomaly_detected", state.get("signals", {}).get("anomaly_detected", False)))
    return "repeat_pattern" if anomaly_detected else "narrative"


def _suggest_limit(state: CoachState) -> CoachState:
    recent_spend = _coerce_float(state.get("top_category_recent_spend", 0.0), 0.0)
    if recent_spend <= 0:
        suggested_limit = 0.0
    elif state.get("repeat_pattern_detected"):
        suggested_limit = round((recent_spend / 4.0) * 0.7, 2)
    elif state.get("anomaly_detected"):
        suggested_limit = round((recent_spend / 4.0) * 0.8, 2)
    else:
        suggested_limit = round((recent_spend / 4.0) * 0.9, 2)

    reward_signal = 1.0
    if state.get("anomaly_detected"):
        reward_signal += 1.5
    if state.get("repeat_pattern_detected"):
        reward_signal += 1.5
    if state.get("narrative_provider") == "Groq":
        reward_signal += 1.0

    return _merge_state(
        state,
        {
            "suggested_limit": suggested_limit,
            "limit_window": "weekly",
            "reward_signal": reward_signal,
        },
    )


def _derive_repeat_pattern(state: dict[str, Any]) -> bool:
    """Detect whether the user exhibits a repeating compulsive spending pattern.

    A repeat pattern is flagged when all three conditions hold:
      1. An anomaly was detected this week.
      2. The habit score is at or above the ``REPEAT_PATTERN_HABIT_THRESHOLD``.
      3. Either the regret score or the late-night share exceeds its threshold.

    Args:
        state: Merged ``CoachState`` dict from the completed pipeline run.

    Returns:
        ``True`` if a repeat compulsive pattern is detected, ``False`` otherwise.
    """
    habit_score = _normalize_unit(state.get("habit_score", 0.0))
    regret_score = _coerce_float(state.get("top_regret_score", 0.0), 0.0)
    late_night_share = _coerce_float(state.get("late_night_share", 0.0), 0.0)
    anomaly_detected = bool(state.get("anomaly_detected", False))
    return anomaly_detected and habit_score >= 0.65 and (regret_score >= 3.5 or late_night_share >= 30.0)


def run_spending_coach_agent(
    transactions: pd.DataFrame,
    monthly_budget: float,
    prediction: dict[str, Any],
    addiction_scores: pd.DataFrame,
    weekly: pd.DataFrame,
    regret_stats: pd.DataFrame,
    merchant_late_night: pd.DataFrame,
) -> SpendingCoachResult:
    """High-level entry point used by the FastAPI layer and tests.

    Builds the initial state from raw analytics frames, runs the LangGraph
    coaching pipeline, then generates the Gemini (or template) narrative and
    assembles the final :class:`SpendingCoachResult`.

    Args:
        transactions:        Cleaned transaction DataFrame.
        monthly_budget:      User-declared monthly budget (₹).
        prediction:          Output of :func:`src.analytics.predict_broke_date`.
        addiction_scores:    Output of :func:`src.analytics.compute_addiction_scores`.
        weekly:              Output of :func:`src.analytics.detect_weekly_anomalies`.
        regret_stats:        Output of :func:`src.regret.compute_regret_stats`.
        merchant_late_night: Output of :func:`src.merchant.late_night_merchant_alerts`.

    Returns:
        A fully-populated :class:`SpendingCoachResult` dataclass.
    """
    with _COACH_GRAPH_LOCK:
        initial_state = _build_initial_state(
            transactions=transactions,
            monthly_budget=monthly_budget,
            prediction=prediction,
            addiction_scores=addiction_scores,
            weekly=weekly,
            regret_stats=regret_stats,
            merchant_late_night=merchant_late_night,
        )
        final_state = run_coach_workflow(initial_state["signals"], monthly_budget)
        final_state = _merge_state(final_state, {k: v for k, v in initial_state.items() if k not in {"signals", "budget"}})

    narrative_context = {
        **final_state,
        "top_category": final_state.get("habit_category") or final_state.get("top_overspend_category") or "Essentials",
    }
    narrative_text = generate_narrative(narrative_context)
    api_key_present = bool(os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY"))
    narrative_provider = "Gemini" if api_key_present else "Rule-based fallback"
    narrative_model = DEFAULT_GEMINI_MODEL if narrative_provider == "Gemini" else "deterministic-template"

    repeat_pattern_detected = _derive_repeat_pattern(final_state)
    anomaly_severity = _coerce_float(final_state.get("anomaly_score", 0.0), 0.0)
    suggested_limit = _coerce_float(final_state.get("suggested_cap", 0.0), 0.0)
    reward_signal = round(
        1.0
        + (1.5 if bool(final_state.get("anomaly_detected", False)) else 0.0)
        + (1.5 if repeat_pattern_detected else 0.0)
        + (1.0 if narrative_provider == "Gemini" else 0.0),
        2,
    )

    coach_title = f"{final_state.get('habit_category', 'Spending')} coach"
    if final_state.get("status") == "critical":
        coach_title = f"{final_state.get('habit_category', 'Spending')} is now a coaching target"
    elif final_state.get("status") == "watch":
        coach_title = f"{final_state.get('habit_category', 'Spending')} needs a reset"

    actions = [
        f"Status resolved as {final_state.get('status', 'stable')}",
        f"Nudge prepared for {final_state.get('habit_category', 'spending')}",
        "Limit suggestion computed",
    ]

    return SpendingCoachResult(
        title=str(coach_title),
        status=str(final_state.get("status", "stable")),
        anomaly_detected=bool(final_state.get("anomaly_detected", False)),
        anomaly_severity=anomaly_severity,
        repeat_pattern_detected=repeat_pattern_detected,
        suggested_category=str(final_state.get("top_overspend_category", final_state.get("habit_category", "Essentials"))),
        narrative=narrative_text,
        narrative_provider=narrative_provider,
        narrative_model=narrative_model,
        nudge=str(final_state.get("nudge", "")),
        suggested_limit=suggested_limit,
        limit_window=str(final_state.get("limit_window", "weekly")),
        reward_signal=reward_signal,
        actions=actions,
    )
