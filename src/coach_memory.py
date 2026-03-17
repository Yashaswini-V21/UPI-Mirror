from __future__ import annotations

import json
import os
from datetime import date, datetime
from pathlib import Path
from typing import Any

_MEMORY_FILE = Path(os.getenv("COACH_MEMORY_PATH", ".coach_memory.json"))
_MAX_HISTORY = 30  # keep at most 30 daily snapshots


def _load_raw() -> list[dict[str, Any]]:
    """Read the on-disk snapshot file — returns an empty list if it doesn't exist yet."""
    if not _MEMORY_FILE.exists():
        return []
    try:
        with _MEMORY_FILE.open("r", encoding="utf-8") as fh:
            data = json.load(fh)
            return data if isinstance(data, list) else []
    except (json.JSONDecodeError, OSError):
        return []


def _save_raw(snapshots: list[dict[str, Any]]) -> None:
    """Write snapshots back to disk, keeping only the most recent _MAX_HISTORY entries."""
    with _MEMORY_FILE.open("w", encoding="utf-8") as fh:
        json.dump(snapshots[-_MAX_HISTORY:], fh, indent=2, default=str)


def save_snapshot(coach_result_dict: dict[str, Any]) -> None:
    """
    Append today's coach run to the memory file.

    If a snapshot for today already exists it gets replaced — so refreshing
    the dashboard doesn't create duplicate rows.
    """
    today = date.today().isoformat()
    snapshots = _load_raw()
    # Drop any existing entry for today so we always have the freshest run
    snapshots = [s for s in snapshots if s.get("date") != today]
    snapshots.append(
        {
            "date": today,
            "saved_at": datetime.now().isoformat(timespec="seconds"),
            **{k: v for k, v in coach_result_dict.items() if k != "actions"},
        }
    )
    _save_raw(snapshots)


def load_history(last_n: int = 7) -> list[dict[str, Any]]:
    """
    Return the most recent `last_n` daily snapshots, oldest-first so they
    are easy to plot on a timeline.
    """
    snapshots = _load_raw()
    return snapshots[-last_n:]


def clear_memory() -> None:
    """Wipe the memory file — useful for testing or a fresh start."""
    if _MEMORY_FILE.exists():
        _MEMORY_FILE.unlink()
