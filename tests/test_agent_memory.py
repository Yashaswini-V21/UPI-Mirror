"""tests/test_agent_memory.py
============================
Unit tests for the Kira-AI multi-turn agent memory system.
"""

from __future__ import annotations

import json
import tempfile
from pathlib import Path
from unittest.mock import patch

import pytest

from core_logic.agent_memory import (
    AgentMemory,
    CoachingMemoryEntry,
    build_memory_context,
    load_agent_memory,
    record_coaching_result,
    record_feedback,
    save_agent_memory,
    _MEMORY_DIR,
)


@pytest.fixture(autouse=True)
def temp_memory_dir(tmp_path):
    """Redirect memory storage to a temp directory for test isolation."""
    with patch("core_logic.agent_memory._MEMORY_DIR", tmp_path):
        yield tmp_path


class TestAgentMemoryPersistence:
    """Test save/load cycle for agent memory."""

    def test_load_empty_memory(self):
        memory = load_agent_memory("test_upload_001")
        assert memory.upload_id == "test_upload_001"
        assert memory.entries == []
        assert memory.total_nudges_issued == 0

    def test_save_and_load_roundtrip(self, temp_memory_dir):
        memory = AgentMemory(upload_id="test_002")
        entry = CoachingMemoryEntry(
            timestamp="2026-06-15T10:00:00",
            status="watch",
            nudge="Cut Food to ₹2000",
            suggested_cap=2000.0,
            top_category="Food",
            confidence_score=0.85,
            anomaly_detected=True,
            repeat_pattern_detected=False,
            user_accepted=True,
        )
        memory.entries.append(entry)
        memory.total_nudges_issued = 1
        memory.total_accepted = 1

        save_agent_memory(memory)
        loaded = load_agent_memory("test_002")

        assert loaded.upload_id == "test_002"
        assert len(loaded.entries) == 1
        assert loaded.entries[0].status == "watch"
        assert loaded.entries[0].user_accepted is True
        assert loaded.total_nudges_issued == 1

    def test_max_entries_cap(self, temp_memory_dir):
        memory = AgentMemory(upload_id="test_003")
        for i in range(15):
            memory.entries.append(CoachingMemoryEntry(
                timestamp=f"2026-06-{i+1:02d}T10:00:00",
                status="watch",
                nudge=f"Nudge {i}",
                suggested_cap=1000.0 + i * 100,
                top_category="Food",
                confidence_score=0.7,
                anomaly_detected=False,
                repeat_pattern_detected=False,
            ))

        save_agent_memory(memory)
        loaded = load_agent_memory("test_003")

        assert len(loaded.entries) <= 10, "Should cap at _MAX_MEMORY_ENTRIES (10)"

    def test_load_corrupted_file(self, temp_memory_dir):
        path = temp_memory_dir / "test_004_agent_memory.json"
        path.write_text("not valid json {{{", encoding="utf-8")

        memory = load_agent_memory("test_004")
        assert memory.upload_id == "test_004"
        assert memory.entries == []


class TestRecordOperations:
    """Test the record_coaching_result and record_feedback helpers."""

    def test_record_coaching_result(self):
        memory = record_coaching_result(
            upload_id="rec_001",
            status="critical",
            nudge="Freeze Swiggy at ₹500",
            suggested_cap=500.0,
            top_category="Food",
            confidence_score=0.92,
            anomaly_detected=True,
            repeat_pattern_detected=True,
        )
        assert len(memory.entries) == 1
        assert memory.entries[0].status == "critical"
        assert memory.total_nudges_issued == 1

    def test_record_feedback_accepted(self):
        record_coaching_result(
            upload_id="fb_001",
            status="watch",
            nudge="Cut Transit",
            suggested_cap=3000.0,
            top_category="Transit",
            confidence_score=0.75,
            anomaly_detected=False,
            repeat_pattern_detected=False,
        )
        memory = record_feedback("fb_001", accepted=True)

        assert memory.entries[-1].user_accepted is True
        assert memory.total_accepted == 1

    def test_record_feedback_dismissed(self):
        record_coaching_result(
            upload_id="fb_002",
            status="stable",
            nudge="Hold Shopping",
            suggested_cap=5000.0,
            top_category="Shopping",
            confidence_score=0.6,
            anomaly_detected=False,
            repeat_pattern_detected=False,
        )
        memory = record_feedback("fb_002", accepted=False)

        assert memory.entries[-1].user_accepted is False
        assert memory.total_dismissed == 1


class TestAgentMemoryAnalytics:
    """Test analytical methods on AgentMemory."""

    def test_acceptance_rate_neutral(self):
        memory = AgentMemory(upload_id="ar_001")
        assert memory.acceptance_rate() == 0.5  # Neutral prior

    def test_acceptance_rate_calculation(self):
        memory = AgentMemory(
            upload_id="ar_002",
            total_accepted=7,
            total_dismissed=3,
        )
        assert memory.acceptance_rate() == 0.7

    def test_recent_statuses(self):
        memory = AgentMemory(upload_id="rs_001")
        for status in ["stable", "watch", "critical", "watch"]:
            memory.entries.append(CoachingMemoryEntry(
                timestamp="2026-06-15T10:00:00",
                status=status,
                nudge="test",
                suggested_cap=1000.0,
                top_category="Food",
                confidence_score=0.7,
                anomaly_detected=False,
                repeat_pattern_detected=False,
            ))
        assert memory.recent_statuses(3) == ["watch", "critical", "watch"]  # Last 3

    def test_is_escalating_true(self):
        memory = AgentMemory(upload_id="esc_001")
        for status in ["stable", "watch", "critical"]:
            memory.entries.append(CoachingMemoryEntry(
                timestamp="2026-06-15T10:00:00",
                status=status,
                nudge="test",
                suggested_cap=1000.0,
                top_category="Food",
                confidence_score=0.7,
                anomaly_detected=False,
                repeat_pattern_detected=False,
            ))
        assert memory.is_escalating() is True

    def test_is_escalating_false(self):
        memory = AgentMemory(upload_id="esc_002")
        for status in ["critical", "watch", "stable"]:
            memory.entries.append(CoachingMemoryEntry(
                timestamp="2026-06-15T10:00:00",
                status=status,
                nudge="test",
                suggested_cap=1000.0,
                top_category="Food",
                confidence_score=0.7,
                anomaly_detected=False,
                repeat_pattern_detected=False,
            ))
        assert memory.is_escalating() is False


class TestBuildMemoryContext:
    """Test the pipeline-injection context builder."""

    def test_empty_history(self):
        ctx = build_memory_context("no_history_001")
        assert ctx["has_history"] is False
        assert ctx["tone_adjustment"] == "neutral"
        assert ctx["threshold_modifier"] == 1.0

    def test_high_acceptance_direct_tone(self):
        for _ in range(5):
            record_coaching_result(
                upload_id="ctx_001",
                status="watch",
                nudge="test",
                suggested_cap=1000.0,
                top_category="Food",
                confidence_score=0.7,
                anomaly_detected=False,
                repeat_pattern_detected=False,
            )
            record_feedback("ctx_001", accepted=True)

        ctx = build_memory_context("ctx_001")
        assert ctx["has_history"] is True
        assert ctx["tone_adjustment"] == "direct"
        assert ctx["threshold_modifier"] < 1.0  # More proactive

    def test_low_acceptance_softer_tone(self):
        for _ in range(5):
            record_coaching_result(
                upload_id="ctx_002",
                status="watch",
                nudge="test",
                suggested_cap=1000.0,
                top_category="Food",
                confidence_score=0.7,
                anomaly_detected=False,
                repeat_pattern_detected=False,
            )
            record_feedback("ctx_002", accepted=False)

        ctx = build_memory_context("ctx_002")
        assert ctx["tone_adjustment"] == "softer"
        assert ctx["threshold_modifier"] > 1.0  # Less sensitive
