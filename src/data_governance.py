"""
src/data_governance.py
======================
Data governance, PII policy enforcement and retention management for Kira-AI.

Responsibilities:
  - apply_retention_policy(): delete sessions older than N days
  - enforce_session_cap():    evict oldest sessions when cap is exceeded
  - apply_pii_masking_to_export(): sanitize exports before sending to clients
  - mask_upload_id() / hash_merchant(): re-exported from observability for convenience

Constants (also configurable via environment variables):
  DEFAULT_RETENTION_DAYS = 90
  MAX_SESSIONS            = 10_000
"""

from __future__ import annotations

import json
import logging
import os
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

import pandas as pd

from src.observability import hash_merchant, mask_upload_id  # noqa: F401 — re-exported

LOGGER = logging.getLogger(__name__)

# ── Configurable constants ────────────────────────────────────────────────────
DEFAULT_RETENTION_DAYS: int = int(os.getenv("DATA_RETENTION_DAYS", "90"))
MAX_SESSIONS: int = int(os.getenv("MAX_SESSIONS", "10000"))

# Columns that may contain PII in exported DataFrames
_PII_COLUMNS = ("merchant", "payee", "receiver", "counterparty", "description", "details")


# ─────────────────────────────────────────────────────────────────────────────
# RETENTION POLICY
# ─────────────────────────────────────────────────────────────────────────────

def apply_retention_policy(
    session_dir: Path,
    max_age_days: int | None = None,
) -> dict[str, int]:
    """Delete session JSON files older than *max_age_days*.

    This is called at application startup so stale data is never served.
    It is safe to call concurrently — uses atomic file operations.

    Args:
        session_dir:  Directory containing ``*.json`` session files.
        max_age_days: Retention window. Defaults to ``DEFAULT_RETENTION_DAYS``.

    Returns:
        Dict with keys ``sessions_deleted`` and ``bytes_freed``.
    """
    retention = max_age_days if max_age_days is not None else DEFAULT_RETENTION_DAYS
    cutoff = datetime.now(timezone.utc) - timedelta(days=retention)
    sessions_deleted = 0
    bytes_freed = 0

    if not session_dir.exists():
        return {"sessions_deleted": 0, "bytes_freed": 0}

    for path in session_dir.glob("*.json"):
        try:
            stat = path.stat()
            modified_at = datetime.fromtimestamp(stat.st_mtime, tz=timezone.utc)
            if modified_at < cutoff:
                bytes_freed += stat.st_size
                path.unlink(missing_ok=True)
                sessions_deleted += 1
        except OSError:
            continue

    if sessions_deleted:
        LOGGER.info(
            "data_retention_purge",
            extra={
                "sessions_deleted": sessions_deleted,
                "bytes_freed": bytes_freed,
                "retention_days": retention,
            },
        )

    return {"sessions_deleted": sessions_deleted, "bytes_freed": bytes_freed}


def enforce_session_cap(
    session_store: dict[str, Any],
    session_dir: Path,
    max_sessions: int | None = None,
) -> int:
    """Evict the oldest sessions when ``SESSION_STORE`` exceeds *max_sessions*.

    Oldest sessions are determined by ``updated_at`` timestamp.
    Eviction removes both the in-memory entry and the JSON file.

    Args:
        session_store: The in-memory ``SESSION_STORE`` dict (mutated in-place).
        session_dir:   Directory for session JSON files.
        max_sessions:  Cap. Defaults to ``MAX_SESSIONS``.

    Returns:
        Number of sessions evicted.
    """
    cap = max_sessions if max_sessions is not None else MAX_SESSIONS
    evicted = 0

    while len(session_store) > cap:
        # Find oldest by updated_at
        oldest_id = min(
            session_store,
            key=lambda uid: str(session_store[uid].get("updated_at", "")),
        )
        session_store.pop(oldest_id, None)
        path = session_dir / f"{oldest_id}.json"
        try:
            path.unlink(missing_ok=True)
        except OSError:
            pass
        evicted += 1

    return evicted


# ─────────────────────────────────────────────────────────────────────────────
# PII MASKING FOR EXPORTS
# ─────────────────────────────────────────────────────────────────────────────

def apply_pii_masking_to_export(df: pd.DataFrame) -> pd.DataFrame:
    """Replace raw merchant/payee values with PII-safe hashed references.

    This is applied to every exported CSV before it is written to disk and
    streamed to the client. The hash is deterministic so the same merchant
    always maps to the same token — useful for analytics without revealing names.

    Columns masked: merchant, payee, receiver, counterparty, description, details.

    Args:
        df: Source DataFrame (not mutated — a copy is returned).

    Returns:
        A new DataFrame with PII columns hashed.
    """
    result = df.copy()
    for col in _PII_COLUMNS:
        if col in result.columns:
            result[col] = result[col].astype(str).apply(
                lambda v: f"merchant_{hash_merchant(v)}" if v and v != "nan" else v
            )
    return result


def redact_session_for_log(session: dict[str, Any]) -> dict[str, Any]:
    """Return a log-safe copy of a session record with PII removed.

    Removes ``transactions`` list (bulk PII) and masks ``upload_id``.
    Safe to pass directly to structlog.

    Args:
        session: Raw session dict from SESSION_STORE.

    Returns:
        A shallow copy with sensitive fields redacted.
    """
    safe: dict[str, Any] = {
        "upload_id": mask_upload_id(str(session.get("upload_id", ""))),
        "status": session.get("status"),
        "created_at": session.get("created_at"),
        "updated_at": session.get("updated_at"),
        "meta_rows": session.get("meta", {}).get("rows"),
        "meta_source": session.get("meta", {}).get("source"),
        "coach_runs_count": len(session.get("coach_runs", [])),
        "feedback_count": len(session.get("feedback", [])),
    }
    return safe


def validate_retention_config() -> None:
    """Warn if retention is configured insecurely at startup."""
    if DEFAULT_RETENTION_DAYS > 365:
        LOGGER.warning(
            "data_retention_warning",
            extra={
                "message": "DATA_RETENTION_DAYS exceeds 365 — review GDPR/CCPA compliance",
                "configured_days": DEFAULT_RETENTION_DAYS,
            },
        )
    if MAX_SESSIONS > 100_000:
        LOGGER.warning(
            "session_cap_warning",
            extra={
                "message": "MAX_SESSIONS exceeds 100,000 — may cause memory pressure",
                "configured_max": MAX_SESSIONS,
            },
        )
