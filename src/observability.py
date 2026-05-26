"""
src/observability.py
====================
Enterprise-grade observability for Kira-AI.

Provides:
- Structured JSON logging via structlog (ELK/CloudWatch compatible)
- Prometheus metrics: request latency, coach decisions, upload counts
- OpenTelemetry tracing (OTLP exporter, configurable via env)
- PII-safe helpers: mask_upload_id(), hash_merchant()
- Correlation ID propagation across the request lifecycle

Usage:
    from src.observability import get_logger, METRICS, configure_logging
    configure_logging()
    log = get_logger(__name__)
    log.info("coach_decision", upload_id=mask_upload_id(uid), status="critical")
"""

from __future__ import annotations

import hashlib
import logging
import os
import sys
from typing import Any

# ── Structlog ──────────────────────────────────────────────────────────────────
try:
    import structlog

    _STRUCTLOG_AVAILABLE = True
except ImportError:  # pragma: no cover
    structlog = None  # type: ignore[assignment]
    _STRUCTLOG_AVAILABLE = False

# ── Prometheus ─────────────────────────────────────────────────────────────────
try:
    from prometheus_client import Counter, Gauge, Histogram, CollectorRegistry, REGISTRY

    _PROMETHEUS_AVAILABLE = True
except ImportError:  # pragma: no cover
    Counter = Gauge = Histogram = CollectorRegistry = REGISTRY = None  # type: ignore[misc, assignment]
    _PROMETHEUS_AVAILABLE = False

# ── OpenTelemetry ──────────────────────────────────────────────────────────────
try:
    from opentelemetry import trace
    from opentelemetry.sdk.trace import TracerProvider
    from opentelemetry.sdk.trace.export import BatchSpanProcessor
    from opentelemetry.sdk.resources import Resource

    _OTEL_AVAILABLE = True
except ImportError:  # pragma: no cover
    trace = TracerProvider = BatchSpanProcessor = Resource = None  # type: ignore[misc, assignment]
    _OTEL_AVAILABLE = False


# ─────────────────────────────────────────────────────────────────────────────
# PII-SAFE HELPERS
# ─────────────────────────────────────────────────────────────────────────────

def mask_upload_id(upload_id: str) -> str:
    """Return a log-safe version of an upload ID: first 12 chars + '***'.

    Example: 'kira_17169234' → 'kira_171692***'
    """
    if not upload_id:
        return "***"
    visible = upload_id[:12]
    return f"{visible}***"


def hash_merchant(name: str) -> str:
    """Return a deterministic, one-way SHA-256 hash (12-char hex) of a merchant name.

    Used to correlate log events without exposing raw PII in log streams.
    """
    if not name:
        return "unknown"
    digest = hashlib.sha256(name.lower().strip().encode("utf-8")).hexdigest()
    return digest[:12]


# ─────────────────────────────────────────────────────────────────────────────
# PROMETHEUS METRICS
# ─────────────────────────────────────────────────────────────────────────────

class _DummyMetric:
    """No-op metric used when prometheus_client is not installed."""

    def labels(self, **_: Any) -> "_DummyMetric":
        return self

    def inc(self, *_: Any) -> None:
        pass

    def observe(self, *_: Any) -> None:
        pass

    def set(self, *_: Any) -> None:
        pass

    def time(self) -> "_DummyContextManager":
        return _DummyContextManager()


class _DummyContextManager:
    def __enter__(self) -> "_DummyContextManager":
        return self

    def __exit__(self, *_: Any) -> None:
        pass


def _make_counter(name: str, description: str, labels: list[str]) -> Any:
    if not _PROMETHEUS_AVAILABLE:
        return _DummyMetric()
    try:
        return Counter(name, description, labels)
    except ValueError:
        # Already registered (e.g. in tests with module re-import)
        return REGISTRY._names_to_collectors.get(name, _DummyMetric())


def _make_histogram(name: str, description: str, labels: list[str], buckets: tuple | None = None) -> Any:
    if not _PROMETHEUS_AVAILABLE:
        return _DummyMetric()
    kwargs: dict[str, Any] = {"labelnames": labels}
    if buckets:
        kwargs["buckets"] = buckets
    try:
        return Histogram(name, description, **kwargs)
    except ValueError:
        return REGISTRY._names_to_collectors.get(name, _DummyMetric())


def _make_gauge(name: str, description: str, labels: list[str]) -> Any:
    if not _PROMETHEUS_AVAILABLE:
        return _DummyMetric()
    try:
        return Gauge(name, description, labels)
    except ValueError:
        return REGISTRY._names_to_collectors.get(name, _DummyMetric())


class _Metrics:
    """Singleton container for all Prometheus metrics."""

    # HTTP
    http_requests_total: Any = _make_counter(
        "kira_http_requests_total",
        "Total HTTP requests by method, path, status",
        ["method", "path", "status_code"],
    )
    http_request_duration_seconds: Any = _make_histogram(
        "kira_http_request_duration_seconds",
        "HTTP request duration in seconds",
        ["method", "path"],
        buckets=(0.01, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0),
    )

    # Coach
    coach_decisions_total: Any = _make_counter(
        "kira_coach_decisions_total",
        "Coach decisions by status and narrative provider",
        ["status", "provider"],
    )
    coach_duration_seconds: Any = _make_histogram(
        "kira_coach_duration_seconds",
        "Time to generate a coach recommendation in seconds",
        ["status"],
        buckets=(0.1, 0.5, 1.0, 2.0, 5.0, 10.0, 15.0, 30.0),
    )
    coach_cache_hits_total: Any = _make_counter(
        "kira_coach_cache_hits_total",
        "Coach result cache hits vs misses",
        ["result"],  # "hit" | "miss"
    )

    # Uploads
    upload_count_total: Any = _make_counter(
        "kira_upload_count_total",
        "File uploads by source format",
        ["source"],
    )

    # Narratives
    narrative_provider_total: Any = _make_counter(
        "kira_narrative_provider_total",
        "Narrative generation by provider",
        ["provider"],  # "gemini" | "template" | "groq"
    )
    narrative_circuit_open_total: Any = _make_counter(
        "kira_narrative_circuit_open_total",
        "Times the Gemini circuit breaker was open",
        [],
    )

    # Sessions
    active_sessions: Any = _make_gauge(
        "kira_active_sessions",
        "Current number of active sessions in memory",
        [],
    )

    # Auth
    auth_failures_total: Any = _make_counter(
        "kira_auth_failures_total",
        "API authentication failures",
        ["reason"],
    )


# Global singleton
METRICS = _Metrics()


# ─────────────────────────────────────────────────────────────────────────────
# STRUCTLOG CONFIGURATION
# ─────────────────────────────────────────────────────────────────────────────

_LOGGING_CONFIGURED = False


def configure_logging(
    level: str | None = None,
    fmt: str | None = None,
) -> None:
    """Configure structlog and stdlib logging for the application.

    Call once at application startup. Safe to call multiple times (idempotent).

    Args:
        level: Log level string, e.g. "INFO", "DEBUG". Defaults to env
               ``LOG_LEVEL`` or ``"INFO"``.
        fmt:   "json" for machine-readable JSON (production) or "console"
               for human-readable (development). Defaults to env
               ``LOG_FORMAT`` or ``"json"`` in production.
    """
    global _LOGGING_CONFIGURED
    if _LOGGING_CONFIGURED:
        return

    effective_level = (level or os.getenv("LOG_LEVEL", "INFO")).upper()
    environment = os.getenv("ENVIRONMENT", "development").lower()
    effective_fmt = fmt or os.getenv("LOG_FORMAT", "json" if environment == "production" else "console")

    # Configure stdlib root logger
    logging.basicConfig(
        format="%(message)s",
        stream=sys.stdout,
        level=getattr(logging, effective_level, logging.INFO),
    )

    if not _STRUCTLOG_AVAILABLE:
        # Fall back to plain logging if structlog is not installed
        _LOGGING_CONFIGURED = True
        return

    shared_processors: list[Any] = [
        structlog.contextvars.merge_contextvars,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.processors.TimeStamper(fmt="iso", utc=True),
        structlog.processors.StackInfoRenderer(),
    ]

    if effective_fmt == "json":
        # Production: machine-readable JSON for ELK/CloudWatch
        processors = shared_processors + [
            structlog.processors.dict_tracebacks,
            structlog.processors.JSONRenderer(),
        ]
    else:
        # Development: colourised console output
        processors = shared_processors + [
            structlog.dev.ConsoleRenderer(colors=True),
        ]

    structlog.configure(
        processors=processors,
        wrapper_class=structlog.make_filtering_bound_logger(
            getattr(logging, effective_level, logging.INFO)
        ),
        context_class=dict,
        logger_factory=structlog.PrintLoggerFactory(),
        cache_logger_on_first_use=True,
    )

    _LOGGING_CONFIGURED = True


def get_logger(name: str = "kira") -> Any:
    """Return a structlog bound logger, falling back to stdlib if unavailable."""
    if _STRUCTLOG_AVAILABLE:
        return structlog.get_logger(name)
    return logging.getLogger(name)


# ─────────────────────────────────────────────────────────────────────────────
# OPENTELEMETRY TRACING
# ─────────────────────────────────────────────────────────────────────────────

_TRACER: Any = None


def configure_tracing(service_name: str = "kira-ai") -> None:
    """Initialise OpenTelemetry tracing with OTLP export.

    OTLP endpoint is read from env var ``OTLP_ENDPOINT``.
    If the env var is absent or OpenTelemetry is not installed, tracing is
    silently disabled — the application works normally without it.
    """
    global _TRACER
    if not _OTEL_AVAILABLE:
        return

    otlp_endpoint = os.getenv("OTLP_ENDPOINT", "").strip()
    resource = Resource.create({"service.name": service_name, "service.version": "1.0.0"})
    provider = TracerProvider(resource=resource)

    if otlp_endpoint:
        try:
            from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter

            exporter = OTLPSpanExporter(endpoint=otlp_endpoint)
            provider.add_span_processor(BatchSpanProcessor(exporter))
        except Exception:  # pragma: no cover
            pass  # Tracing disabled — non-fatal

    trace.set_tracer_provider(provider)
    _TRACER = trace.get_tracer(service_name)


def get_tracer() -> Any:
    """Return the global OpenTelemetry tracer (or a no-op if not configured)."""
    global _TRACER
    if _TRACER is None and _OTEL_AVAILABLE:
        configure_tracing()
    return _TRACER
