from __future__ import annotations

import asyncio
from dataclasses import dataclass
from typing import Any

from src.coach_agent import SpendingCoachResult


@dataclass(slots=True)
class LightningTraceResult:
    enabled: bool
    message: str
    reward: float = 0.0
    span_count: int = 0
    rollout_id: str | None = None
    attempt_id: str | None = None


def agentlightning_is_available() -> bool:
    try:
        import agentlightning  # noqa: F401

        return True
    except ImportError:
        return False


async def _record_trace_async(coach_result: SpendingCoachResult) -> LightningTraceResult:
    try:
        from agentlightning import InMemoryLightningStore, OtelTracer, emit_reward
    except ImportError:
        return LightningTraceResult(
            enabled=False,
            message="Agent Lightning is not installed. Install requirements and rerun to capture traces.",
        )

    try:
        tracer = OtelTracer()
        store = InMemoryLightningStore()
        rollout = await store.start_rollout(input=coach_result.as_dict())

        with tracer.lifespan(store):
            async with tracer.trace_context(
                "upi_mirror_spending_coach",
                store=store,
                rollout_id=rollout.rollout_id,
                attempt_id=rollout.attempt.attempt_id,
            ) as otel_tracer:
                with otel_tracer.start_as_current_span("detect_anomaly"):
                    pass

                if coach_result.anomaly_detected:
                    with otel_tracer.start_as_current_span("repeat_pattern_check"):
                        pass

                with otel_tracer.start_as_current_span("generate_narrative"):
                    pass

                with otel_tracer.start_as_current_span("personalised_nudge"):
                    pass

                with otel_tracer.start_as_current_span("suggest_limit"):
                    pass

                emit_reward(coach_result.reward_signal)

        spans = await store.query_spans(rollout_id=rollout.rollout_id)
        return LightningTraceResult(
            enabled=True,
            message="Agent Lightning trace captured for the latest coach run.",
            reward=coach_result.reward_signal,
            span_count=len(spans),
            rollout_id=rollout.rollout_id,
            attempt_id=rollout.attempt.attempt_id,
        )
    except Exception as exc:
        return LightningTraceResult(
            enabled=False,
            message=f"Agent Lightning trace capture failed: {exc}",
        )


def record_coach_trace(coach_result: SpendingCoachResult) -> LightningTraceResult:
    return asyncio.run(_record_trace_async(coach_result))