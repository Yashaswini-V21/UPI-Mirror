from __future__ import annotations

"""Evaluation helpers for the Kira-AI metrics endpoint.

These functions provide deterministic ML-style metrics for the production
`GET /metrics` route. They are defensive by design so the endpoint can still
serve a useful payload when only partial session history is available.
"""

import json
import re
from datetime import date, datetime
from pathlib import Path
from typing import Optional

import pandas as pd
from sklearn.linear_model import LinearRegression

COACH_MEMORY_DIR = Path(".coach_memory")
GEMINI_CALL_LOG = COACH_MEMORY_DIR / "gemini_calls.log"
EXPECTED_SIGNALS = [
    "anomaly_detected",
    "habit_score",
    "days_left",
    "regret_flag",
    "top_category",
    "burn_rate_daily",
    "suggested_cap",
    "confidence_score",
]


def _clean_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    """Normalize a raw transaction frame into one row per day."""
    frame = df.copy()
    if "datetime" not in frame.columns or "amount" not in frame.columns:
        raise ValueError("df must contain datetime and amount columns")

    frame["datetime"] = pd.to_datetime(frame["datetime"], errors="coerce")
    frame["amount"] = pd.to_numeric(frame["amount"], errors="coerce")
    frame = frame.dropna(subset=["datetime", "amount"]).copy()
    if frame.empty:
        return frame

    frame["date"] = frame["datetime"].dt.floor("D")
    daily = frame.groupby("date", as_index=False)["amount"].sum().sort_values("date")
    return daily.reset_index(drop=True)


def _daily_series(df: pd.DataFrame) -> pd.Series:
    """Build a contiguous daily spend series with missing days filled as zero."""
    daily = _clean_dataframe(df)
    if daily.empty:
        return pd.Series(dtype=float)

    full_range = pd.date_range(daily["date"].min(), daily["date"].max(), freq="D")
    series = (
        daily.set_index("date")["amount"]
        .reindex(full_range, fill_value=0.0)
        .astype(float)
    )
    series.index.name = "date"
    return series


def _fit_cumulative_regression(series: pd.Series) -> LinearRegression:
    """Fit a linear model over cumulative spend for a contiguous daily series."""
    cumulative = series.cumsum().astype(float)
    x_values = pd.DataFrame({"day_index": range(1, len(cumulative) + 1)})
    model = LinearRegression()
    model.fit(x_values, cumulative)
    return model


def _parse_json_file(path: Path) -> object:
    """Load a JSON file without raising on malformed content."""
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return None


def _is_nonzero_signal_value(value: object) -> bool:
    """Return True when a signal should count as present for coverage."""
    if value is None:
        return False
    if isinstance(value, bool):
        return value
    if isinstance(value, (int, float)):
        return float(value) != 0.0
    if isinstance(value, str):
        return bool(value.strip())
    return bool(value)


def compute_forecast_mae(df: pd.DataFrame) -> Optional[float]:
    """Compute the mean absolute broke-day error from a time-based split.

    The last 7 days are reserved for testing. The training window is used to fit
    a linear regression over cumulative spend. The test window reuses the same
    start balance and compares the predicted broke-day offset against the actual
    trend observed in the test period.
    """
    series = _daily_series(df)
    if len(series) < 14:
        return None

    train_series = series.iloc[:-7]
    test_series = series.iloc[-7:]
    if train_series.empty or test_series.empty:
        return None

    try:
        train_model = _fit_cumulative_regression(train_series)
        test_model = _fit_cumulative_regression(test_series)
    except Exception:
        return None

    train_slope = float(train_model.coef_[0])
    test_slope = float(test_model.coef_[0])
    if train_slope <= 0 or test_slope <= 0:
        return None

    test_start_balance = float(test_series.sum())
    if test_start_balance <= 0:
        return 0.0

    predicted_broke_day_offset = test_start_balance / train_slope
    actual_broke_day_offset = test_start_balance / test_slope
    mae = abs(predicted_broke_day_offset - actual_broke_day_offset)
    return round(float(mae), 1)


def compute_signal_coverage(signals: dict) -> float:
    """Return the fraction of expected signals that are present and non-zero."""
    total = len(EXPECTED_SIGNALS)
    if total == 0:
        return 0.0

    covered = sum(1 for key in EXPECTED_SIGNALS if _is_nonzero_signal_value(signals.get(key)))
    return round(covered / total, 3)


def compute_nudge_acceptance_rate(upload_id: str) -> float:
    """Compute nudge acceptance across session JSON files for one upload id.

    The loader understands both the current API session format (with a `feedback`
    list containing `accepted`) and legacy coach snapshot files that may carry
    `user_feedback` fields.
    """
    if not COACH_MEMORY_DIR.exists():
        return 0.0

    accepted = 0
    total = 0
    pattern = re.compile(rf"^{re.escape(upload_id)}(?:$|_.*)")

    for path in COACH_MEMORY_DIR.glob("*.json"):
        if not pattern.match(path.stem):
            continue

        payload = _parse_json_file(path)
        if payload is None:
            continue

        if isinstance(payload, dict):
            feedback_entries = payload.get("feedback", [])
            if isinstance(feedback_entries, list):
                for item in feedback_entries:
                    if isinstance(item, dict) and "accepted" in item:
                        total += 1
                        if bool(item.get("accepted")):
                            accepted += 1
            continue

        if isinstance(payload, list):
            for item in payload:
                if not isinstance(item, dict):
                    continue
                if "accepted" in item:
                    total += 1
                    if bool(item.get("accepted")):
                        accepted += 1
                elif item.get("user_feedback") in {"accepted", True}:
                    total += 1
                    accepted += 1
                elif item.get("user_feedback") in {"dismissed", False}:
                    total += 1

    if total == 0:
        return 0.0
    return round(accepted / total, 3)


def compute_model_quality_score(mae: Optional[float], coverage: float, acceptance: float) -> float:
    """Combine forecast error, coverage, and acceptance into one quality score."""
    if mae is None:
        mae_score = 0.5
    elif mae < 3:
        mae_score = 1.0
    elif mae < 7:
        mae_score = 0.85
    elif mae < 14:
        mae_score = 0.65
    else:
        mae_score = 0.35

    score = (mae_score * 0.40) + (coverage * 0.35) + (acceptance * 0.25)
    return round(max(0.0, min(1.0, float(score))), 3)


def _count_gemini_calls_today() -> int:
    """Count Gemini calls logged for the current date."""
    if not GEMINI_CALL_LOG.exists():
        return 0

    today = date.today().isoformat()
    try:
        return sum(1 for line in GEMINI_CALL_LOG.read_text(encoding="utf-8").splitlines() if today in line)
    except OSError:
        return 0


def _count_total_sessions() -> int:
    """Count saved session JSON files in `.coach_memory/`."""
    if not COACH_MEMORY_DIR.exists():
        return 0

    count = 0
    for path in COACH_MEMORY_DIR.glob("*.json"):
        if path.name.endswith("_scenarios.json"):
            continue
        if path.stem:
            count += 1
    return count


def get_all_metrics(df: pd.DataFrame, signals: dict, upload_id: str) -> dict:
    """Return the metrics payload used by the API's `GET /metrics` endpoint."""
    mae = compute_forecast_mae(df)
    coverage = compute_signal_coverage(signals)
    acceptance = compute_nudge_acceptance_rate(upload_id)
    quality = compute_model_quality_score(mae, coverage, acceptance)

    return {
        "forecast_mae_days": mae,
        "signal_coverage_pct": round(coverage * 100, 1),
        "nudge_acceptance_rate": round(acceptance * 100, 1),
        "model_quality_score": quality,
        "total_sessions": _count_total_sessions(),
        "gemini_calls_today": _count_gemini_calls_today(),
    }
