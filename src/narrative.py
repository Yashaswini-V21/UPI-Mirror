from __future__ import annotations

import logging
import os
from dataclasses import dataclass
from typing import Any


DEFAULT_GROQ_MODEL = "llama-3.3-70b-versatile"
LOGGER = logging.getLogger(__name__)


@dataclass(slots=True)
class SpendingNarrative:
    text: str
    provider: str
    model: str
    used_fallback: bool


def _build_fallback_narrative(context: dict[str, Any]) -> SpendingNarrative:
    top_category = context.get("top_category") or "discretionary spending"
    top_score = int(context.get("top_addiction_score") or 0)
    anomaly_detected = bool(context.get("anomaly_detected"))
    repeat_pattern_detected = bool(context.get("repeat_pattern_detected"))
    projected_month_end = float(context.get("projected_month_end") or 0.0)
    monthly_budget = float(context.get("monthly_budget") or 0.0)
    days_left = context.get("days_left")
    late_night_merchant = context.get("late_night_merchant") or ""
    late_night_share = float(context.get("late_night_share") or 0.0)
    top_regret_category = context.get("top_regret_category") or ""
    top_regret_score = float(context.get("top_regret_score") or 0.0)

    lead = (
        f"Spending risk is elevated because {top_category} is behaving like a repeated habit."
        if anomaly_detected
        else f"No major anomaly is firing today, but {top_category} is still the strongest behavior signal."
    )

    budget_line = (
        f"Projected month-end spend is Rs. {projected_month_end:,.0f} against a budget of Rs. {monthly_budget:,.0f}."
        if monthly_budget > 0
        else f"Projected month-end spend is Rs. {projected_month_end:,.0f}."
    )

    time_line = (
        f"At the current pace, the budget buffer lasts about {days_left} more day(s)."
        if days_left is not None
        else "The current run-rate does not yet imply a hard broke date."
    )

    pattern_line = (
        f"The pattern looks repeatable: {top_category} scores {top_score}/100 and lines up with regret or late-night behavior."
        if repeat_pattern_detected
        else f"The signal is mostly pace-driven right now: {top_category} scores {top_score}/100 but the repeat pattern is still weak."
    )

    late_night_line = (
        f"{late_night_merchant} is contributing {late_night_share:.0f}% late-night activity."
        if late_night_merchant and late_night_share > 0
        else "Late-night merchant behavior is not the main driver today."
    )

    regret_line = (
        f"Highest regret remains {top_regret_category} at {top_regret_score:.1f}/5."
        if top_regret_category and top_regret_score > 0
        else "Regret data is limited, so the coach is leaning on spending rhythm and anomaly signals."
    )

    return SpendingNarrative(
        text=" ".join([lead, budget_line, time_line, pattern_line, late_night_line, regret_line]),
        provider="Rule-based fallback",
        model="deterministic-template",
        used_fallback=True,
    )


def generate_spending_narrative(
    context: dict[str, Any],
    *,
    model: str = DEFAULT_GROQ_MODEL,
) -> SpendingNarrative:
    try:
        from langchain_groq import ChatGroq
    except ImportError:
        return _build_fallback_narrative(context)

    if not os.getenv("GROQ_API_KEY"):
        return _build_fallback_narrative(context)

    system_prompt = (
        "You are a blunt but useful personal finance coach. "
        "Given behavioral finance signals, write a short narrative with three parts: risk, why it is happening, and what to do next. "
        "Be specific, avoid hype, and keep it under 110 words."
    )
    user_prompt = (
        "Create a daily spend narrative from this context:\n"
        f"{context}\n"
        "Mention budget risk, repeat behavior, regret or late-night patterns if relevant, and end with a concrete next action."
    )

    try:
        llm = ChatGroq(model=model, temperature=0.2, max_retries=2)
        response = llm.invoke(
            [
                ("system", system_prompt),
                ("human", user_prompt),
            ]
        )
        content = getattr(response, "content", "")
        if isinstance(content, list):
            content = " ".join(str(item) for item in content)
        content = str(content).strip()
        if not content:
            return _build_fallback_narrative(context)
        return SpendingNarrative(
            text=content,
            provider="Groq",
            model=model,
            used_fallback=False,
        )
    except Exception as exc:
        LOGGER.warning("Groq narrative generation failed, using fallback: %s", exc)
        return _build_fallback_narrative(context)