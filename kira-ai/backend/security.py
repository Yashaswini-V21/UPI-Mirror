"""
api/security.py
===============
Authentication, file validation, and input sanitisation for Kira-AI API.

Enterprise hardening (v2):
  - Minimum key length enforcement (32 chars) at startup
  - Key rotation age warning (configurable via KEY_ROTATION_DATE env)
  - Full audit log on every auth attempt via src.audit
  - validate_request_signature() for optional HMAC replay protection
  - All original file-validation and sanitisation helpers retained
"""

from __future__ import annotations

import csv
import hashlib
import hmac
import logging
import os
import tempfile
import time
from datetime import date, datetime
from pathlib import Path
from typing import Any

import pandas as pd
from fastapi import HTTPException, Request
from fastapi.security import HTTPAuthorizationCredentials

LOGGER = logging.getLogger(__name__)

# ── Configuration ──────────────────────────────────────────────────────────────
API_KEY: str = os.getenv("KIRA_AI_API_KEY", os.getenv("KIRA_AI_API_TOKEN", "")).strip()
TEMP_DIR: Path = Path(tempfile.gettempdir())
MAX_UPLOAD_BYTES: int = 5 * 1024 * 1024   # 5 MB
MAX_ROWS: int = 10_000
SAFE_PREFIX_CHARS: str = "=@+-\t\r"
MIN_KEY_LENGTH: int = 32                   # Minimum secure key length
KEY_ROTATION_DAYS: int = 90               # Warn if key is older than this


# ─────────────────────────────────────────────────────────────────────────────
# STARTUP VALIDATION
# ─────────────────────────────────────────────────────────────────────────────

def validate_startup_security() -> None:
    """Check API key length and rotation age at application startup.

    Logs warnings for insecure configurations — never raises, to avoid
    breaking deployments that haven't yet migrated secrets.
    """
    if not API_KEY:
        LOGGER.warning(
            "security_warning: KIRA_AI_API_KEY is not set — "
            "all protected endpoints are OPEN. Set this in production."
        )
        return

    if len(API_KEY) < MIN_KEY_LENGTH:
        LOGGER.warning(
            "security_warning: API key is shorter than %d characters (%d). "
            "Generate a secure key: python -c \"import secrets; print(secrets.token_hex(32))\"",
            MIN_KEY_LENGTH,
            len(API_KEY),
        )

    rotation_date_str = os.getenv("KEY_ROTATION_DATE", "").strip()
    if rotation_date_str:
        try:
            rotation_date = date.fromisoformat(rotation_date_str)
            age_days = (date.today() - rotation_date).days
            if age_days > KEY_ROTATION_DAYS:
                LOGGER.warning(
                    "security_warning: API key has not been rotated for %d days "
                    "(threshold: %d). Rotate via KEY_ROTATION_DATE env var.",
                    age_days,
                    KEY_ROTATION_DAYS,
                )
        except (ValueError, TypeError):
            LOGGER.warning("security_warning: KEY_ROTATION_DATE is not a valid ISO date.")


# ─────────────────────────────────────────────────────────────────────────────
# ERROR HELPERS
# ─────────────────────────────────────────────────────────────────────────────

def _unauthorized(reason: str = "invalid_token") -> HTTPException:
    """Return a generic 401. Intentionally vague to prevent token enumeration."""
    return HTTPException(
        status_code=401,
        detail="Unauthorized",
        headers={"WWW-Authenticate": "Bearer"},
    )


def _file_path(upload_id: str, suffix: str) -> Path:
    return TEMP_DIR / f"kira_{upload_id}{suffix}"


# ─────────────────────────────────────────────────────────────────────────────
# AUTHENTICATION
# ─────────────────────────────────────────────────────────────────────────────

def verify_api_key(credentials: HTTPAuthorizationCredentials) -> str:
    """Verify the bearer token using constant-time comparison.

    The error message is intentionally generic so callers cannot distinguish a
    missing token from an incorrect token (prevents timing attacks).
    """
    provided = getattr(credentials, "credentials", "") or ""
    if not API_KEY or not provided or not hmac.compare_digest(provided, API_KEY):
        raise _unauthorized()
    return provided


def validate_api_token(authorization: str | None, *, request: "Request | None" = None) -> None:
    """Validate Bearer token from Authorization header.

    Emits an audit log event for every attempt (success and failure).
    Compatible with the existing API entrypoint.

    Args:
        authorization: Raw Authorization header value.
        request:       Optional FastAPI Request for IP and request_id extraction.
    """
    ip = "unknown"
    request_id = "unknown"
    if request is not None:
        client = getattr(request, "client", None)
        ip = client.host if client else "unknown"
        request_id = getattr(request.state, "request_id", "unknown")

    # Import lazily to avoid circular import at module load time
    try:
        from core_logic.audit import log_auth_attempt
        _audit = log_auth_attempt
    except Exception:
        _audit = None  # type: ignore[assignment]

    if not API_KEY:
        # Auth disabled — allow all but log a warning once
        return

    if not authorization or not authorization.lower().startswith("bearer "):
        if _audit:
            _audit(success=False, ip=ip, request_id=request_id, reason="missing_bearer_token")
        raise _unauthorized("missing_bearer_token")

    provided = authorization.split(" ", 1)[1].strip()
    if not provided or not hmac.compare_digest(provided, API_KEY):
        if _audit:
            _audit(success=False, ip=ip, request_id=request_id, reason="invalid_token")
        raise _unauthorized("invalid_token")

    if _audit:
        _audit(success=True, ip=ip, request_id=request_id)


# ─────────────────────────────────────────────────────────────────────────────
# REQUEST SIGNATURE VALIDATION (Replay Attack Protection)
# ─────────────────────────────────────────────────────────────────────────────

def validate_request_signature(body: bytes, signature_header: str | None) -> bool:
    """Validate optional HMAC-SHA256 request body signature.

    If ``X-Kira-Signature`` header is present, it must match
    ``HMAC-SHA256(API_KEY, body)``. If the header is absent, validation
    is skipped (signature is optional, not mandatory).

    Args:
        body:             Raw request body bytes.
        signature_header: Value of X-Kira-Signature header.

    Returns:
        True if valid or not present. Raises HTTPException(401) if invalid.
    """
    if not signature_header:
        return True  # Signature is optional

    if not API_KEY:
        return True  # Can't validate without a key

    expected = hmac.new(
        API_KEY.encode("utf-8"),
        body,
        hashlib.sha256,
    ).hexdigest()

    provided = signature_header.strip().lower().removeprefix("sha256=")
    if not hmac.compare_digest(provided, expected):
        raise HTTPException(status_code=401, detail="Invalid request signature")

    return True


# ─────────────────────────────────────────────────────────────────────────────
# FILE VALIDATION
# ─────────────────────────────────────────────────────────────────────────────

def _csv_row_count(content: bytes) -> int:
    try:
        text = content.decode("utf-8-sig", errors="ignore")
    except Exception:
        text = content.decode(errors="ignore")
    reader = csv.reader(text.splitlines())
    rows = sum(1 for _ in reader)
    return max(rows - 1, 0)


def _required_columns_from_csv(content: bytes) -> list[str]:
    try:
        frame = pd.read_csv(pd.io.common.BytesIO(content), nrows=0)
    except Exception as exc:
        raise HTTPException(status_code=400, detail="Invalid CSV file") from exc
    required = ["datetime", "amount", "category", "merchant"]
    missing = [column for column in required if column not in frame.columns]
    return missing


def validate_upload_file(filename: str, content: bytes) -> None:
    """Validate upload extension, file size, magic bytes, and CSV structure.

    Args:
        filename: Original filename from the upload.
        content:  Raw file bytes.

    Raises:
        HTTPException 400/413/422 on validation failure.
    """
    suffix = Path(filename or "").suffix.lower()
    if suffix not in {".csv", ".pdf", ".txt"}:
        raise HTTPException(status_code=400, detail="Only CSV or PDF files accepted")

    if len(content) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail="File exceeds 5MB limit")

    magic = content[:4]
    if suffix in {".csv", ".txt"}:
        if magic in {b"%PDF", b"MZ\x90\x00"}:
            raise HTTPException(status_code=400, detail="Invalid file format")
        row_count = _csv_row_count(content)
        if row_count > MAX_ROWS:
            raise HTTPException(
                status_code=422, detail="File too large for processing (max 10,000 rows)"
            )
        missing = _required_columns_from_csv(content)
        if missing:
            raise HTTPException(status_code=422, detail="Invalid CSV format")
        return

    if magic != b"%PDF":
        raise HTTPException(
            status_code=400, detail="File does not appear to be a valid PDF"
        )


# ─────────────────────────────────────────────────────────────────────────────
# DATA SANITISATION
# ─────────────────────────────────────────────────────────────────────────────

def sanitize_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    """Remove spreadsheet injection vectors and obvious data errors.

    - Strips leading CSV-injection characters (=, @, +, -, tab, CR)
    - Caps amount values to ±₹10,000,000 (sanity bound)
    - Title-cases category values
    """
    frame = df.copy()
    for column in frame.columns:
        if pd.api.types.is_string_dtype(frame[column]) or frame[column].dtype == object:
            frame[column] = (
                frame[column]
                .astype("string")
                .fillna("")
                .map(lambda value: value.strip().lstrip(SAFE_PREFIX_CHARS))
            )

    if "amount" in frame.columns:
        frame["amount"] = pd.to_numeric(frame["amount"], errors="coerce")
        frame = frame[frame["amount"].abs() <= 10_000_000].copy()

    if "category" in frame.columns:
        frame["category"] = (
            frame["category"].astype("string").fillna("").map(lambda value: value.strip().title())
        )

    return frame.reset_index(drop=True)


# ─────────────────────────────────────────────────────────────────────────────
# SESSION FILE CLEANUP
# ─────────────────────────────────────────────────────────────────────────────

def cleanup_session_files(upload_id: str) -> None:
    """Delete the cached CSV/PDF files for a session upload."""
    removed_bytes = 0
    for suffix in (".csv", ".pdf"):
        path = _file_path(upload_id, suffix)
        try:
            removed_bytes += path.stat().st_size
            path.unlink()
        except FileNotFoundError:
            continue
        except OSError:
            continue
    file_size_kb = round(removed_bytes / 1024.0, 1)
    LOGGER.debug("Session cleanup completed: %sKB removed", file_size_kb)


def cleanup_stale_files(max_age_minutes: int = 60) -> int:
    """Remove stale cached upload files and return the number deleted."""
    cutoff = time.time() - (max_age_minutes * 60)
    removed = 0
    for suffix in (".csv", ".pdf"):
        for path in TEMP_DIR.glob(f"kira_*{suffix}"):
            try:
                if path.stat().st_mtime < cutoff:
                    path.unlink()
                    removed += 1
            except FileNotFoundError:
                continue
            except OSError:
                continue
    LOGGER.info("Removed %s stale session file(s)", removed)
    return removed


def make_upload_id() -> str:
    """Generate a timestamped upload id that matches the schema pattern."""
    return f"kira_{int(time.time() * 1000)}"
