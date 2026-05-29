"""src/regret.py
================
Per-category regret analytics for Kira-AI.

Functions:
  - compute_regret_stats():       Mean regret, high-regret share, and verdict per category.
  - regret_by_hour():             Average regret score per hour-of-day.
  - regret_amount_correlation():  Regret vs. spend-amount quintile analysis.
  - top_regret_insight():         Single-sentence hero insight for the highest-regret category.

Expected columns: ``datetime``, ``amount``, ``category``, ``regret`` (1–5 int).
All functions return an empty DataFrame / fallback string if ``regret`` is absent.
"""

from __future__ import annotations

import pandas as pd


def compute_regret_stats(transactions: pd.DataFrame) -> pd.DataFrame:
    """Compute per-category regret statistics.

    For each spending category, calculates:
      - **mean_regret** – average regret score (1–5).
      - **high_regret_share** – percentage of transactions rated ≥ 4.
      - **costly_regret_index** – composite of regret intensity × spend weight (0–100).
      - **verdict** – plain-language label (e.g. "Compulsive — stop or cut hard").

    Args:
        transactions: Full transaction DataFrame. Must contain
                      ``regret`` (1–5), ``amount``, ``datetime``, and ``category`` columns.

    Returns:
        DataFrame sorted by ``mean_regret`` descending.  Returns an empty
        DataFrame with the correct schema if ``regret`` is absent.
    """
    if "regret" not in transactions.columns:
        return pd.DataFrame(
            columns=["category", "mean_regret", "high_regret_share", "costly_regret_index", "verdict"]
        )

    df = transactions.dropna(subset=["regret"]).copy()
    df["regret"] = pd.to_numeric(df["regret"], errors="coerce").clip(1, 5)
    df = df.dropna(subset=["regret"])
    df["high_regret"] = df["regret"] >= 4

    cat_mean = df.groupby("category")["regret"].mean().round(2)
    cat_high = df.groupby("category")["high_regret"].mean().round(3)
    cat_spend = df.groupby("category")["amount"].sum()
    cat_total_spend = max(float(cat_spend.max()), 1.0)
    costly_regret = ((cat_mean / 5) * (cat_spend / cat_total_spend) * 100).round(1)

    def _verdict(mean_val: float) -> str:
        if mean_val >= 4.0:
            return "Compulsive — stop or cut hard"
        if mean_val >= 3.0:
            return "Mixed — worth reviewing"
        if mean_val >= 2.0:
            return "Low regret — mostly intentional"
        return "No regret — keep it"

    stats = pd.DataFrame(
        {
            "category": cat_mean.index,
            "mean_regret": cat_mean.values,
            "high_regret_share": (cat_high.reindex(cat_mean.index).fillna(0) * 100).round(1).values,
            "costly_regret_index": costly_regret.reindex(cat_mean.index).fillna(0).values,
            "verdict": [_verdict(v) for v in cat_mean.values],
        }
    ).sort_values("mean_regret", ascending=False).reset_index(drop=True)

    return stats


def regret_by_hour(transactions: pd.DataFrame) -> pd.DataFrame:
    """Return average regret score and transaction count for each hour of the day.

    Args:
        transactions: Full transaction DataFrame with a ``regret`` column.

    Returns:
        DataFrame with columns ``hour`` (0–23), ``mean_regret``, ``transaction_count``.
        Empty DataFrame with the correct schema if ``regret`` is absent.
    """
    if "regret" not in transactions.columns:
        return pd.DataFrame(columns=["hour", "mean_regret", "transaction_count"])

    df = transactions.dropna(subset=["regret"]).copy()
    df["regret"] = pd.to_numeric(df["regret"], errors="coerce").clip(1, 5)
    df = df.dropna(subset=["regret"])
    df["hour"] = df["datetime"].dt.hour

    hourly = (
        df.groupby("hour")["regret"]
        .agg(mean_regret="mean", transaction_count="count")
        .reset_index()
    )
    hourly["mean_regret"] = hourly["mean_regret"].round(2)
    return hourly


def regret_amount_correlation(transactions: pd.DataFrame) -> pd.DataFrame:
    """Bucket transactions by spend-amount quintile and show mean regret per bucket.

    Reveals whether higher spend amounts correlate with higher regret —
    a key signal for compulsive vs. intentional spending.

    Args:
        transactions: Full transaction DataFrame with ``regret`` and ``amount`` columns.

    Returns:
        DataFrame with columns ``amount_bucket``, ``mean_regret``, ``transaction_count``.
        Empty DataFrame with the correct schema if ``regret`` is absent.
    """
    if "regret" not in transactions.columns:
        return pd.DataFrame(columns=["amount_bucket", "mean_regret", "transaction_count"])

    df = transactions.dropna(subset=["regret"]).copy()
    df["regret"] = pd.to_numeric(df["regret"], errors="coerce").clip(1, 5)
    df = df.dropna(subset=["regret"])

    df["amount_bucket"] = pd.qcut(df["amount"], q=5, labels=["Very low", "Low", "Medium", "High", "Very high"], duplicates="drop")
    result = (
        df.groupby("amount_bucket", observed=True)["regret"]
        .agg(mean_regret="mean", transaction_count="count")
        .reset_index()
    )
    result["mean_regret"] = result["mean_regret"].round(2)
    return result


def top_regret_insight(regret_stats: pd.DataFrame) -> str:
    """Generate a single-sentence coaching insight for the highest-regret category.

    Args:
        regret_stats: Output of :func:`compute_regret_stats`.

    Returns:
        A plain-language string suitable for the dashboard hero section.
        Falls back gracefully to ``"No regret data available yet."`` on empty input.
    """
    if regret_stats.empty:
        return "No regret data available yet."

    top = regret_stats.iloc[0]
    category = top["category"]
    score = top["mean_regret"]
    high_share = top["high_regret_share"]

    if score >= 4.0:
        return (
            f"Your {category} spending has a regret score of {score}/5. "
            f"{high_share:.0f}% of those transactions felt like a mistake."
        )
    if score >= 3.0:
        return (
            f"Your {category} spending scores {score}/5 on regret — worth a second look."
        )
    return f"Your spending looks intentional. Highest regret is {category} at {score}/5."
