"""api/schemas.py
================
Pydantic v2 request / response schemas for the Kira-AI API.

Schemas:
  HealthResponse            — GET /health
  UploadResponse            — POST /upload
  FeedbackRequest           — POST /feedback  (request body)
  FeedbackResponse          — POST /feedback  (response)
  ScenarioRequest           — POST /scenarios (request body)
  SignalData                — Embedded in CoachResponse
  CoachResponse             — POST /coach
  MetricsResponse           — GET /metrics
  ErrorResponse             — All error responses
  IntegrationsStatusResponse — GET /integrations/status

All schemas inherit from ``KiraBaseModel`` which strips whitespace and
validates on assignment.
"""

from __future__ import annotations

from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator

# Upload IDs must match this pattern: kira_<13-digit timestamp>
UPLOAD_ID_PATTERN = r"^kira_\d{13}$"


class KiraBaseModel(BaseModel):
    model_config = ConfigDict(validate_assignment=True)


class DateRange(KiraBaseModel):
    start: str
    end: str


class HealthResponse(KiraBaseModel):
    status: str
    ts: int
    version: str
    uptime_seconds: float
    gemini_connected: bool
    gitlab_connected: bool


class UploadResponse(KiraBaseModel):
    upload_id: str = Field(min_length=8, pattern=UPLOAD_ID_PATTERN)
    rows: int = Field(ge=0)
    date_range: DateRange
    categories: list[str]
    parsed_format: Literal["csv", "google_pay", "paytm", "phonepe", "generic_pdf"]


class FeedbackRequest(KiraBaseModel):
    upload_id: str = Field(min_length=8, pattern=UPLOAD_ID_PATTERN)
    nudge_id: str = Field(default="n1")
    accepted: bool


class ScenarioRequest(KiraBaseModel):
    upload_id: str = Field(min_length=8, pattern=UPLOAD_ID_PATTERN)
    label: str = Field(max_length=60)
    budget: float = Field(gt=100, le=1_000_000)
    cutback_pct: float = Field(ge=0, le=80)
    cutback_category: str


class SignalData(KiraBaseModel):
    anomaly_detected: bool
    anomaly_weight: float
    habit_score: float
    habit_weight: float
    days_left: int
    days_weight: float
    regret_flag: bool
    regret_weight: float
    top_category: str
    burn_rate_daily: float
    confidence_score: float

    @field_validator(
        "anomaly_weight",
        "habit_score",
        "habit_weight",
        "days_weight",
        "regret_weight",
        "confidence_score",
    )
    @classmethod
    def _validate_unit_interval(cls, value: float) -> float:
        if not 0.0 <= float(value) <= 1.0:
            raise ValueError("must be between 0.0 and 1.0")
        return float(value)


class CoachResponse(KiraBaseModel):
    upload_id: str = Field(min_length=8, pattern=UPLOAD_ID_PATTERN)
    status: Literal["stable", "watch", "critical"]
    days_left: int
    narrative: str
    action: str
    urgency: Literal["low", "medium", "high"]
    tip: str
    suggested_cap: float
    nudge: str
    signals: SignalData
    gitlab_issue_url: Optional[str] = None
    whatsapp_link: str
    confidence_score: float

    @field_validator("confidence_score")
    @classmethod
    def _validate_confidence_score(cls, value: float) -> float:
        if not 0.0 <= float(value) <= 1.0:
            raise ValueError("must be between 0.0 and 1.0")
        return float(value)


class FeedbackResponse(KiraBaseModel):
    recorded: bool
    reward: int
    session_nudge_count: int
    acceptance_rate: float


class MetricsResponse(KiraBaseModel):
    forecast_mae_days: Optional[float] = None
    signal_coverage_pct: float
    nudge_acceptance_rate: float
    model_quality_score: float
    total_sessions: int
    gemini_calls_today: int

    @field_validator("model_quality_score")
    @classmethod
    def _validate_model_quality_score(cls, value: float) -> float:
        if not 0.0 <= float(value) <= 1.0:
            raise ValueError("must be between 0.0 and 1.0")
        return float(value)


class ErrorResponse(KiraBaseModel):
    error: str
    detail: str
    code: int
    request_id: str


class IntegrationsStatusResponse(KiraBaseModel):
    gitlab: bool
    email: bool
    whatsapp_twilio: bool
    whatsapp_link: bool
    sheets: bool
