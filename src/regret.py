from __future__ import annotations

import pandas as pd


def compute_regret_stats(transactions: pd.DataFrame) -> pd.DataFrame:
    """
    Per-category regret statistics.

    Expects a `regret` column (1–5 int) and `amount`, `datetime`, `category`.
    Returns a DataFrame with mean_regret, high_regret_share, costly_regret_index,
    and a plain-language verdict for each category.
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
    """Average regret score per hour-of-day across all categories."""
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
    """
    Bucket transactions by amount quintile and show mean regret per bucket.
    Reveals whether higher spend → higher regret.
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
    """Single-sentence shame-bot insight for the hero section."""
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
