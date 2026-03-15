from __future__ import annotations

import pandas as pd


def top_merchants_by_spend(transactions: pd.DataFrame, top_n: int = 10) -> pd.DataFrame:
    """Rank merchants by total spend with transaction count and average amount."""
    grouped = (
        transactions.groupby("merchant")
        .agg(
            total_spend=("amount", "sum"),
            transaction_count=("amount", "count"),
            avg_amount=("amount", "mean"),
        )
        .reset_index()
        .sort_values("total_spend", ascending=False)
        .head(top_n)
    )
    grouped["total_spend"] = grouped["total_spend"].round(2)
    grouped["avg_amount"] = grouped["avg_amount"].round(2)
    return grouped.reset_index(drop=True)


def late_night_merchant_alerts(transactions: pd.DataFrame, hour_threshold: int = 22) -> pd.DataFrame:
    """
    Flag merchants where a significant share of transactions happen late at night.
    These are the 'Swiggy after 10PM' patterns that drain budgets silently.
    """
    df = transactions.copy()
    df["is_late_night"] = df["datetime"].dt.hour >= hour_threshold

    merchant_total = df.groupby("merchant").size().rename("total_count")
    merchant_late = df[df["is_late_night"]].groupby("merchant").size().rename("late_night_count")
    merchant_spend = df.groupby("merchant")["amount"].sum().rename("total_spend")
    merchant_late_spend = (
        df[df["is_late_night"]].groupby("merchant")["amount"].sum().rename("late_night_spend")
    )

    alerts = pd.concat([merchant_total, merchant_late, merchant_spend, merchant_late_spend], axis=1).fillna(0)
    alerts["late_night_share"] = (alerts["late_night_count"] / alerts["total_count"] * 100).round(1)
    alerts = alerts[alerts["late_night_share"] >= 30].sort_values("late_night_share", ascending=False)
    alerts = alerts.reset_index().rename(columns={"index": "merchant"})
    alerts["total_spend"] = alerts["total_spend"].round(2)
    alerts["late_night_spend"] = alerts["late_night_spend"].round(2)
    return alerts[["merchant", "late_night_share", "late_night_count", "late_night_spend", "total_spend"]].reset_index(drop=True)


def merchant_regret_correlation(transactions: pd.DataFrame) -> pd.DataFrame:
    """
    For each merchant, compute average regret score and total spend.
    Requires a `regret` column — silently returns empty if absent.
    """
    if "regret" not in transactions.columns:
        return pd.DataFrame(columns=["merchant", "avg_regret", "total_spend", "transaction_count"])

    df = transactions.dropna(subset=["regret"]).copy()
    df["regret"] = pd.to_numeric(df["regret"], errors="coerce").clip(1, 5)
    df = df.dropna(subset=["regret"])

    result = (
        df.groupby("merchant")
        .agg(
            avg_regret=("regret", "mean"),
            total_spend=("amount", "sum"),
            transaction_count=("amount", "count"),
        )
        .reset_index()
        .sort_values("avg_regret", ascending=False)
    )
    result["avg_regret"] = result["avg_regret"].round(2)
    result["total_spend"] = result["total_spend"].round(2)
    return result.reset_index(drop=True)


def merchant_spend_trend(transactions: pd.DataFrame, merchant: str) -> pd.DataFrame:
    """Weekly spend trend for a single merchant."""
    df = transactions[transactions["merchant"] == merchant].copy()
    if df.empty:
        return pd.DataFrame(columns=["week_end", "weekly_spend"])

    weekly = (
        df.set_index("datetime")["amount"]
        .resample("W")
        .sum()
        .reset_index()
        .rename(columns={"datetime": "week_end", "amount": "weekly_spend"})
    )
    return weekly


def top_late_night_insight(alerts: pd.DataFrame) -> str:
    """Single-sentence insight for the most problematic late-night merchant."""
    if alerts.empty:
        return "No late-night merchant patterns detected."
    top = alerts.iloc[0]
    return (
        f"{top['merchant']} — {top['late_night_share']:.0f}% of orders placed after 10 PM, "
        f"costing Rs. {top['late_night_spend']:,.0f} in late-night spend."
    )
