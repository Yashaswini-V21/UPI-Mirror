from __future__ import annotations

import json
from calendar import monthrange
from datetime import datetime
from pathlib import Path

import pandas as pd
from sklearn.linear_model import LinearRegression


_SCENARIO_DIR = Path(".coach_memory")
_SCENARIO_MAX_SAVED = 5


def _clean_transactions(df: pd.DataFrame) -> pd.DataFrame:
    frame = df.copy()
    if "datetime" not in frame.columns:
        raise ValueError("df must contain a datetime column")
    if "amount" not in frame.columns:
        raise ValueError("df must contain an amount column")
    if "category" not in frame.columns:
        raise ValueError("df must contain a category column")

    frame["datetime"] = pd.to_datetime(frame["datetime"], errors="coerce")
    frame["amount"] = pd.to_numeric(frame["amount"], errors="coerce")
    frame = frame.dropna(subset=["datetime", "amount", "category"]).copy()
    frame["category"] = frame["category"].astype(str)
    frame = frame.sort_values("datetime").reset_index(drop=True)
    return frame


def _reference_date_for_frame(frame: pd.DataFrame) -> datetime:
    if frame.empty:
        return datetime.now()
    latest = frame["datetime"].max()
    if isinstance(latest, pd.Timestamp):
        return latest.to_pydatetime()
    if isinstance(latest, datetime):
        return latest
    return datetime.now()


def _current_month_frame(df: pd.DataFrame, reference_date: datetime | None = None) -> tuple[pd.DataFrame, datetime]:
    frame = _clean_transactions(df)
    ref_date = reference_date or _reference_date_for_frame(frame)
    month_mask = frame["datetime"].dt.to_period("M") == ref_date.strftime("%Y-%m")
    month_df = frame.loc[month_mask].copy()
    return month_df, ref_date


def _current_balance(month_df: pd.DataFrame, budget: float) -> float:
    return max(float(budget) - float(month_df["amount"].sum()), 0.0)


def _daily_burn_rate(month_df: pd.DataFrame, days_in_period: int) -> float:
    if days_in_period <= 0:
        return 0.0
    return float(month_df["amount"].sum()) / float(days_in_period)


def _days_left_from_balance(balance: float, burn_rate: float, fallback_days: int) -> float:
    if balance <= 0:
        return 0.0
    if burn_rate <= 0:
        return float(fallback_days)
    return max(balance / burn_rate, 0.0)


def _scenario_path(upload_id: str) -> Path:
    return _SCENARIO_DIR / f"{upload_id}_scenarios.json"


def _load_scenario_records(upload_id: str) -> list[dict[str, object]]:
    path = _scenario_path(upload_id)
    if not path.exists():
        return []
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return []
    if not isinstance(data, list):
        return []
    return [item for item in data if isinstance(item, dict)]


def _save_scenario_records(upload_id: str, records: list[dict[str, object]]) -> None:
    _SCENARIO_DIR.mkdir(parents=True, exist_ok=True)
    path = _scenario_path(upload_id)
    path.write_text(json.dumps(records, indent=2, ensure_ascii=False, default=str), encoding="utf-8")


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
    previous_14 = spend_windows.get("previous_14", None)
    if previous_14 is None:
        previous_14 = pd.Series(1.0, index=spend_windows.index)
    else:
        previous_14 = previous_14.replace(0, 1)

    spend_windows["trend_ratio"] = (
        (spend_windows.get("recent_14", 0) - previous_14)
        / previous_14
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


def simulate_scenario(df: pd.DataFrame, budget: float, cutback_pct: float, cutback_category: str) -> dict[str, object]:
    month_df, reference_date = _current_month_frame(df)
    if cutback_category not in set(month_df["category"].astype(str).unique()):
        raise ValueError("cutback_category must exist in df['category']")

    days_in_period = monthrange(reference_date.year, reference_date.month)[1]
    current_balance = _current_balance(month_df, budget)
    original_burn_rate = _daily_burn_rate(month_df, days_in_period)
    original_days_left = _days_left_from_balance(current_balance, original_burn_rate, days_in_period)

    category_mask = month_df["category"].astype(str) == str(cutback_category)
    original_category_total = float(month_df.loc[category_mask, "amount"].sum())

    if cutback_pct == 0:
        return {
            "original_days_left": round(original_days_left, 2),
            "new_days_left": round(original_days_left, 2),
            "days_gained": 0,
            "new_monthly_savings": 0.0,
            "new_suggested_cap": round(original_category_total, 2),
            "scenario_impact": "neutral",
        }

    reduced_spend = original_category_total * (1 - (cutback_pct / 100.0))
    burn_reduction = (original_category_total - reduced_spend) / float(days_in_period)
    new_burn_rate = max(original_burn_rate - burn_reduction, 0.0)
    new_days_left = _days_left_from_balance(current_balance, new_burn_rate, days_in_period)

    days_gained = max(round(new_days_left - original_days_left, 2), 0.0)
    new_monthly_savings = max(round(original_category_total - reduced_spend, 2), 0.0)
    new_suggested_cap = round(reduced_spend, 2)
    scenario_impact = "positive" if new_days_left > original_days_left else "negative" if new_days_left < original_days_left else "neutral"

    return {
        "original_days_left": round(original_days_left, 2),
        "new_days_left": round(new_days_left, 2),
        "days_gained": days_gained,
        "new_monthly_savings": new_monthly_savings,
        "new_suggested_cap": new_suggested_cap,
        "scenario_impact": scenario_impact,
    }


def compute_projection_bands(df: pd.DataFrame, budget: float, days: int = 30) -> dict[str, object]:
    month_df, reference_date = _current_month_frame(df)
    current_balance = _current_balance(month_df, budget)
    current_days = max(reference_date.day, 1)
    burn_rate = _daily_burn_rate(month_df, current_days)
    best_burn_rate = max(burn_rate * 0.85, 0.0)
    worst_burn_rate = burn_rate * 1.15

    day_points = list(range(1, days + 1))

    def _project_curve(rate: float) -> list[float]:
        return [round(max(current_balance - (rate * day), 0.0), 2) for day in day_points]

    def _broke_date(curve: list[float]) -> int:
        for index, value in enumerate(curve, start=1):
            if value <= 0:
                return index
        return days

    base_curve = _project_curve(burn_rate)
    best_curve = _project_curve(best_burn_rate)
    worst_curve = _project_curve(worst_burn_rate)

    return {
        "days": day_points,
        "base": base_curve,
        "best_case": best_curve,
        "worst_case": worst_curve,
        "broke_date_base": _broke_date(base_curve),
        "broke_date_best": _broke_date(best_curve),
        "broke_date_worst": _broke_date(worst_curve),
    }


def save_scenario(upload_id: str, label: str, scenario_result: dict[str, object]) -> str:
    _SCENARIO_DIR.mkdir(parents=True, exist_ok=True)
    records = _load_scenario_records(upload_id)
    scenario_id = f"{upload_id}_s{len(records) + 1}"
    records.append(
        {
            "scenario_id": scenario_id,
            "label": label,
            "created_at": datetime.now().isoformat(timespec="seconds"),
            "scenario_result": scenario_result,
        }
    )
    if len(records) > _SCENARIO_MAX_SAVED:
        records = records[-_SCENARIO_MAX_SAVED:]
    _save_scenario_records(upload_id, records)
    return scenario_id


def load_scenarios(upload_id: str) -> list[dict[str, object]]:
    try:
        records = _load_scenario_records(upload_id)
    except Exception:
        return []
    return list(reversed(records))
