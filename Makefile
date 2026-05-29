.PHONY: install run-api run-web run-all test test-api test-unit lint lint-fix audit clean verify help

# ────────────────────────────────────────────────────────────────────────────────
# Kira-AI Developer Makefile
# ────────────────────────────────────────────────────────────────────────────────

help:
	@echo "Kira-AI Developer Commands"
	@echo ""
	@echo "Setup:"
	@echo "  make install          Install all Python dependencies"
	@echo "  make verify           Verify all critical packages are importable"
	@echo ""
	@echo "Running:"
	@echo "  make run-api          Start FastAPI backend  (http://localhost:8000)"
	@echo "  make run-web          Start React frontend   (http://localhost:5173)"
	@echo "  make run-all          Start both (background)"
	@echo ""
	@echo "Testing & Quality:"
	@echo "  make test             Run all tests with coverage"
	@echo "  make test-api         Run API integration tests only"
	@echo "  make test-unit        Run coach agent unit tests only"
	@echo "  make lint             Run black (check), flake8, mypy"
	@echo "  make lint-fix         Auto-format with black"
	@echo "  make audit            Security audit (pip-audit, bandit)"
	@echo ""
	@echo "Maintenance:"
	@echo "  make clean            Remove __pycache__, .pytest_cache, .mypy_cache"
	@echo ""

# ────────────────────────────────────────────────────────────────
# Setup
# ────────────────────────────────────────────────────────────────

install:
	pip install -r requirements.txt

verify:
	python -c "import fastapi, google.generativeai, langgraph, pandas, pydantic; print('✓ All critical packages installed')"

# ────────────────────────────────────────────────────────────────
# Running
# ────────────────────────────────────────────────────────────────

run-api:
	uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload

run-web:
	cd web && npm run dev

run-all:
	@echo "Starting API and frontend..."
	@echo "API:      http://localhost:8000"
	@echo "Frontend: http://localhost:5173"
	@echo ""
	@echo "Press Ctrl+C to stop"
	@echo ""
	@(trap 'kill %1 %2' EXIT; make run-api & make run-web)

# ────────────────────────────────────────────────────────────────
# Testing
# ────────────────────────────────────────────────────────────────

test:
	pytest tests/ -v --cov=src --cov=api --cov-report=term-missing --cov-report=html

test-api:
	pytest tests/test_api.py -v --tb=short

test-unit:
	pytest tests/test_coach_agent_unit.py -v --tb=short

# ────────────────────────────────────────────────────────────────
# Code Quality
# ────────────────────────────────────────────────────────────────

lint:
	@echo "Running black..."
	black . --check --diff
	@echo ""
	@echo "Running flake8..."
	flake8 src api tests --max-line-length=100 --extend-ignore=E203,W503
	@echo ""
	@echo "Running mypy..."
	mypy src api --ignore-missing-imports
	@echo ""
	@echo "✓ All linters passed"

lint-fix:
	black . --line-length=100
	@echo "✓ Code formatted with black"

# ────────────────────────────────────────────────────────────────
# Security
# ────────────────────────────────────────────────────────────────

audit:
	@echo "Running pip-audit..."
	pip-audit --desc
	@echo ""
	@echo "Running bandit on src/ and api/..."
	bandit -r src api --severity-level medium
	@echo ""
	@echo "✓ Security audit complete"

# ────────────────────────────────────────────────────────────────
# Maintenance
# ────────────────────────────────────────────────────────────────

clean:
	find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name .pytest_cache -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name .mypy_cache -exec rm -rf {} + 2>/dev/null || true
	find . -name "*.pyc" -delete
	find . -name ".DS_Store" -delete
	@echo "✓ Cleaned up cache and temp files"

.DEFAULT_GOAL := help
