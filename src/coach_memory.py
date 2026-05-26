from __future__ import annotations

import json
import os
import re
import tempfile
from datetime import date, datetime
from pathlib import Path
from threading import RLock
from typing import Any

_MAX_HISTORY = 30  # keep at most 30 daily snapshots
_MEMORY_LOCK = RLock()


def _memory_file_for(source_key: str | None = None) -> Path:
    """
    Resolve the snapshot file path for a given source key.

    Priority:
    1. COACH_MEMORY_PATH -> single explicit file (legacy-compatible)
    2. COACH_MEMORY_DIR/<sanitized_source>.json -> isolated per session
    """
    explicit_path = os.getenv("COACH_MEMORY_PATH", "").strip()
    if explicit_path:
        return Path(explicit_path)

    memory_dir = Path(os.getenv("COACH_MEMORY_DIR", ".coach_memory"))
    memory_dir.mkdir(parents=True, exist_ok=True)
    safe_key = re.sub(r"[^a-zA-Z0-9._-]", "_", (source_key or "demo"))
    return memory_dir / f"{safe_key}.json"


def _load_raw(source_key: str | None = None) -> list[dict[str, Any]]:
    """Read the on-disk snapshot file — returns an empty list if it doesn't exist yet."""
    with _MEMORY_LOCK:
        memory_file = _memory_file_for(source_key)
        if not memory_file.exists():
            return []
        try:
            with memory_file.open("r", encoding="utf-8") as fh:
                data = json.load(fh)
                return data if isinstance(data, list) else []
        except (json.JSONDecodeError, OSError):
            return []


def _save_raw(snapshots: list[dict[str, Any]], source_key: str | None = None) -> None:
    """Write snapshots back to disk, keeping only the most recent _MAX_HISTORY entries."""
    with _MEMORY_LOCK:
        memory_file = _memory_file_for(source_key)
        memory_file.parent.mkdir(parents=True, exist_ok=True)
        fd, temp_name = tempfile.mkstemp(prefix=memory_file.stem + ".", suffix=".tmp", dir=memory_file.parent)
        try:
            with os.fdopen(fd, "w", encoding="utf-8") as fh:
                json.dump(snapshots[-_MAX_HISTORY:], fh, indent=2, default=str)
                fh.flush()
                os.fsync(fh.fileno())
            os.replace(temp_name, memory_file)
        finally:
            if os.path.exists(temp_name):
                try:
                    os.remove(temp_name)
                except OSError:
                    pass


def save_snapshot(coach_result_dict: dict[str, Any], source_key: str | None = None) -> None:
    """
    Append today's coach run to the memory file.

    If a snapshot for today already exists it gets replaced — so refreshing
    the dashboard doesn't create duplicate rows.
    """
    with _MEMORY_LOCK:
        today = date.today().isoformat()
        snapshots = _load_raw(source_key=source_key)
        # Drop any existing entry for today so we always have the freshest run
        snapshots = [s for s in snapshots if s.get("date") != today]
        snapshots.append(
            {
                "date": today,
                "saved_at": datetime.now().isoformat(timespec="seconds"),
                **{k: v for k, v in coach_result_dict.items() if k != "actions"},
            }
        )
        _save_raw(snapshots, source_key=source_key)


def load_history(last_n: int = 7, source_key: str | None = None) -> list[dict[str, Any]]:
    """
    Return the most recent `last_n` daily snapshots, oldest-first so they
    are easy to plot on a timeline.
    """
    with _MEMORY_LOCK:
        snapshots = _load_raw(source_key=source_key)
        return snapshots[-last_n:]


def record_feedback(date_str: str, accepted: bool, source_key: str | None = None) -> None:
    """
    Save the user's response to the coach nudge for a given date.

    Sets ``user_feedback`` to "accepted" or "dismissed" and writes a
    ``user_reward`` of +1.0 or −1.0 so Agent Lightning can use real
    human signal instead of the heuristic reward.
    """
    with _MEMORY_LOCK:
        snapshots = _load_raw(source_key=source_key)
        for snapshot in snapshots:
            if snapshot.get("date") == date_str:
                snapshot["user_feedback"] = "accepted" if accepted else "dismissed"
                snapshot["user_reward"] = 1.0 if accepted else -1.0
                break
        _save_raw(snapshots, source_key=source_key)


def clear_memory(source_key: str | None = None) -> None:
    """Wipe the memory file — useful for testing or a fresh start."""
    with _MEMORY_LOCK:
        memory_file = _memory_file_for(source_key)
        if memory_file.exists():
            memory_file.unlink()
