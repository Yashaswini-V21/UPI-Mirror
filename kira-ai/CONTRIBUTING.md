# Contributing to Kira-AI

Thank you for your interest in contributing! This guide covers everything you need to get started.

---

## Development Setup

### 1. Fork and clone

```bash
git clone https://github.com/Yashaswini-V21/Kira-AI.git
cd Kira-AI
```

### 2. Create a virtual environment

```bash
python -m venv .venv
source .venv/bin/activate      # macOS / Linux
.venv\Scripts\activate         # Windows
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure environment

```bash
cp .env.example .env
# Set KIRA_AI_API_KEY and GEMINI_API_KEY at minimum
```

---

## Branch Naming

| Type | Pattern | Example |
|---|---|---|
| Feature | `feat/<short-description>` | `feat/scenario-simulator` |
| Bug fix | `fix/<issue-or-description>` | `fix/narrative-cache-key` |
| Docs | `docs/<description>` | `docs/api-reference` |
| Refactor | `refactor/<description>` | `refactor/coach-state-init` |
| Tests | `test/<description>` | `test/analytics-coverage` |

---

## Coding Standards

### Python

- **Line length**: 100 characters (enforced by `black`).
- **Docstrings**: All public functions must have a docstring with `Args:` and `Returns:` sections (Google style).
- **Module docstrings**: Every module must start with a docstring describing its purpose and public API.
- **Constants**: No magic numbers. All thresholds and factors must be named constants at module level with type annotations.
- **Type hints**: All function signatures must be fully type-annotated.
- **Imports**: `from __future__ import annotations` at the top of every module.

### LangGraph Pipeline & State Rules

- **Linear Topology**: The pipeline executes linearly. When adding a new node, register it in `_build_coach()` inside `src/coach_agent.py`.
- **Merge-Safe Updates**: Nodes must only return the specific keys they write. Never return a full dictionary that overwrites unrelated state keys.
- **Agent Memory**: Always load memory context via `src/agent_memory.py` prior to compiling the graph invocation to maintain multi-turn context.

### De-identification & PII Rules

- **Zero Exposure**: Raw identifiers (bank account numbers, UPI IDs, raw merchant details) must never be passed to backend logger, prometheus metrics, or persistent files.
- **Client-Side First**: De-identification must happen client-side before upload payload generation. The backend functions act as second-tier validators.

### Directory conventions

| Directory | Purpose |
|---|---|
| `src/` | Core business logic. Zero FastAPI imports. |
| `api/` | Routing, middleware, request/response schemas. |
| `tests/` | All test files. Match `test_<module>.py`. |

### Example well-documented function

```python
def compute_addiction_scores(transactions: pd.DataFrame) -> pd.DataFrame:
    """Compute a 0–100 addiction/habit intensity score for each spending category.

    Scores are derived from four signals over a 30-day lookback window:
      - **Frequency** (35 pts): Transaction count relative to most frequent category.
      - **Consistency** (20 pts): Number of distinct weeks the category appeared.
      - **Spend volume** (20 pts): Total spend relative to highest-spend category.
      - **Late-night share** (15 pts): Fraction of transactions made between 22:00–23:59.
      - **Spend trend** (5 pts): Recent-14-day growth vs. previous-14-day baseline.

    Args:
        transactions: Full transaction DataFrame.

    Returns:
        DataFrame sorted by score descending with columns:
        ``category``, ``score``, ``late_night_share``, ``weekly_consistency``, ``trend``.
    """
```

---

## Testing

All new functionality must have test coverage.

```bash
# Run full test suite
make test

# Run only API tests
make test-api

# Run only unit tests
make test-unit
```

Test files must be placed in `tests/` and follow the naming convention `test_<module_name>.py`.

---

## Code Quality Checks

Run these before opening a pull request:

```bash
make lint       # black (check), flake8, mypy
make audit      # pip-audit + bandit
```

To auto-fix formatting:

```bash
make lint-fix   # Applies black formatting
```

---

## Pull Request Process

1. Create a feature branch from `main`.
2. Write tests for all changes.
3. Run `make lint` and `make test` — both must pass with zero errors.
4. Open a PR with:
   - A clear title (e.g. `feat: add spend projection chart endpoint`).
   - A description of what changed and why.
   - Reference to any related issues.
5. A maintainer will review within 48 hours.

---

## Commit Message Format

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add late-night merchant trend chart
fix: prevent narrative cache collision on same budget bucket
docs: add Args/Returns to compute_addiction_scores
test: add coach node unit tests for critical status
refactor: extract _derive_repeat_pattern from run_spending_coach_agent
```

---

## Security Disclosures

Please **do not** open a public issue for security vulnerabilities. Instead, email the maintainers directly. We will acknowledge within 24 hours and aim to patch within 7 days.

---

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
