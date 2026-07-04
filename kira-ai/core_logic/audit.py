"""
src/audit.py
============
Immutable, append-only audit trail for Kira-AI.

All security-relevant events are logged to:
  1. A dedicated ``audit.log`` file (JSON Lines format)
  2. The structured application log (structlog / stdlib)

Events logged:
  - auth_attempt       — every API key validation (success & failure)
  - file_upload        — file upload with masked metadata
  - coach_decision     — each coach run with status, confidence, duration
  - data_access        — any read of session data
  - session_delete     — session deletion by user
  - retention_purge    — automated data retention cleanup

PII Policy:
  - upload_id  → first 12 chars only (mask_upload_id)
  - merchant   → SHA-256 hash (hash_merchant)
  - IP address → stored as-is (operational necessity, not PII in logs)
  - No transaction amounts, merchant names, or personal data in audit log
"""

from __future__ import annotations

import json
import logging
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from core_logic.observability import get_logger, hash_merchant, mask_upload_id

AUDIT_LOGGER = get_logger("kira.audit")
_STD_AUDIT_LOGGER = logging.getLogger("kira.audit")

# Audit log file path — configurable via AUDIT_LOG_PATH env var
_AUDIT_LOG_PATH = Path(os.getenv("AUDIT_LOG_PATH", ".coach_memory/audit.log"))


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _append_to_file(record: dict[str, Any]) -> None:
    """Append a JSON record to the audit log file (best-effort, never raises)."""
    try:
        _AUDIT_LOG_PATH.parent.mkdir(parents=True, exist_ok=True)
        with _AUDIT_LOG_PATH.open("a", encoding="utf-8") as fh:
            fh.write(json.dumps(record, ensure_ascii=False, default=str) + "\n")
    except Exception as exc:  # pragma: no cover
        _STD_AUDIT_LOGGER.exception("Failed to append audit record: %s", exc)


def _emit(event: str, **fields: Any) -> None:
    """Emit an audit event to both the log stream and the audit file."""
    record: dict[str, Any] = {
        "ts": _now_iso(),
        "event": event,
        **fields,
    }
    # Structured log (goes to ELK/CloudWatch)
    try:
        AUDIT_LOGGER.info(event, **{k: v for k, v in fields.items()})
    except Exception:
        _STD_AUDIT_LOGGER.info(json.dumps(record, default=str))
    # Audit file
    _append_to_file(record)


# ─────────────────────────────────────────────────────────────────────────────
# PUBLIC API
# ─────────────────────────────────────────────────────────────────────────────

def log_auth_attempt(
    *,
    success: bool,
    ip: str,
    request_id: str,
    reason: str = "",
) -> None:
    """Log every API authentication attempt — success or failure.

    Args:
        success:    Whether the token was valid.
        ip:         Client IP address.
        request_id: Correlation ID from X-Request-ID header.
        reason:     Failure reason if success=False (e.g. "missing_token").
    """
    _emit(
        "auth_attempt",
        success=success,
        ip=ip,
        request_id=request_id,
        reason=reason if not success else None,
    )


def log_file_upload(
    *,
    upload_id: str,
    rows: int,
    source: str,
    size_bytes: int,
    ip: str,
    request_id: str,
) -> None:
    """Log a file upload with PII-masked upload_id.

    Args:
        upload_id:   Raw upload ID (will be masked in log).
        rows:        Number of transaction rows parsed.
        source:      File format: "csv" or "pdf".
        size_bytes:  Raw file size in bytes.
        ip:          Client IP address.
        request_id:  Correlation ID.
    """
    _emit(
        "file_upload",
        upload_id=mask_upload_id(upload_id),
        rows=rows,
        source=source,
        size_bytes=size_bytes,
        ip=ip,
        request_id=request_id,
    )


def log_coach_decision(
    *,
    upload_id: str,
    status: str,
    confidence: float,
    provider: str,
    duration_ms: float,
    ip: str,
    request_id: str,
) -> None:
    """Log a coach decision with masked upload_id.

    Args:
        upload_id:   Raw upload ID (masked in log).
        status:      Coach status: "stable" | "watch" | "critical".
        confidence:  Confidence score (0.0–1.0).
        provider:    Narrative provider: "Gemini" | "Rule-based fallback".
        duration_ms: Total coach pipeline duration in milliseconds.
        ip:          Client IP address.
        request_id:  Correlation ID.
    """
    _emit(
        "coach_decision",
        upload_id=mask_upload_id(upload_id),
        status=status,
        confidence=round(confidence, 3),
        provider=provider,
        duration_ms=round(duration_ms, 1),
        ip=ip,
        request_id=request_id,
    )


def log_data_access(
    *,
    upload_id: str,
    endpoint: str,
    ip: str,
    request_id: str,
) -> None:
    """Log any read access to session/transaction data.

    Args:
        upload_id:  Raw upload ID (masked in log).
        endpoint:   API endpoint path accessed (e.g. "/history/{id}").
        ip:         Client IP address.
        request_id: Correlation ID.
    """
    _emit(
        "data_access",
        upload_id=mask_upload_id(upload_id),
        endpoint=endpoint,
        ip=ip,
        request_id=request_id,
    )


def log_session_delete(
    *,
    upload_id: str,
    ip: str,
    request_id: str,
) -> None:
    """Log a session deletion event.

    Args:
        upload_id:  Raw upload ID (masked in log).
        ip:         Client IP address.
        request_id: Correlation ID.
    """
    _emit(
        "session_delete",
        upload_id=mask_upload_id(upload_id),
        ip=ip,
        request_id=request_id,
    )


def log_retention_purge(
    *,
    sessions_deleted: int,
    files_deleted: int,
    retention_days: int,
) -> None:
    """Log an automated data retention cleanup run.

    Args:
        sessions_deleted: Number of expired session files removed.
        files_deleted:    Number of temp upload files removed.
        retention_days:   Configured retention window in days.
    """
    _emit(
        "retention_purge",
        sessions_deleted=sessions_deleted,
        files_deleted=files_deleted,
        retention_days=retention_days,
    )


def log_feedback(
    *,
    upload_id: str,
    accepted: bool,
    ip: str,
    request_id: str,
) -> None:
    """Log a user feedback submission.

    Args:
        upload_id:  Raw upload ID (masked in log).
        accepted:   Whether the user accepted the nudge.
        ip:         Client IP address.
        request_id: Correlation ID.
    """
    _emit(
        "feedback",
        upload_id=mask_upload_id(upload_id),
        accepted=accepted,
        ip=ip,
        request_id=request_id,
    )
