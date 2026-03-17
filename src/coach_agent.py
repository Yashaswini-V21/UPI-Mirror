from __future__ import annotations

from dataclasses import asdict, dataclass
from typing import Any, TypedDict

import pandas as pd

from src.narrative import SpendingNarrative, generate_spending_narrative

try:
    from langgraph.graph import END, START, StateGraph

    LANGGRAPH_AVAILABLE = True
except ImportError:
    END = "__end__"
    START = "__start__"
    StateGraph = None
    LANGGRAPH_AVAILABLE = False


class CoachState(TypedDict, total=False):
    current_spend: float
    monthly_budget: float
    projected_month_end: float
    daily_burn: float
    days_left: int | None
    anomaly_detected: bool
    anomaly_severity: float
    repeat_pattern_detected: bool
    top_category: str
    top_addiction_score: int
    top_category_recent_spend: float
    top_regret_category: str | None
    top_regret_score: float
    late_night_merchant: str | None
    late_night_share: float
    narrative: str
    narrative_provider: str
    narrative_model: str
    coach_title: str
    status: str
    nudge: str
    suggested_limit: float
    limit_window: str
    reward_signal: float
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

    return {
        "current_spend": float(transactions[transactions["datetime"].dt.to_period("M") == transactions["datetime"].max().strftime("%Y-%m")]["amount"].sum()),
        "monthly_budget": monthly_budget,
        "projected_month_end": float(prediction.get("projected_month_end", 0.0) or 0.0),
        "daily_burn": float(prediction.get("daily_burn", 0.0) or 0.0),
        "days_left": prediction.get("days_left"),
        "anomaly_detected": latest_anomaly,
        "anomaly_severity": latest_severity,
        "repeat_pattern_detected": False,
        "top_category": top_category,
        "top_addiction_score": int(top_addiction.get("score", 0) or 0),
        "top_category_recent_spend": round(float(recent_category_spend), 2),
        "top_regret_category": str(top_regret.get("category")) if top_regret.get("category") is not None else None,
        "top_regret_score": float(top_regret.get("mean_regret", 0.0) or 0.0),
        "late_night_merchant": str(top_merchant.get("merchant")) if top_merchant.get("merchant") is not None else None,
        "late_night_share": float(top_merchant.get("late_night_share", 0.0) or 0.0),
        "narrative": "",
        "narrative_provider": "Pending",
        "narrative_model": "Pending",
        "coach_title": "Daily spending coach",
        "status": "stable",
        "nudge": "",
        "suggested_limit": 0.0,
        "limit_window": "weekly",
        "reward_signal": 0.0,
        "actions": [],
    }


def _detect_anomaly(state: CoachState) -> CoachState:
    projected_overspend = state["projected_month_end"] > state["monthly_budget"] if state["monthly_budget"] else False
    anomaly_detected = bool(state["anomaly_detected"] or projected_overspend)
    severity = float(state["anomaly_severity"])
    if projected_overspend and severity == 0:
        budget_gap = max(state["projected_month_end"] - state["monthly_budget"], 0.0)
        severity = round(budget_gap / max(state["monthly_budget"], 1.0), 2)

    actions = list(state["actions"])
    if anomaly_detected:
        actions.append("Anomaly or overspend risk detected")
        status = "critical" if severity >= 1 else "watch"
    else:
        actions.append("No anomaly detected; continue baseline monitoring")
        status = "stable"

    return {
        **state,
        "anomaly_detected": anomaly_detected,
        "anomaly_severity": severity,
        "status": status,
        "actions": actions,
    }


def _repeat_pattern_check(state: CoachState) -> CoachState:
    addiction_score = state["top_addiction_score"]
    same_regret_category = state["top_regret_category"] == state["top_category"]
    late_night_pattern = state["late_night_share"] >= 30
    repeat_pattern_detected = addiction_score >= 65 and (same_regret_category or late_night_pattern)

    actions = list(state["actions"])
    if repeat_pattern_detected:
        actions.append("Repeat pattern confirmed from addiction, regret, or late-night signals")
    else:
        actions.append("Repeat pattern not strong enough yet")

    return {
        **state,
        "repeat_pattern_detected": repeat_pattern_detected,
        "actions": actions,
    }


def _generate_narrative(state: CoachState) -> CoachState:
    narrative_result: SpendingNarrative = generate_spending_narrative(dict(state))
    actions = list(state["actions"])
    actions.append(f"Narrative generated via {narrative_result.provider}")
    return {
        **state,
        "narrative": narrative_result.text,
        "narrative_provider": narrative_result.provider,
        "narrative_model": narrative_result.model,
        "actions": actions,
    }


def _personalise_nudge(state: CoachState) -> CoachState:
    category = state["top_category"]
    days_left = state["days_left"]

    if state["anomaly_detected"] and state["repeat_pattern_detected"]:
        nudge = (
            f"Freeze {category} for the next 48 hours, then re-enter with a fixed cap. "
            f"The signal is repeating, not random."
        )
        title = f"{category} is now a coaching target"
    elif state["anomaly_detected"]:
        nudge = (
            f"Slow {category} immediately for the rest of the week. "
            f"You are not in a spiral yet, but the pace is above baseline."
        )
        title = f"{category} needs a reset"
    else:
        date_hint = f" Keep the next {days_left} day(s) clean." if days_left is not None else ""
        nudge = f"No hard stop today. Protect cash by avoiding impulse {category} spends.{date_hint}"
        title = "Coach says stay disciplined"

    actions = list(state["actions"])
    actions.append("Personalised nudge prepared")
    return {
        **state,
        "nudge": nudge,
        "coach_title": title,
        "actions": actions,
    }


def _suggest_limit(state: CoachState) -> CoachState:
    recent_spend = state["top_category_recent_spend"]
    if recent_spend <= 0:
        suggested_limit = 0.0
    elif state["repeat_pattern_detected"]:
        suggested_limit = round((recent_spend / 4.0) * 0.7, 2)
    elif state["anomaly_detected"]:
        suggested_limit = round((recent_spend / 4.0) * 0.8, 2)
    else:
        suggested_limit = round((recent_spend / 4.0) * 0.9, 2)

    reward_signal = 1.0
    if state["anomaly_detected"]:
        reward_signal += 1.5
    if state["repeat_pattern_detected"]:
        reward_signal += 1.5
    if state["narrative_provider"] == "Groq":
        reward_signal += 1.0

    actions = list(state["actions"])
    actions.append("Limit suggestion computed")

    return {
        **state,
        "suggested_limit": suggested_limit,
        "limit_window": "weekly",
        "reward_signal": reward_signal,
        "actions": actions,
    }


def _route_after_detection(state: CoachState) -> str:
    return "repeat_pattern" if state["anomaly_detected"] else "narrative"


def _run_without_langgraph(initial_state: CoachState) -> CoachState:
    state = _detect_anomaly(initial_state)
    if state["anomaly_detected"]:
        state = _repeat_pattern_check(state)
    state = _generate_narrative(state)
    state = _personalise_nudge(state)
    state = _suggest_limit(state)
    return state


def _compile_graph():
    graph = StateGraph(CoachState)
    graph.add_node("detect_anomaly", _detect_anomaly)
    graph.add_node("repeat_pattern", _repeat_pattern_check)
    graph.add_node("narrative", _generate_narrative)
    graph.add_node("personalise_nudge", _personalise_nudge)
    graph.add_node("suggest_limit", _suggest_limit)
    graph.add_edge(START, "detect_anomaly")
    graph.add_conditional_edges(
        "detect_anomaly",
        _route_after_detection,
        {
            "repeat_pattern": "repeat_pattern",
            "narrative": "narrative",
        },
    )
    graph.add_edge("repeat_pattern", "narrative")
    graph.add_edge("narrative", "personalise_nudge")
    graph.add_edge("personalise_nudge", "suggest_limit")
    graph.add_edge("suggest_limit", END)
    return graph.compile()


def run_spending_coach_agent(
    transactions: pd.DataFrame,
    monthly_budget: float,
    prediction: dict[str, Any],
    addiction_scores: pd.DataFrame,
    weekly: pd.DataFrame,
    regret_stats: pd.DataFrame,
    merchant_late_night: pd.DataFrame,
) -> SpendingCoachResult:
    initial_state = _build_initial_state(
        transactions=transactions,
        monthly_budget=monthly_budget,
        prediction=prediction,
        addiction_scores=addiction_scores,
        weekly=weekly,
        regret_stats=regret_stats,
        merchant_late_night=merchant_late_night,
    )

    if LANGGRAPH_AVAILABLE:
        final_state = _compile_graph().invoke(initial_state)
    else:
        final_state = _run_without_langgraph(initial_state)

    return SpendingCoachResult(
        title=str(final_state["coach_title"]),
        status=str(final_state["status"]),
        anomaly_detected=bool(final_state["anomaly_detected"]),
        anomaly_severity=float(final_state["anomaly_severity"]),
        repeat_pattern_detected=bool(final_state["repeat_pattern_detected"]),
        suggested_category=str(final_state["top_category"]),
        narrative=str(final_state["narrative"]),
        narrative_provider=str(final_state["narrative_provider"]),
        narrative_model=str(final_state["narrative_model"]),
        nudge=str(final_state["nudge"]),
        suggested_limit=float(final_state["suggested_limit"]),
        limit_window=str(final_state["limit_window"]),
        reward_signal=float(final_state["reward_signal"]),
        actions=list(final_state["actions"]),
    )