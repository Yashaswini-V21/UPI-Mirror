# Changelog

All notable changes to the Kira-AI project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [3.1.0] - 2026-07-03

### Added
- **Multi-Turn Agent Memory** (`src/agent_memory.py`): Coaching pipeline now persists and recalls prior session interactions, enabling adaptive tone and threshold adjustments based on user feedback history.
- **6th LangGraph Node — `context_injection`**: New pipeline entry node that loads session memory and injects adaptive coaching parameters before anomaly analysis begins.
- **Smart Categorizer** (`src/smart_categorizer.py`): Gemini 2.0-powered merchant classification engine with regex fallback. Automatically categorizes unknown merchants into Kira's 12-category taxonomy.
- **Agent Pipeline Visualizer** (`web/src/components/tabs/AgentPipelineVisualizer.tsx`): Animated React component that displays the 6-node LangGraph pipeline executing in real-time during coach loading, with node-by-node status, descriptions, and scanning effects.
- **Full Pipeline Integration Test** (`tests/test_full_pipeline.py`): End-to-end test covering CSV fixture → analytics → LangGraph pipeline → narrative → response with realistic Indian UPI transaction data.
- **Agent Memory Tests** (`tests/test_agent_memory.py`): Comprehensive unit tests for memory persistence, feedback recording, analytics, and context building.

### Changed
- **Gemini Model Upgrade**: Default LLM model upgraded from `gemini-1.5-flash` to `gemini-2.0-flash` for improved instruction following and narrative quality.
- **CoachTab Loading State**: Replaced generic skeleton loading with the animated Agent Pipeline Visualizer, showing users exactly which agent node is processing.
- **Pipeline Topology**: Expanded from 5-node to 6-node linear pipeline (`context_injection → anomaly_check → pattern_analysis → nudge_generation → cap_recommendation → confidence_scoring`).
- **Version Bump**: Project version bumped to `3.1.0` across `pyproject.toml` and `package.json`.

### Improved
- **README**: Updated documentation to reflect 6-node pipeline, new modules, Gemini 2.0, and expanded repository structure.
- **CoachState TypedDict**: Extended with `memory_context`, `tone_adjustment`, `threshold_modifier`, and `session_count` fields for multi-turn awareness.

---

## [3.0.0] - 2026-06-15

### Added
- Interactive Cyber Command Center Cockpit (split-screen hero experience)
- WASM Sandbox Privacy Core Dock with tabbed ingestion bays (PDF, CSV, SMS)
- De-identification Depth Slider (real-time client-side scrubbing)
- CommandCenterDeck with HUD target rings and security sweep
- Client-Side UPI Decoder Sandbox (`DecoderSandbox`)
- Digg-Style Architecture Newsfeed (`HowItWorks` component)
- Blurred Empty-State Coach Console with demo session loader
- NudgePlayground interactive coaching simulator
- Framer Motion animations throughout the landing experience
- Magnetic buttons and SpotlightCard primitives
- Starfield background effect with parallax scrolling
- SplashScreen with cinematic entrance animation

### Infrastructure
- GitHub Actions CI/CD (backend tests, frontend checks, security scan)
- GitLab CI/CD with 5-stage pipeline (test, lint, security, build, deploy)
- Docker containerization with production Dockerfile
- Vercel and Render deployment manifests
- Prometheus observability metrics endpoint
- Structured JSON logging with structlog

---

## [2.0.0] - 2026-05-01

### Added
- LangGraph 5-node coaching pipeline
- Gemini 1.5 narrative generation with circuit breaker
- FastAPI backend with OWASP security headers
- React + Vite + TypeScript frontend
- Zustand state management with session persistence
- IQR-based weekly anomaly detection
- Linear regression broke-date prediction
- Addiction scoring per spending category
- What-if scenario simulator
- WhatsApp and email delivery integrations
- Data governance with PII masking and retention sweeps
- Immutable audit logging

---

## [1.0.0] - 2026-04-01

### Added
- Initial project scaffold
- Basic CSV parsing and transaction analysis
- Simple spending categorization
- Template-based coaching narratives
