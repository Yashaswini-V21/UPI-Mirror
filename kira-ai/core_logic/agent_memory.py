"""src/agent_memory.py
====================
Kira-AI multi-turn agent memory for adaptive coaching.

Persists past coaching decisions per session so the LangGraph pipeline can
adapt its tone, thresholds, and recommendations based on historical user
responsiveness. Each session accumulates a bounded history of coaching
interactions and feedback.

Thread-safe via ``_MEMORY_LOCK``. File-backed via ``.coach_memory/`` JSON
files, consistent with the existing snapshot infrastructure.

Public API:
  - load_agent_memory():   Read prior coaching context for a session.
  - save_agent_memory():   Persist a coaching result + feedback into memory.
  - build_memory_context(): Build the ``memory_context`` dict for pipeline injection.
"""

from __future__ import annotations

import json
import logging
from dataclasses import asdict, dataclass, field
from datetime import datetime
from pathlib import Path
from threading import RLock
from typing import Any

LOGGER = logging.getLogger(__name__)
_MEMORY_LOCK = RLock()
_MEMORY_DIR = Path(".coach_memory")
_MAX_MEMORY_ENTRIES = 10  # Keep last N coaching interactions per session


@dataclass(slots=True)
class CoachingMemoryEntry:
    """One coaching interaction stored in agent memory."""
    timestamp: str
    status: str
    nudge: str
    suggested_cap: float
    top_category: str
    confidence_score: float
    anomaly_detected: bool
    repeat_pattern_detected: bool
    user_accepted: bool | None = None  # None = no feedback yet


@dataclass(slots=True)
class AgentMemory:
    """Accumulated coaching memory for a session."""
    upload_id: str
    entries: list[CoachingMemoryEntry] = field(default_factory=list)
    total_nudges_issued: int = 0
    total_accepted: int = 0
    total_dismissed: int = 0
    dominant_category: str = ""
    avg_confidence: float = 0.0

    def acceptance_rate(self) -> float:
        """Fraction of nudges the user accepted (0.0–1.0)."""
        total_responded = self.total_accepted + self.total_dismissed
        if total_responded == 0:
            return 0.5  # Neutral prior
        return self.total_accepted / total_responded

    def recent_statuses(self, n: int = 3) -> list[str]:
        """Last N coaching statuses (e.g., ['watch', 'critical', 'watch'])."""
        return [e.status for e in self.entries[-n:]]

    def is_escalating(self) -> bool:
        """True if the last 3 sessions show worsening status."""
        recent = self.recent_statuses(3)
        severity = {"stable": 0, "watch": 1, "critical": 2}
        scores = [severity.get(s, 1) for s in recent]
        return len(scores) >= 2 and scores[-1] > scores[0]


def _memory_path(upload_id: str) -> Path:
    """Filepath for a session's agent memory JSON."""
    return _MEMORY_DIR / f"{upload_id}_agent_memory.json"


def load_agent_memory(upload_id: str) -> AgentMemory:
    """Load persisted agent memory for a session.

    Returns an empty ``AgentMemory`` if no prior history exists.
    Thread-safe.
    """
    with _MEMORY_LOCK:
        path = _memory_path(upload_id)
        if not path.exists():
            return AgentMemory(upload_id=upload_id)

        try:
            raw = json.loads(path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError) as exc:
            LOGGER.warning("Failed to load agent memory for %s: %s", upload_id, exc)
            return AgentMemory(upload_id=upload_id)

        entries = []
        for entry_data in raw.get("entries", []):
            try:
                entries.append(CoachingMemoryEntry(**entry_data))
            except (TypeError, KeyError):
                continue

        return AgentMemory(
            upload_id=upload_id,
            entries=entries[-_MAX_MEMORY_ENTRIES:],
            total_nudges_issued=int(raw.get("total_nudges_issued", 0)),
            total_accepted=int(raw.get("total_accepted", 0)),
            total_dismissed=int(raw.get("total_dismissed", 0)),
            dominant_category=str(raw.get("dominant_category", "")),
            avg_confidence=float(raw.get("avg_confidence", 0.0)),
        )


def save_agent_memory(memory: AgentMemory) -> None:
    """Persist agent memory to disk. Caps at ``_MAX_MEMORY_ENTRIES`` entries.

    Thread-safe. Creates the memory directory if absent.
    """
    with _MEMORY_LOCK:
        _MEMORY_DIR.mkdir(parents=True, exist_ok=True)
        memory.entries = memory.entries[-_MAX_MEMORY_ENTRIES:]

        # Recompute aggregate stats
        if memory.entries:
            categories = [e.top_category for e in memory.entries if e.top_category]
            if categories:
                memory.dominant_category = max(set(categories), key=categories.count)
            confidences = [e.confidence_score for e in memory.entries]
            memory.avg_confidence = round(sum(confidences) / len(confidences), 3)

        payload = {
            "upload_id": memory.upload_id,
            "entries": [asdict(e) for e in memory.entries],
            "total_nudges_issued": memory.total_nudges_issued,
            "total_accepted": memory.total_accepted,
            "total_dismissed": memory.total_dismissed,
            "dominant_category": memory.dominant_category,
            "avg_confidence": memory.avg_confidence,
        }

        path = _memory_path(memory.upload_id)
        try:
            path.write_text(
                json.dumps(payload, indent=2, ensure_ascii=False, default=str),
                encoding="utf-8",
            )
        except OSError as exc:
            LOGGER.error("Failed to save agent memory for %s: %s", memory.upload_id, exc)


def record_coaching_result(
    upload_id: str,
    status: str,
    nudge: str,
    suggested_cap: float,
    top_category: str,
    confidence_score: float,
    anomaly_detected: bool,
    repeat_pattern_detected: bool,
) -> AgentMemory:
    """Append a new coaching result to the session's agent memory.

    Args:
        upload_id: Session identifier.
        status: Coach status (stable/watch/critical).
        nudge: The nudge text issued.
        suggested_cap: Spending cap recommended (₹).
        top_category: Primary overspend category.
        confidence_score: Pipeline confidence (0–1).
        anomaly_detected: Whether an anomaly was flagged.
        repeat_pattern_detected: Whether a repeat pattern was flagged.

    Returns:
        Updated ``AgentMemory`` instance (also persisted to disk).
    """
    memory = load_agent_memory(upload_id)
    entry = CoachingMemoryEntry(
        timestamp=datetime.now().isoformat(timespec="seconds"),
        status=status,
        nudge=nudge,
        suggested_cap=suggested_cap,
        top_category=top_category,
        confidence_score=confidence_score,
        anomaly_detected=anomaly_detected,
        repeat_pattern_detected=repeat_pattern_detected,
    )
    memory.entries.append(entry)
    memory.total_nudges_issued += 1
    save_agent_memory(memory)
    return memory


def record_feedback(upload_id: str, accepted: bool) -> AgentMemory:
    """Record user feedback (accepted/dismissed) on the most recent nudge.

    Updates the last memory entry's ``user_accepted`` flag and increments
    the appropriate aggregate counter.

    Args:
        upload_id: Session identifier.
        accepted: True if the user accepted the nudge, False if dismissed.

    Returns:
        Updated ``AgentMemory`` instance (also persisted to disk).
    """
    memory = load_agent_memory(upload_id)
    if memory.entries:
        memory.entries[-1].user_accepted = accepted
        if accepted:
            memory.total_accepted += 1
        else:
            memory.total_dismissed += 1
    save_agent_memory(memory)
    return memory


def build_memory_context(upload_id: str) -> dict[str, Any]:
    """Build the ``memory_context`` dict for injection into the LangGraph pipeline.

    This dict is consumed by the ``context_injection`` node to adjust coaching
    thresholds and tone based on the user's history.

    Args:
        upload_id: Session identifier.

    Returns:
        Dict with keys: ``has_history``, ``session_count``, ``acceptance_rate``,
        ``is_escalating``, ``dominant_category``, ``recent_statuses``,
        ``tone_adjustment``, ``threshold_modifier``.
    """
    memory = load_agent_memory(upload_id)

    if not memory.entries:
        return {
            "has_history": False,
            "session_count": 0,
            "acceptance_rate": 0.5,
            "is_escalating": False,
            "dominant_category": "",
            "recent_statuses": [],
            "tone_adjustment": "neutral",
            "threshold_modifier": 1.0,
        }

    acceptance = memory.acceptance_rate()
    escalating = memory.is_escalating()

    # Tone adjustment: if user keeps dismissing, be less aggressive
    # If user accepts, maintain or intensify nudges
    if acceptance < 0.3:
        tone = "softer"
        threshold_mod = 1.15  # Raise thresholds slightly (less sensitive)
    elif acceptance > 0.7:
        tone = "direct"
        threshold_mod = 0.90  # Lower thresholds (more proactive)
    else:
        tone = "neutral"
        threshold_mod = 1.0

    # If situation is escalating despite coaching, intensify
    if escalating:
        tone = "urgent"
        threshold_mod = 0.85

    return {
        "has_history": True,
        "session_count": len(memory.entries),
        "acceptance_rate": round(acceptance, 3),
        "is_escalating": escalating,
        "dominant_category": memory.dominant_category,
        "recent_statuses": memory.recent_statuses(),
        "tone_adjustment": tone,
        "threshold_modifier": round(threshold_mod, 3),
    }
