"""api/main.py
============
Kira-AI FastAPI application — routing, middleware, session management.

Endpoints (all under Bearer token auth unless noted):
  POST   /upload                 — Ingest a CSV or PDF file, create a session.
  POST   /coach                  — Run the full coaching pipeline for a session.
  POST   /feedback               — Record nudge acceptance / dismissal.
  GET    /history/{upload_id}    — Full session record.
  GET    /metrics                — Model quality metrics.
  GET    /scenarios/{upload_id}  — List what-if scenarios.
  POST   /scenarios              — Create a what-if scenario.
  DELETE /session/{upload_id}    — Delete a session and all its files.
  GET    /export/csv             — Download PII-masked transactions CSV.
  GET    /integrations/status    — Check which integrations are active.
  GET    /health                 — Health check (unauthenticated).
  GET    /                       — Root info (unauthenticated).

Middleware stack (outermost to innermost):
  SecurityHeadersMiddleware → RequestIDMiddleware → RequestTimingMiddleware
  → SlowAPIMiddleware → GZipMiddleware → CORSMiddleware → handler

Key constants:
  SESSION_STORE  — in-memory dict of upload_id → session record.
  SESSION_DIR    — on-disk JSON session directory (sys temp).
  STALE_CSV_AGE  — 60-minute TTL for temporary upload CSVs.
"""

from __future__ import annotations

import json
from contextlib import asynccontextmanager
import logging
import os
import tempfile
import time
import secrets
import string
from datetime import date, datetime, timedelta, timezone
from io import BytesIO
from pathlib import Path
from threading import RLock
from typing import Any

import pandas as pd
from fastapi import APIRouter, Depends, FastAPI, File, Header, HTTPException, Query, Request, UploadFile
from fastapi.encoders import jsonable_encoder
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel, ConfigDict, Field
from starlette.background import BackgroundTask
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.responses import Response

from src.analytics import compute_addiction_scores, detect_weekly_anomalies, month_to_date_spend, predict_broke_date
from src.evaluation import get_all_metrics
from src.coach_agent import run_spending_coach_agent
from src.coach_memory import clear_memory, record_feedback, save_snapshot
from src.delivery import build_coach_delivery_message, build_whatsapp_url, default_delivery_targets
from src.explainability import explain_coach_decision
from src.merchant import late_night_merchant_alerts
from src.narrative import DEFAULT_GEMINI_MODEL
from src.pdf_parser import _infer_category as infer_category_from_merchant
from src.pdf_parser import parse_upi_pdf
from src.regret import compute_regret_stats

# Enterprise modules
from src.observability import METRICS, configure_logging, get_logger
from src.audit import (
    log_file_upload, log_coach_decision, log_data_access, log_session_delete,
    log_retention_purge, log_feedback
)
from src.data_governance import (
    apply_retention_policy, enforce_session_cap, apply_pii_masking_to_export,
    validate_retention_config, MAX_SESSIONS
)
from src.resilience import coach_cache

from .schemas import (
    CoachResponse,
    ErrorResponse,
    FeedbackRequest,
    FeedbackResponse,
    HealthResponse,
    IntegrationsStatusResponse,
    MetricsResponse,
    ScenarioRequest,
    SignalData,
    UploadResponse,
)
from .security import validate_api_token, validate_startup_security

try:
    from nanoid import generate as nanoid
except ImportError:
    _NANOID_ALPHABET = string.ascii_letters + string.digits

    def nanoid(size: int = 12) -> str:
        return "".join(secrets.choice(_NANOID_ALPHABET) for _ in range(size))

try:
    from slowapi import Limiter, _rate_limit_exceeded_handler
    from slowapi.errors import RateLimitExceeded
    from slowapi.middleware import SlowAPIMiddleware
    from slowapi.util import get_remote_address
except ImportError:

    class RateLimitExceeded(Exception):
        pass

    def _rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded) -> JSONResponse:
        return JSONResponse(status_code=429, content={"error": "rate_limit_exceeded", "detail": "Too many requests. Please slow down.", "retry_after_seconds": 60, "limit": "unknown", "code": 429})

    class Limiter:
        def __init__(self, key_func: Any | None = None, default_limits: list[str] | None = None, **kwargs: Any) -> None:
            self.key_func = key_func
            self.default_limits = default_limits or []
            self.kwargs = kwargs

        def limit(self, limit_value: str, **kwargs: Any):
            def decorator(func):
                return func

            return decorator

    class SlowAPIMiddleware(BaseHTTPMiddleware):
        async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
            return await call_next(request)

    def get_remote_address(request: Request) -> str:
        client = request.client
        return client.host if client else "127.0.0.1"

# We now use structlog; but keep a fallback logger for early startup
LOGGER = get_logger(__name__)
SESSION_LOCK = RLock()
SESSION_STORE: dict[str, dict[str, Any]] = {}
SESSION_DIR = Path(tempfile.gettempdir()) / "kira_ai_sessions"
TEMP_DIR = Path(tempfile.gettempdir())
STALE_CSV_AGE = timedelta(minutes=60)
DEFAULT_RATE_LIMIT = "60/minute"
COACH_RATE_LIMIT = "30/minute"


def _parse_allowed_origins() -> list[str]:
    raw_value = os.getenv("ALLOWED_ORIGINS", "").strip()
    if not raw_value:
        return ["https://yourdomain.example.com"]  # SECURITY: Change to your actual domain
    origins = [origin.strip() for origin in raw_value.split(",") if origin.strip()]
    return origins or ["https://yourdomain.example.com"]


def smart_key_func(request: Request) -> str:
    """Use the client IP for rate limiting, but exempt localhost during development."""
    ip = get_remote_address(request)
    if ip in ("127.0.0.1", "::1", "localhost"):
        return "local_exempt_unlimited"
    return ip


def _is_local_request(request: Request) -> bool:
    return smart_key_func(request) == "local_exempt_unlimited"


def _extract_rate_limit_limit(exc: RateLimitExceeded) -> str:
    for candidate in (getattr(exc, "limit", None), getattr(exc, "detail", None), exc):
        if candidate is None:
            continue
        limit_value = getattr(candidate, "limit", None)
        if limit_value:
            return str(limit_value)
        text = str(candidate).strip()
        if text and text.lower() != "too many requests":
            return text
    return "unknown"


def _extract_retry_after_seconds(exc: RateLimitExceeded) -> int:
    for attribute in ("retry_after", "retry_after_seconds", "reset_after", "reset_time", "seconds_until_reset"):
        value = getattr(exc, attribute, None)
        if value is None:
            continue
        if isinstance(value, datetime):
            delta = (value - datetime.now(timezone.utc)).total_seconds()
            return max(int(delta), 0)
        try:
            return max(int(float(value)), 0)
        except (TypeError, ValueError):
            continue
    return 60


def _rate_limit_handler(request: Request, exc: RateLimitExceeded) -> JSONResponse:
    retry_after_seconds = _extract_retry_after_seconds(exc)
    limit = _extract_rate_limit_limit(exc)
    response = JSONResponse(
        status_code=429,
        content={
            "error": "rate_limit_exceeded",
            "detail": "Too many requests. Please slow down.",
            "retry_after_seconds": retry_after_seconds,
            "limit": limit,
            "code": 429,
        },
    )
    response.headers["Retry-After"] = str(retry_after_seconds)
    return response


@asynccontextmanager
async def lifespan(app: FastAPI):
    configure_logging()
    validate_startup_security()
    validate_retention_config()
    
    SESSION_DIR.mkdir(parents=True, exist_ok=True)
    
    retention_result = apply_retention_policy(SESSION_DIR)
    
    _load_all_sessions_into_memory()
    removed = _cleanup_stale_files()
    
    if retention_result.get("sessions_deleted"):
        log_retention_purge(
            sessions_deleted=retention_result["sessions_deleted"],
            files_deleted=removed,
            retention_days=int(os.getenv("DATA_RETENTION_DAYS", "90"))
        )
    
    app.state.start_time = _now()
    app.state.gemini_connected = _probe_gemini_connection()
    app.state.gitlab_connected = _gitlab_configured()
    
    LOGGER.info(
        "Kira-AI API started",
        gemini_connected=app.state.gemini_connected,
        gitlab_connected=app.state.gitlab_connected,
        stale_files_removed=removed,
        sessions_purged=retention_result["sessions_deleted"],
    )
    yield

limiter = Limiter(key_func=smart_key_func, default_limits=["200/hour"], headers_enabled=True)
app = FastAPI(
    title="Kira-AI API",
    description="Enterprise-grade AI spending coach.",
    version="1.0.0",
    docs_url="/docs" if os.getenv("ENVIRONMENT") != "production" else None,
    redoc_url="/redoc" if os.getenv("ENVIRONMENT") != "production" else None,
    lifespan=lifespan,
)
app.state.limiter = limiter
app.add_middleware(
    CORSMiddleware,
    allow_origins=_parse_allowed_origins(),
    allow_credentials=True,
    allow_methods=["GET", "POST", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "X-Kira-Signature"],
)
app.add_middleware(GZipMiddleware, minimum_size=500)
app.add_middleware(SlowAPIMiddleware)
app.add_exception_handler(RateLimitExceeded, _rate_limit_handler)


class RequestTimingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        started_at = time.perf_counter()
        response = await call_next(request)
        elapsed_ms = (time.perf_counter() - started_at) * 1000
        response.headers["X-Process-Time"] = f"{elapsed_ms:.2f}ms"
        # Export metrics
        status_code = str(response.status_code)
        method = request.method
        path = request.url.path
        METRICS.http_requests_total.labels(method=method, path=path, status_code=status_code).inc()
        METRICS.http_request_duration_seconds.labels(method=method, path=path).observe(elapsed_ms / 1000.0)
        return response


class RequestIDMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        request_id = request.headers.get("X-Request-ID", nanoid(12))
        request.state.request_id = request_id
        response = await call_next(request)
        response.headers["X-Request-ID"] = request_id
        return response


app.add_middleware(RequestTimingMiddleware)
app.add_middleware(RequestIDMiddleware)


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Add enterprise security headers to all responses."""
    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        response = await call_next(request)
        response.headers["Content-Security-Policy"] = "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'"
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        return response


app.add_middleware(SecurityHeadersMiddleware)


def _verify_key(request: Request, authorization: str | None = Header(default=None)) -> None:
    validate_api_token(authorization, request=request)


protected_router = APIRouter(dependencies=[Depends(_verify_key)])


def _safe_remove(path: Path | str | None) -> None:
    if not path:
        return
    try:
        Path(path).unlink(missing_ok=True)
    except OSError:
        pass


def _session_json_path(upload_id: str) -> Path:
    return SESSION_DIR / f"{upload_id}.json"


def _session_csv_path(upload_id: str) -> Path:
    return TEMP_DIR / f"kira_{upload_id}.csv"


def _session_export_path(upload_id: str) -> Path:
    return TEMP_DIR / f"kira_{upload_id}_report.csv"


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _today_iso() -> str:
    return date.today().isoformat()


def _coerce_datetime(value: Any) -> datetime | None:
    parsed = pd.to_datetime(value, errors="coerce")
    if pd.isna(parsed):
        return None
    if isinstance(parsed, pd.Timestamp):
        return parsed.to_pydatetime()
    return parsed if isinstance(parsed, datetime) else None


def _infer_category(merchant: str | None) -> str:
    if not merchant:
        return "Essentials"
    return infer_category_from_merchant(str(merchant))


def _canonicalize_upload_frame(frame: pd.DataFrame) -> pd.DataFrame:
    df = frame.copy()
    lower_to_original = {str(column).strip().lower(): column for column in df.columns}
    rename_map: dict[str, str] = {}
    canonical_columns = {
        "datetime": ["datetime", "date", "timestamp", "txn_time", "transaction_time", "transaction_date"],
        "amount": ["amount", "value", "spent", "spend", "debit"],
        "merchant": ["merchant", "payee", "receiver", "counterparty", "description", "details"],
        "category": ["category", "cat"],
        "regret": ["regret", "regret_score"],
    }

    for canonical, aliases in canonical_columns.items():
        if canonical in df.columns:
            continue
        for alias in aliases:
            original = lower_to_original.get(alias)
            if original is not None:
                rename_map[original] = canonical
                break

    if rename_map:
        df = df.rename(columns=rename_map)

    if "datetime" not in df.columns:
        raise HTTPException(status_code=400, detail="Upload must include a date or datetime column.")
    if "amount" not in df.columns:
        raise HTTPException(status_code=400, detail="Upload must include an amount column.")

    df["datetime"] = pd.to_datetime(df["datetime"], errors="coerce")
    df["amount"] = pd.to_numeric(df["amount"], errors="coerce")
    df = df.dropna(subset=["datetime", "amount"])

    if "merchant" not in df.columns:
        df["merchant"] = "Unknown"
    df["merchant"] = df["merchant"].fillna("Unknown").astype(str)

    if "category" not in df.columns:
        df["category"] = df["merchant"].apply(_infer_category)
    else:
        df["category"] = df["category"].fillna("")
        df.loc[df["category"].astype(str).str.strip() == "", "category"] = df["merchant"].apply(_infer_category)

    if "regret" in df.columns:
        df["regret"] = pd.to_numeric(df["regret"], errors="coerce")

    df = df.sort_values("datetime").reset_index(drop=True)
    return df[[column for column in ["datetime", "amount", "category", "merchant", "regret"] if column in df.columns]]


def _load_uploaded_frame(content: bytes, filename: str | None) -> tuple[pd.DataFrame, str]:
    suffix = Path(filename or "").suffix.lower()
    if suffix == ".pdf":
        frame = parse_upi_pdf(content)
        return _canonicalize_upload_frame(frame), "pdf"
    if suffix in {".csv", ".txt"} or not suffix:
        try:
            frame = pd.read_csv(BytesIO(content))
        except Exception as exc:
            raise HTTPException(status_code=400, detail=f"Could not read CSV upload: {exc}") from exc
        return _canonicalize_upload_frame(frame), "csv"
    raise HTTPException(status_code=400, detail="Only CSV and PDF uploads are supported.")


def _session_transactions(session: dict[str, Any]) -> pd.DataFrame:
    records = session.get("transactions", [])
    if not records:
        return pd.DataFrame(columns=["datetime", "amount", "category", "merchant", "regret"])
    frame = pd.DataFrame(records)
    frame["datetime"] = pd.to_datetime(frame["datetime"], errors="coerce")
    frame["amount"] = pd.to_numeric(frame["amount"], errors="coerce")
    if "regret" in frame.columns:
        frame["regret"] = pd.to_numeric(frame["regret"], errors="coerce")
    return frame.dropna(subset=["datetime", "amount"]).sort_values("datetime").reset_index(drop=True)


def _build_upload_meta(frame: pd.DataFrame, filename: str | None, source: str) -> dict[str, Any]:
    start_at = frame["datetime"].min() if not frame.empty else None
    end_at = frame["datetime"].max() if not frame.empty else None
    categories = sorted({str(value) for value in frame.get("category", pd.Series(dtype=str)).dropna().unique().tolist()})
    return {
        "filename": filename,
        "source": source,
        "rows": int(len(frame)),
        "total_spend": round(float(frame["amount"].sum()), 2) if not frame.empty else 0.0,
        "date_range": {
            "start": start_at.isoformat() if start_at is not None else None,
            "end": end_at.isoformat() if end_at is not None else None,
        },
        "categories": categories,
    }


def _build_session_record(upload_id: str, frame: pd.DataFrame, filename: str | None, source: str) -> dict[str, Any]:
    created_at = _now().isoformat()
    return {
        "upload_id": upload_id,
        "created_at": created_at,
        "updated_at": created_at,
        "meta": _build_upload_meta(frame, filename, source),
        "transactions": jsonable_encoder(frame.to_dict(orient="records")),
        "coach_runs": [],
        "scenarios": [],
        "feedback": [],
        "latest_budget": None,
        "latest_coach": None,
        "status": "uploaded",
    }


def _persist_session(session: dict[str, Any]) -> None:
    SESSION_DIR.mkdir(parents=True, exist_ok=True)
    session["updated_at"] = _now().isoformat()
    path = _session_json_path(session["upload_id"])
    tmp_path = path.with_suffix(".tmp")
    payload = jsonable_encoder(session)
    with tmp_path.open("w", encoding="utf-8") as handle:
        json.dump(payload, handle, indent=2, ensure_ascii=False, default=str)
    os.replace(tmp_path, path)
    with SESSION_LOCK:
        SESSION_STORE[session["upload_id"]] = payload
    
    # Enforce memory cap if enabled
    evicted = enforce_session_cap(SESSION_STORE, SESSION_DIR, MAX_SESSIONS)
    if evicted:
        LOGGER.info("Evicted %d sessions to maintain cap of %d", evicted, MAX_SESSIONS)
    
    # Update active session metrics
    METRICS.active_sessions.set(len(SESSION_STORE))


def _load_session(upload_id: str) -> dict[str, Any] | None:
    with SESSION_LOCK:
        session = SESSION_STORE.get(upload_id)
    if session is not None:
        return session

    path = _session_json_path(upload_id)
    if not path.exists():
        return None

    try:
        with path.open("r", encoding="utf-8") as handle:
            session = json.load(handle)
    except (OSError, json.JSONDecodeError):
        return None

    if isinstance(session, dict):
        with SESSION_LOCK:
            SESSION_STORE[upload_id] = session
        return session
    return None


def _require_session(upload_id: str) -> dict[str, Any]:
    session = _load_session(upload_id)
    if session is None:
        raise HTTPException(status_code=404, detail="Not found")
    return session


def _load_session_transports(upload_id: str) -> pd.DataFrame:
    csv_path = _session_csv_path(upload_id)
    if csv_path.exists():
        try:
            frame = pd.read_csv(csv_path)
            frame["datetime"] = pd.to_datetime(frame["datetime"], errors="coerce")
            frame["amount"] = pd.to_numeric(frame["amount"], errors="coerce")
            if "regret" in frame.columns:
                frame["regret"] = pd.to_numeric(frame["regret"], errors="coerce")
            return frame.dropna(subset=["datetime", "amount"]).sort_values("datetime").reset_index(drop=True)
        except Exception as exc:
            LOGGER.warning("Failed to read session CSV %s: %s", csv_path, exc)

    session = _require_session(upload_id)
    return _session_transactions(session)


def _load_all_sessions_into_memory() -> None:
    SESSION_DIR.mkdir(parents=True, exist_ok=True)
    with SESSION_LOCK:
        SESSION_STORE.clear()
        for path in SESSION_DIR.glob("*.json"):
            try:
                with path.open("r", encoding="utf-8") as handle:
                    session = json.load(handle)
                if isinstance(session, dict) and session.get("upload_id"):
                    SESSION_STORE[str(session["upload_id"])] = session
            except (OSError, json.JSONDecodeError):
                continue


def _cleanup_stale_files() -> int:
    removed = 0
    cutoff = _now() - STALE_CSV_AGE
    for path in TEMP_DIR.glob("kira_*.csv"):
        try:
            modified_at = datetime.fromtimestamp(path.stat().st_mtime, tz=timezone.utc)
        except OSError:
            continue
        if modified_at < cutoff:
            _safe_remove(path)
            removed += 1
    return removed


def _probe_gemini_connection() -> bool:
    api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
    if not api_key:
        return False

    try:
        from google import genai

        client = genai.Client(api_key=api_key)
        client.models.generate_content(
            model=DEFAULT_GEMINI_MODEL,
            contents=[
                {
                    "role": "user",
                    "parts": [{"text": "test"}],
                }
            ],
            config={"temperature": 0.0},
        )
        return True
    except Exception as exc:
        LOGGER.warning("Gemini probe failed during startup: %s", exc)
        return False


def _gitlab_configured() -> bool:
    gitlab_url = os.getenv("GITLAB_URL", "").strip()
    gitlab_token = os.getenv("GITLAB_TOKEN", "").strip() or os.getenv("GITLAB_API_TOKEN", "").strip()
    return bool(gitlab_url and gitlab_token)


def _build_history_payload(session: dict[str, Any]) -> dict[str, Any]:
    payload = dict(session)
    payload["transactions_count"] = len(payload.get("transactions", []))
    return payload


def _latest_session_payload() -> tuple[pd.DataFrame, dict[str, Any], str]:
    with SESSION_LOCK:
        if not SESSION_STORE:
            return pd.DataFrame(), {}, ""

        latest_session = max(SESSION_STORE.values(), key=lambda item: str(item.get("updated_at", "")))

    transactions = pd.DataFrame(latest_session.get("transactions", []))
    if not transactions.empty and "datetime" in transactions.columns:
        transactions["datetime"] = pd.to_datetime(transactions["datetime"], errors="coerce")
    if not transactions.empty and "amount" in transactions.columns:
        transactions["amount"] = pd.to_numeric(transactions["amount"], errors="coerce")

    latest_coach = latest_session.get("latest_coach") or {}
    signals = latest_coach.get("signals")
    if not isinstance(signals, dict):
        signals = {
            "anomaly_detected": bool(latest_coach.get("anomaly_detected", False)),
            "habit_score": float(latest_coach.get("top_addiction_score", 0) or 0) / 100.0,
            "days_left": int((latest_coach.get("prediction") or {}).get("days_left") or 0),
            "regret_flag": bool(latest_coach.get("repeat_pattern_detected", False)),
            "top_category": str(latest_coach.get("suggested_category") or "Essentials"),
            "burn_rate_daily": float((latest_coach.get("prediction") or {}).get("daily_burn", 0.0) or 0.0),
            "suggested_cap": float(latest_coach.get("suggested_limit", 0.0) or 0.0),
            "confidence_score": float((latest_coach.get("prediction") or {}).get("confidence", 0.0) or 0.0),
        }

    upload_id = str(latest_session.get("upload_id") or "")
    return transactions, signals, upload_id


def _map_urgency(status: str) -> str:
    return {"critical": "high", "watch": "medium"}.get(status, "low")


def _build_signal_data(coach_result: Any, prediction: dict[str, Any], explanation: dict[str, Any]) -> SignalData:
    signals = explanation.get("signals") or []
    top_signal_weight = max((float(item.get("weight", 0)) / 100.0 for item in signals), default=0.0)
    top_addiction = max((float(item.get("raw_value", 0)) for item in signals if item.get("name") == "Addiction Score"), default=0.0)
    top_regret = max((float(item.get("raw_value", 0)) for item in signals if item.get("name") == "Category Regret"), default=0.0)
    days_left = prediction.get("days_left")
    return SignalData(
        anomaly_detected=bool(coach_result.anomaly_detected),
        anomaly_weight=1.0 if coach_result.anomaly_detected else 0.0,
        habit_score=min(1.0, top_addiction / 100.0),
        habit_weight=min(1.0, top_signal_weight or (0.25 if coach_result.repeat_pattern_detected else 0.15)),
        days_left=int(days_left if days_left is not None else 0),
        days_weight=min(1.0, max(0.0, 1.0 - (float(days_left or 0) / 30.0))) if days_left is not None else 0.0,
        regret_flag=bool(top_regret >= 3.5 or coach_result.repeat_pattern_detected),
        regret_weight=min(1.0, top_regret / 5.0),
        top_category=str(coach_result.suggested_category),
        burn_rate_daily=float(prediction.get("daily_burn", 0.0) or 0.0),
        confidence_score=min(1.0, max(0.0, float(prediction.get("confidence", 0.0) or 0.0))),
    )


def _build_coach_response(upload_id: str, coach_result: Any, prediction: dict[str, Any], explanation: dict[str, Any]) -> CoachResponse:
    signal_data = _build_signal_data(coach_result, prediction, explanation)
    status_to_action = {
        "critical": f"Freeze {coach_result.suggested_category} spending and set a hard weekly cap.",
        "watch": f"Slow {coach_result.suggested_category} spending and keep it under a weekly cap.",
        "stable": f"Stay disciplined and keep {coach_result.suggested_category} spending within plan.",
    }
    tip_by_status = {
        "critical": "Cut this category immediately and block impulse buys for 48 hours.",
        "watch": "Reduce frequency before this turns into a repeat pattern.",
        "stable": "Stay consistent and check the next few transactions before spending.",
    }
    whatsapp_message = build_coach_delivery_message(coach_result)
    whatsapp_number = os.getenv("COACH_WHATSAPP_NUMBER", "").strip() or None
    return CoachResponse(
        upload_id=upload_id,
        status=coach_result.status,
        days_left=int(prediction.get("days_left") or 0),
        narrative=coach_result.narrative,
        action=status_to_action.get(coach_result.status, status_to_action["stable"]),
        urgency=_map_urgency(coach_result.status),
        tip=tip_by_status.get(coach_result.status, tip_by_status["stable"]),
        suggested_cap=float(coach_result.suggested_limit),
        nudge=coach_result.nudge,
        signals=signal_data,
        gitlab_issue_url=os.getenv("GITLAB_ISSUE_URL", "").strip() or None,
        whatsapp_link=build_whatsapp_url(whatsapp_message, phone_number=whatsapp_number),
        confidence_score=signal_data.confidence_score,
    )


def _build_metrics_payload() -> dict[str, Any]:
    transactions, signals, upload_id = _latest_session_payload()
    with SESSION_LOCK:
        total_sessions = len(SESSION_STORE)
    metrics = get_all_metrics(transactions, signals, upload_id)
    metrics["total_sessions"] = total_sessions
    return metrics


class ScenarioCreatePayload:
    def __init__(self, upload_id: str, name: str, budget: float, cut_percent: float, notes: str | None = None) -> None:
        self.upload_id = upload_id
        self.name = name
        self.budget = budget
        self.cut_percent = cut_percent
        self.notes = notes


class FeedbackPayload:
    def __init__(self, upload_id: str, nudge_id: str, accepted: bool, notes: str | None = None) -> None:
        self.upload_id = upload_id
        self.nudge_id = nudge_id
        self.accepted = accepted
        self.notes = notes



@app.exception_handler(HTTPException)
async def _handle_http_exception(request: Request, exc: HTTPException) -> JSONResponse:
    request_id = getattr(request.state, "request_id", request.headers.get("X-Request-ID", "unknown"))
    if isinstance(exc.detail, dict):
        error_message = str(exc.detail.get("error") or exc.detail.get("title") or "http_error")
        detail_message = str(exc.detail.get("detail") or exc.detail)
    else:
        error_message = str(exc.detail or "http_error")
        detail_message = str(exc.detail or "Request failed.")
    payload = {
        "error": error_message,
        "detail": detail_message,
        "code": exc.status_code,
        "request_id": request_id,
    }
    response = JSONResponse(status_code=exc.status_code, content=payload)
    response.headers["X-Request-ID"] = request_id
    return response


@app.exception_handler(RequestValidationError)
async def _handle_validation_error(request: Request, exc: RequestValidationError) -> JSONResponse:
    request_id = getattr(request.state, "request_id", request.headers.get("X-Request-ID", "unknown"))
    errors: list[dict[str, Any]] = []
    for error in exc.errors():
        location = [str(part) for part in error.get("loc", ()) if part != "body"]
        errors.append(
            {
                "field": ".".join(location) if location else "body",
                "message": str(error.get("msg", "Invalid value")),
            }
        )
    response = JSONResponse(
        status_code=422,
        content={
            "error": "validation_error",
            "detail": "Request validation failed.",
            "fields": errors,
            "request_id": request_id,
        },
    )
    response.headers["X-Request-ID"] = request_id
    return response


@app.exception_handler(Exception)
async def _handle_unexpected_error(request: Request, exc: Exception) -> JSONResponse:
    request_id = getattr(request.state, "request_id", request.headers.get("X-Request-ID", "unknown"))
    LOGGER.exception("Unhandled error for request %s: %s", request_id, exc)
    response = JSONResponse(
        status_code=500,
        content={
            "error": "internal_server_error",
            "detail": f"Unexpected error. Request ID: {request_id}",
            "request_id": request_id,
        },
    )
    response.headers["X-Request-ID"] = request_id
    return response


@app.get("/")
async def root(request: Request) -> dict[str, Any]:
    return {
        "name": "Kira-AI API",
        "version": app.version,
        "gemini_connected": bool(getattr(app.state, "gemini_connected", False)),
        "gitlab_connected": bool(getattr(app.state, "gitlab_connected", False)),
    }


@app.get("/health", response_model=HealthResponse)
async def health(request: Request) -> HealthResponse:
    started_at = getattr(app.state, "start_time", _now())
    uptime_seconds = round((_now() - started_at).total_seconds(), 2)
    return HealthResponse(
        status="ok",
        ts=int(_now().timestamp()),
        version=app.version,
        uptime_seconds=uptime_seconds,
        gemini_connected=bool(getattr(app.state, "gemini_connected", False)),
        gitlab_connected=bool(getattr(app.state, "gitlab_connected", False)),
    )


@protected_router.post("/upload", response_model=UploadResponse)
@limiter.limit("5/minute", exempt_when=_is_local_request)
async def upload_file(request: Request, file: UploadFile = File(...)) -> UploadResponse:
    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Upload file is empty.")

    frame, source = _load_uploaded_frame(content, file.filename)
    upload_id = f"kira_{int(time.time() * 1000):013d}"
    session = _build_session_record(upload_id, frame, file.filename, source)
    session["csv_path"] = str(_session_csv_path(upload_id))
    csv_path = _session_csv_path(upload_id)
    frame.to_csv(csv_path, index=False)
    _persist_session(session)

    parsed_format = "generic_pdf" if source == "pdf" else "csv"
    
    METRICS.upload_count_total.labels(source=source).inc()
    log_file_upload(
        upload_id=upload_id,
        rows=session["meta"]["rows"],
        source=source,
        size_bytes=len(content),
        ip=get_remote_address(request),
        request_id=getattr(request.state, "request_id", "unknown")
    )
    
    return UploadResponse(
        upload_id=upload_id,
        rows=session["meta"]["rows"],
        date_range=session["meta"]["date_range"],
        categories=session["meta"]["categories"],
        parsed_format=parsed_format,
    )


@protected_router.post("/coach", response_model=CoachResponse)
@limiter.limit("10/minute", exempt_when=_is_local_request)
async def coach(
    request: Request,
    upload_id: str = Query(..., alias="upload_id"),
    budget: float = Query(..., gt=0),
) -> CoachResponse:
    csv_path = _session_csv_path(upload_id)
    session = _require_session(upload_id)
    try:
        transactions = _load_session_transports(upload_id)
        if transactions.empty:
            raise HTTPException(status_code=400, detail="No transactions are available for this session.")

        # 1. Check coach cache
        cached_result = coach_cache.get(upload_id, budget) if coach_cache is not None else None
        if cached_result:
            METRICS.coach_cache_hits_total.labels(result="hit").inc()
            return cached_result
        
        METRICS.coach_cache_hits_total.labels(result="miss").inc()
        started_at = time.perf_counter()

        prediction = predict_broke_date(transactions, monthly_budget=budget, reference_date=datetime.now())
        addiction_scores = compute_addiction_scores(transactions)
        weekly = detect_weekly_anomalies(transactions)
        regret_stats = compute_regret_stats(transactions)
        merchant_late_night = late_night_merchant_alerts(transactions)

        coach_result = run_spending_coach_agent(
            transactions=transactions,
            monthly_budget=budget,
            prediction=prediction,
            addiction_scores=addiction_scores,
            weekly=weekly,
            regret_stats=regret_stats,
            merchant_late_night=merchant_late_night,
        )

        explanation_context = {
            "top_addiction_score": int(addiction_scores.iloc[0]["score"]) if not addiction_scores.empty else 0,
            "days_left": prediction.get("days_left"),
            "top_regret_category": str(regret_stats.iloc[0]["category"]) if not regret_stats.empty else None,
            "top_regret_score": float(regret_stats.iloc[0]["mean_regret"]) if not regret_stats.empty else 0.0,
            "top_category": coach_result.suggested_category,
        }
        explanation = explain_coach_decision(coach_result, explanation_context)
        coach_record = {
            **coach_result.as_dict(),
            "budget": budget,
            "prediction": prediction,
            "explanation": explanation,
            "generated_at": _now().isoformat(),
        }

        session.setdefault("coach_runs", []).append(jsonable_encoder(coach_record))
        session["latest_budget"] = budget
        session["latest_coach"] = jsonable_encoder(coach_record)
        session["status"] = coach_result.status
        _persist_session(session)
        save_snapshot(coach_result.as_dict(), source_key=upload_id)

        response = _build_coach_response(upload_id, coach_result, prediction, explanation)
        
        # 2. Record metrics and audit trail
        duration_ms = (time.perf_counter() - started_at) * 1000
        METRICS.coach_duration_seconds.labels(status=coach_result.status).observe(duration_ms / 1000.0)
        METRICS.coach_decisions_total.labels(status=coach_result.status, provider=coach_result.narrative_provider).inc()
        METRICS.narrative_provider_total.labels(provider=coach_result.narrative_provider).inc()
        
        log_coach_decision(
            upload_id=upload_id,
            status=coach_result.status,
            confidence=response.confidence_score,
            provider=coach_result.narrative_provider,
            duration_ms=duration_ms,
            ip=get_remote_address(request),
            request_id=getattr(request.state, "request_id", "unknown")
        )
        
        # 3. Store in cache
        if coach_cache is not None:
            coach_cache.set(upload_id, budget, response)
            
        return response
    finally:
        _safe_remove(csv_path)


@protected_router.post("/feedback", response_model=FeedbackResponse)
@limiter.limit("30/minute", exempt_when=_is_local_request)
async def feedback(request: Request, payload: FeedbackRequest) -> FeedbackResponse:
    upload_id = payload.upload_id
    nudge_id = payload.nudge_id
    accepted = payload.accepted
    notes = None

    session = _require_session(upload_id)
    reward = 1.0 if accepted else -1.0
    event = {
        "nudge_id": nudge_id,
        "accepted": accepted,
        "reward": reward,
        "notes": notes,
        "created_at": _now().isoformat(),
    }
    session.setdefault("feedback", []).append(event)
    _persist_session(session)
    record_feedback(_today_iso(), accepted, source_key=upload_id)

    total_feedback = len(session.get("feedback", []))
    accepted_count = sum(1 for item in session.get("feedback", []) if item.get("accepted"))
    acceptance_rate = round((accepted_count / total_feedback) * 100, 1) if total_feedback else 0.0
    
    log_feedback(
        upload_id=upload_id,
        accepted=accepted,
        ip=get_remote_address(request),
        request_id=getattr(request.state, "request_id", "unknown")
    )
    
    return FeedbackResponse(
        recorded=True,
        reward=int(reward),
        session_nudge_count=len(session.get("coach_runs", [])),
        acceptance_rate=acceptance_rate,
    )


@protected_router.get("/history/{upload_id}")
@limiter.limit("20/minute", exempt_when=_is_local_request)
async def history(request: Request, upload_id: str) -> dict[str, Any]:
    session = _require_session(upload_id)
    log_data_access(
        upload_id=upload_id, 
        endpoint="/history", 
        ip=get_remote_address(request), 
        request_id=getattr(request.state, "request_id", "unknown")
    )
    return _build_history_payload(session)


@protected_router.get("/metrics", response_model=MetricsResponse)
@limiter.limit("20/minute", exempt_when=_is_local_request)
async def metrics(request: Request) -> MetricsResponse:
    return MetricsResponse(**_build_metrics_payload())


@protected_router.get("/scenarios/{upload_id}")
@limiter.limit("20/minute", exempt_when=_is_local_request)
async def get_scenarios(request: Request, upload_id: str) -> dict[str, Any]:
    session = _require_session(upload_id)
    return {
        "upload_id": upload_id,
        "scenarios": session.get("scenarios", []),
    }


@protected_router.post("/scenarios")
@limiter.limit("10/minute", exempt_when=_is_local_request)
async def create_scenario(request: Request, payload: ScenarioRequest) -> dict[str, Any]:
    upload_id = payload.upload_id
    name = payload.label
    notes = None
    budget = payload.budget
    cut_percent = payload.cutback_pct
    cutback_category = payload.cutback_category

    session = _require_session(upload_id)
    transactions = _session_transactions(session)
    current_spend = month_to_date_spend(transactions) if not transactions.empty else 0.0
    scenario_id = nanoid(10)
    estimated_month_end = round(current_spend * (1 - cut_percent / 100.0), 2)
    scenario = {
        "scenario_id": scenario_id,
        "upload_id": upload_id,
        "label": name,
        "budget": budget,
        "cutback_pct": cut_percent,
        "cutback_category": cutback_category,
        "notes": notes,
        "current_spend": round(float(current_spend), 2),
        "estimated_month_end": estimated_month_end,
        "created_at": _now().isoformat(),
    }
    session.setdefault("scenarios", []).append(scenario)
    _persist_session(session)
    return scenario


@protected_router.delete("/session/{upload_id}")
@limiter.limit(COACH_RATE_LIMIT)
async def delete_session(request: Request, upload_id: str) -> dict[str, Any]:
    session_path = _session_json_path(upload_id)
    csv_path = _session_csv_path(upload_id)
    export_path = _session_export_path(upload_id)
    clear_memory(source_key=upload_id)
    with SESSION_LOCK:
        SESSION_STORE.pop(upload_id, None)
    if coach_cache is not None:
        coach_cache.invalidate(upload_id)
        
    _safe_remove(session_path)
    _safe_remove(csv_path)
    _safe_remove(export_path)
    
    log_session_delete(
        upload_id=upload_id, 
        ip=get_remote_address(request), 
        request_id=getattr(request.state, "request_id", "unknown")
    )
    
    return {"status": "deleted", "upload_id": upload_id}


@protected_router.get("/export/csv")
@limiter.limit("5/minute", exempt_when=_is_local_request)
async def export_csv(request: Request, upload_id: str = Query(..., alias="upload_id")) -> FileResponse:
    session = _require_session(upload_id)
    transactions = _session_transactions(session)
    if transactions.empty:
        raise HTTPException(status_code=404, detail="No transactions found for this session.")

    export_path = _session_export_path(upload_id)
    export_frame = transactions.copy()
    latest_coach = session.get("latest_coach") or {}
    if latest_coach:
        export_frame["coach_status"] = latest_coach.get("status")
        export_frame["coach_title"] = latest_coach.get("title")
        export_frame["suggested_limit"] = latest_coach.get("suggested_limit")
        export_frame["narrative_provider"] = latest_coach.get("narrative_provider")
        export_frame["narrative_model"] = latest_coach.get("narrative_model")
        
    # Apply Enterprise PII masking
    export_frame = apply_pii_masking_to_export(export_frame)
    export_frame.to_csv(export_path, index=False)
    
    log_data_access(
        upload_id=upload_id, 
        endpoint="/export/csv", 
        ip=get_remote_address(request), 
        request_id=getattr(request.state, "request_id", "unknown")
    )
    return FileResponse(
        path=export_path,
        filename=f"kira_{upload_id}_report.csv",
        media_type="text/csv",
        background=BackgroundTask(_safe_remove, export_path),
    )


@protected_router.get("/integrations/status", response_model=IntegrationsStatusResponse)
async def integrations_status(request: Request) -> IntegrationsStatusResponse:
    email_to, whatsapp_number = default_delivery_targets()
    gitlab_url = os.getenv("GITLAB_URL", "").strip()
    gitlab_token = os.getenv("GITLAB_TOKEN", "").strip() or os.getenv("GITLAB_API_TOKEN", "").strip()
    return IntegrationsStatusResponse(
        gitlab=bool(gitlab_url and gitlab_token and getattr(app.state, "gitlab_connected", False)),
        email=bool(email_to),
        whatsapp_twilio=bool(whatsapp_number),
        whatsapp_link=bool(whatsapp_number),
        sheets=bool(os.getenv("GOOGLE_SHEETS_ID", "").strip() and (os.getenv("GOOGLE_APPLICATION_CREDENTIALS", "").strip() or os.getenv("GOOGLE_API_KEY", "").strip())),
    )


app.include_router(protected_router)
