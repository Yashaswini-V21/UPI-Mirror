from __future__ import annotations

import asyncio
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass
from typing import Any

from core_logic.coach_agent import SpendingCoachResult


@dataclass(slots=True)
class LightningTraceResult:
    enabled: bool
    message: str
    reward: float = 0.0
    reward_source: str = "heuristic"
    reward_history_count: int = 0
    reward_history_mean: float = 0.0
    span_count: int = 0
    rollout_id: str | None = None
    attempt_id: str | None = None


def agentlightning_is_available() -> bool:
    try:
        import agentlightning  # noqa: F401

        return True
    except ImportError:
        return False


async def _record_trace_async(
    coach_result: SpendingCoachResult,
    reward_override: float | None = None,
    reward_source: str = "heuristic",
    reward_history: list[float] | None = None,
) -> LightningTraceResult:
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
        final_reward = float(reward_override) if reward_override is not None else float(coach_result.reward_signal)
        history = reward_history or []
        history_mean = (sum(history) / len(history)) if history else 0.0
        rollout_input = {
            **coach_result.as_dict(),
            "reward_source": reward_source,
            "reward_history_count": len(history),
            "reward_history_mean": round(history_mean, 3),
        }
        rollout = await store.start_rollout(input=rollout_input)

        with tracer.lifespan(store):
            async with tracer.trace_context(
                "kira_ai_spending_coach",
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

                emit_reward(final_reward)

        spans = await store.query_spans(rollout_id=rollout.rollout_id)
        return LightningTraceResult(
            enabled=True,
            message="Agent Lightning trace captured for the latest coach run.",
            reward=final_reward,
            reward_source=reward_source,
            reward_history_count=len(history),
            reward_history_mean=history_mean,
            span_count=len(spans),
            rollout_id=rollout.rollout_id,
            attempt_id=rollout.attempt.attempt_id,
        )
    except Exception as exc:
        return LightningTraceResult(
            enabled=False,
            message=f"Agent Lightning trace capture failed: {exc}",
        )


def record_coach_trace(
    coach_result: SpendingCoachResult,
    reward_override: float | None = None,
    reward_source: str = "heuristic",
    reward_history: list[float] | None = None,
) -> LightningTraceResult:
    coroutine = _record_trace_async(
        coach_result,
        reward_override=reward_override,
        reward_source=reward_source,
        reward_history=reward_history,
    )
    try:
        asyncio.get_running_loop()
    except RuntimeError:
        return asyncio.run(coroutine)

    with ThreadPoolExecutor(max_workers=1) as executor:
        future = executor.submit(
            lambda: asyncio.run(
                _record_trace_async(
                    coach_result,
                    reward_override=reward_override,
                    reward_source=reward_source,
                    reward_history=reward_history,
                )
            )
        )
        return future.result()