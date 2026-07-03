# ADR-001: LangGraph Pipeline Architecture

## Status
Accepted

## Context
Kira-AI requires an agentic pipeline that can orchestrate multiple analytical and decision-making steps into a coherent coaching recommendation. The system must:

1. Process spending data through sequential analysis stages
2. Maintain state across nodes without destructive overwrites
3. Support future extensibility (new nodes, conditional branching)
4. Provide deterministic fallback when the LangGraph dependency is absent
5. Be thread-safe for concurrent API requests

## Decision
We chose **LangGraph's StateGraph** with a merge-safe, linear 6-node topology:

```
START → context_injection → anomaly_check → pattern_analysis
      → nudge_generation → cap_recommendation → confidence_scoring → END
```

### Key design choices:

1. **Merge-safe state propagation**: Each node returns only the keys it writes. This makes state propagation additive rather than destructive — downstream nodes never accidentally overwrite upstream results.

2. **Linear topology over conditional branching**: Although LangGraph supports conditional edges, we chose a fixed linear flow for v3.1. Every node always executes, but nodes can produce neutral outputs when their preconditions aren't met. This simplifies debugging and ensures complete signal coverage.

3. **Fallback coach**: When `langgraph` is not installed, a `_FallbackCoach` class executes the same nodes sequentially using plain Python. This ensures the coaching pipeline works without the dependency.

4. **Graph compilation at import time**: The graph is compiled once via `_build_coach()` at module level and reused for all requests, protected by `_COACH_GRAPH_LOCK` (RLock) for thread safety.

5. **Named constants over magic numbers**: All thresholds (e.g., `CRITICAL_HABIT_THRESHOLD = 0.75`) are module-level constants for readability and testability.

## Consequences

### Positive
- **Extensibility**: Adding new nodes (like `context_injection` in v3.1) requires only adding the node function and two graph edges.
- **Testability**: Each node can be unit-tested independently with a mock `CoachState`.
- **Observability**: The pipeline's linear structure makes it straightforward to visualize in the frontend's `AgentPipelineVisualizer`.

### Negative
- **Linear-only for now**: Conditional branching (e.g., skip narrative generation for stable users) is deferred to v4.0.
- **Thread lock**: The `_COACH_GRAPH_LOCK` could become a bottleneck under very high concurrency, though the current single-worker deployment makes this unlikely.

## References
- [LangGraph documentation](https://langchain-ai.github.io/langgraph/)
- `src/coach_agent.py` — Pipeline implementation
- `tests/test_coach_agent_unit.py` — Node-level unit tests
- `tests/test_full_pipeline.py` — Integration tests
