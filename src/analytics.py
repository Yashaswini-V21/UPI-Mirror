from __future__ import annotations

from calendar import monthrange
from datetime import datetime

import pandas as pd
from sklearn.linear_model import LinearRegression


def month_to_date_spend(transactions: pd.DataFrame, reference_date: datetime | None = None) -> float:
    reference_date = reference_date or datetime.now()
    month_data = transactions[transactions["datetime"].dt.to_period("M") == reference_date.strftime("%Y-%m")]
    return float(month_data["amount"].sum())


def predict_broke_date(
    transactions: pd.DataFrame,
    monthly_budget: float,
    reference_date: datetime | None = None,
) -> dict[str, object]:
    reference_date = reference_date or datetime.now()
    month_mask = transactions["datetime"].dt.to_period("M") == reference_date.strftime("%Y-%m")
    month_data = transactions.loc[month_mask].copy()

    if month_data.empty:
        return {
            "predicted_date": None,
            "daily_burn": 0.0,
            "projected_month_end": 0.0,
            "days_left": None,
            "confidence": 0.0,
        }

    month_start = reference_date.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    days_elapsed = reference_date.day
    days_in_month = monthrange(reference_date.year, reference_date.month)[1]

    daily = (
        month_data.groupby(month_data["datetime"].dt.floor("D"))["amount"]
        .sum()
        .reindex(pd.date_range(month_start, periods=days_elapsed, freq="D"), fill_value=0.0)
    )
    cumulative = daily.cumsum()

    x_train = pd.DataFrame({"day_index": range(1, len(cumulative) + 1)})
    model = LinearRegression()
    model.fit(x_train, cumulative)

    slope = float(model.coef_[0])
    intercept = float(model.intercept_)

    if slope <= 0:
        predicted_date = None
        days_left = None
    else:
        projected_budget_day = (monthly_budget - intercept) / slope
        if projected_budget_day < 1:
            projected_budget_day = 1
        predicted_day = round(projected_budget_day)
        predicted_day = min(max(predicted_day, 1), days_in_month)
        predicted_date = month_start + pd.Timedelta(days=predicted_day - 1)
        days_left = (predicted_date.date() - reference_date.date()).days

    projected_month_end = float(model.predict(pd.DataFrame({"day_index": [days_in_month]}))[0])
    confidence = round(min(0.95, 0.55 + len(cumulative) / 50), 2)

    return {
        "predicted_date": predicted_date,
        "daily_burn": round(float(daily.mean()), 2),
        "projected_month_end": round(projected_month_end, 2),
        "days_left": days_left,
        "confidence": confidence,
    }


def compute_addiction_scores(transactions: pd.DataFrame) -> pd.DataFrame:
    recent = transactions[transactions["datetime"] >= transactions["datetime"].max() - pd.Timedelta(days=30)].copy()
    if recent.empty:
        return pd.DataFrame(columns=["category", "score", "late_night_share", "weekly_consistency", "trend"])

    recent["late_night"] = recent["datetime"].dt.hour >= 22
    recent["week"] = recent["datetime"].dt.to_period("W").astype(str)
    recent["window"] = recent["datetime"].apply(
        lambda value: "recent_14" if value >= recent["datetime"].max() - pd.Timedelta(days=14) else "previous_14"
    )

    category_counts = recent.groupby("category").size()
    category_spend = recent.groupby("category")["amount"].sum()
    late_night_share = recent.groupby("category")["late_night"].mean().fillna(0)
    weekly_consistency = recent.groupby("category")["week"].nunique()

    spend_windows = (
        recent.pivot_table(index="category", columns="window", values="amount", aggfunc="sum", fill_value=0)
        .reset_index()
        .set_index("category")
    )
    spend_windows["trend_ratio"] = (
        (spend_windows.get("recent_14", 0) - spend_windows.get("previous_14", 0))
        / spend_windows.get("previous_14", 1).replace(0, 1)
    ).clip(lower=0, upper=2)

    max_count = max(float(category_counts.max()), 1.0)
    max_consistency = max(float(weekly_consistency.max()), 1.0)
    max_spend = max(float(category_spend.max()), 1.0)

    scores = pd.DataFrame(
        {
            "category": category_counts.index,
            "score": (
                (category_counts / max_count) * 35
                + (weekly_consistency / max_consistency) * 20
                + (category_spend / max_spend) * 20
                + late_night_share.reindex(category_counts.index).fillna(0) * 15
                + spend_windows["trend_ratio"].reindex(category_counts.index).fillna(0) * 5
            )
            .round()
            .clip(0, 100),
            "late_night_share": (late_night_share.reindex(category_counts.index).fillna(0) * 100).round(1),
            "weekly_consistency": weekly_consistency.reindex(category_counts.index).fillna(0).astype(int),
            "trend": spend_windows["trend_ratio"].reindex(category_counts.index).fillna(0).round(2),
        }
    ).sort_values(["score", "late_night_share"], ascending=[False, False])

    return scores.reset_index(drop=True)


def detect_weekly_anomalies(transactions: pd.DataFrame) -> pd.DataFrame:
    weekly = (
        transactions.set_index("datetime")["amount"]
        .resample("W")
        .sum()
        .reset_index(name="weekly_spend")
    )
    if len(weekly) < 4:
        weekly["is_anomaly"] = False
        weekly["severity"] = 0.0
        return weekly

    q1 = weekly["weekly_spend"].quantile(0.25)
    q3 = weekly["weekly_spend"].quantile(0.75)
    iqr = q3 - q1
    upper_bound = q3 + 1.5 * iqr
    weekly["is_anomaly"] = weekly["weekly_spend"] > upper_bound
    scale = iqr if iqr else max(float(weekly["weekly_spend"].std()), 1.0)
    weekly["severity"] = ((weekly["weekly_spend"] - q3) / scale).clip(lower=0).round(2)
    return weekly


def simulate_savings(
    current_month_spend: float,
    cut_percent: float,
    annual_interest_rate: float,
    months: int = 12,
) -> pd.DataFrame:
    monthly_contribution = current_month_spend * (cut_percent / 100)
    monthly_rate = annual_interest_rate / 100 / 12
    balance = 0.0
    rows: list[dict[str, float | int]] = []

    for month in range(1, months + 1):
        balance = (balance + monthly_contribution) * (1 + monthly_rate)
        rows.append(
            {
                "month": month,
                "saved_from_cutbacks": round(monthly_contribution * month, 2),
                "projected_balance": round(balance, 2),
            }
        )

    return pd.DataFrame(rows)
