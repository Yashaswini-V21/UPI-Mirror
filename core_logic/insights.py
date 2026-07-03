from __future__ import annotations

from datetime import datetime

import pandas as pd


def generate_linkedin_card(
    current_spend: float,
    monthly_budget: float,
    broke_date: datetime | None,
    top_addiction_category: str,
    top_addiction_score: int,
    late_night_merchant: str | None,
    late_night_share: float,
    top_regret_category: str | None,
    top_regret_score: float,
) -> str:
    """
    Generate a copy-paste LinkedIn post with blurred numbers replaced by relative phrases.
    Real numbers replaced with qualitative descriptors so the post is safe to share publicly.
    """
    broke_line = (
        f"My model predicts I'll hit my budget limit by {broke_date.strftime('%d %b')}."
        if broke_date
        else "My model says I'm within budget this month."
    )

    budget_pct = round(current_spend / monthly_budget * 100) if monthly_budget else 0
    spend_line = f"I've spent {budget_pct}% of my monthly budget in the first half of the month."

    addiction_line = (
        f"My highest-scoring habit: {top_addiction_category} — addiction score {top_addiction_score}/100."
        if top_addiction_score > 0
        else ""
    )

    late_night_line = (
        f"{late_night_merchant}: {late_night_share:.0f}% of my orders happen after 10 PM."
        if late_night_merchant and late_night_share > 0
        else ""
    )

    regret_line = (
        f"Most regretted category: {top_regret_category} — avg regret {top_regret_score}/5."
        if top_regret_category and top_regret_score > 0
        else ""
    )

    lines = [
        "I built a shame bot for my UPI spending. Here's what it found 🤡",
        "",
        spend_line,
        broke_line,
        addiction_line,
        late_night_line,
        regret_line,
        "",
        "Built with: Pandas + Scikit-learn + Streamlit. Personal pain → real product.",
        "#DataScience #FinTech #BuildInPublic #UPIMirror",
    ]

    return "\n".join(line for line in lines if line)


def generate_summary_stats(
    transactions: pd.DataFrame,
    current_spend: float,
    monthly_budget: float,
    prediction: dict,
    addiction_scores: pd.DataFrame,
    regret_stats: pd.DataFrame,
    merchant_late_night: pd.DataFrame,
) -> pd.DataFrame:
    """Flat key-value table of all headline stats for download as CSV."""
    rows: list[dict[str, str]] = []

    rows.append({"metric": "Month-to-date spend (Rs.)", "value": f"{current_spend:,.0f}"})
    rows.append({"metric": "Monthly budget (Rs.)", "value": f"{monthly_budget:,.0f}"})
    rows.append({"metric": "Budget used (%)", "value": f"{round(current_spend / monthly_budget * 100) if monthly_budget else 0}"})
    rows.append({"metric": "Daily burn rate (Rs.)", "value": f"{prediction.get('daily_burn', 0):,.0f}"})
    rows.append({"metric": "Projected month-end spend (Rs.)", "value": f"{prediction.get('projected_month_end', 0):,.0f}"})

    broke = prediction.get("predicted_date")
    rows.append({"metric": "Predicted broke date", "value": broke.strftime("%d %b %Y") if broke else "Within budget"})

    total_txns = len(transactions)
    rows.append({"metric": "Total transactions (90 days)", "value": str(total_txns)})

    if not addiction_scores.empty:
        top = addiction_scores.iloc[0]
        rows.append({"metric": "Top habit category", "value": str(top["category"])})
        rows.append({"metric": "Top habit addiction score", "value": str(int(top["score"]))})

    if not regret_stats.empty:
        top_r = regret_stats.iloc[0]
        rows.append({"metric": "Most regretted category", "value": str(top_r["category"])})
        rows.append({"metric": "Regret score (mean)", "value": str(top_r["mean_regret"])})

    if not merchant_late_night.empty:
        top_m = merchant_late_night.iloc[0]
        rows.append({"metric": "Late-night merchant", "value": str(top_m["merchant"])})
        rows.append({"metric": "Late-night order share (%)", "value": str(top_m["late_night_share"])})

    return pd.DataFrame(rows)


def blur_number(value: float, symbol: str = "Rs.") -> str:
    """Return a blurred representation — shows magnitude but not exact number."""
    if value < 500:
        return f"{symbol} ███"
    if value < 2000:
        return f"{symbol} █,███"
    if value < 10000:
        return f"{symbol} █,███"
    return f"{symbol} ██,███"
