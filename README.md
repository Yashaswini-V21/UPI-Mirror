<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:1f3a8a,30:0ea5e9,60:06b6d4,100:10b981&height=190&section=header&text=UPI%20Mirror&fontSize=54&fontColor=ffffff&animation=fadeIn&fontAlignY=35&desc=Predictive%20Behavioral%20Finance%20from%20UPI%20Data&descAlignY=58&descSize=18" width="100%" alt="UPI Mirror Banner"/>

[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white)](#tech-stack)
[![Streamlit](https://img.shields.io/badge/Streamlit-Dashboard-FF4B4B?style=for-the-badge&logo=streamlit&logoColor=white)](#quickstart)
[![LangGraph](https://img.shields.io/badge/LangGraph-Coach%20Workflow-111827?style=for-the-badge)](#system-architecture)
[![Agent%20Lightning](https://img.shields.io/badge/Agent%20Lightning-Reward%20Tracing-2563eb?style=for-the-badge)](#tests-and-evaluation)
[![License](https://img.shields.io/badge/License-MIT-10b981?style=for-the-badge)](#license)

<strong>UPI Mirror turns transaction history into risk forecasting, behavior diagnosis, and daily intervention.</strong>

If this project helps you,  star the repository.

</div>

## Contents

- [1) Product Snapshot](#1-product-snapshot)
- [2) Why It Is Different](#2-why-it-is-different)
- [3) System Architecture](#3-system-architecture)
- [4) End-to-End Data Flow](#4-end-to-end-data-flow)
- [5) Core Modules](#5-core-modules)
- [6) Quickstart](#6-quickstart)
- [7) Configuration](#7-configuration)
- [8) Testing and Evaluation](#8-testing-and-evaluation)
- [9) Demo Assets](#9-demo-assets)
- [10) Tech Stack](#10-tech-stack)
- [11) Roadmap](#11-roadmap)
- [12) Repository Layout](#12-repository-layout)
- [13) License](#13-license)

## 1) Product Snapshot

UPI Mirror focuses on pre-failure behavioral detection.

- Input: UPI CSV or deterministic demo data
- Output: forecast, anomaly, regret, merchant, and coach intelligence
- Action Layer: daily nudge + suggested cap + delivery links
- Learning Signal: accept or dismiss nudge feedback as reward
- Traceability: reward-aware agent trace capture for later optimization



## 2) Why It Is Different

Most tools answer only "what happened".
UPI Mirror answers "what is likely next" and "what should be done now".

| Capability | Typical Expense Tracker | UPI Mirror |
|---|---|---|
| Forecasting | historical totals | broke-date and projected month-end |
| Behavioral Layer | category split | habit intensity + anomaly routing + regret context |
| Intervention | none | daily nudge + weekly cap recommendation |
| Learning Loop | no user signal | accepted/dismissed feedback to reward |
| Actionability | passive dashboard | WhatsApp/email delivery drafts |

## 3) System Architecture

This view shows how data, analytics, agent logic, and UI are connected.

```mermaid
flowchart LR
    A[UPI CSV or Demo Data] --> B[src/data.py]

    subgraph Analytics
      C[src/analytics.py]
      D[src/regret.py]
      E[src/merchant.py]
      F[src/insights.py]
    end

    subgraph Agent
      G[src/coach_agent.py]
      H[src/narrative.py]
      I[src/coach_memory.py]
      J[src/lightning.py]
      K[src/delivery.py]
    end

    B --> C
    B --> D
    B --> E
    C --> G
    D --> G
    E --> G
    G --> H
    G --> I
    G --> J
    G --> K
    C --> F

    L[app.py + src/ui.py] --> M[Streamlit Dashboard]
    H --> L
    I --> L
    J --> L
    K --> L
    F --> L
```

### Architecture Alignment (Layered View)

| Layer | Responsibility | Primary Files | Output |
|---|---|---|---|
| Data Input | Accept user CSV or demo stream | app.py, src/data.py | Clean transaction frame |
| Behavioral Analytics | Compute spend risk and behavior signals | src/analytics.py, src/regret.py, src/merchant.py | Forecast, anomaly, regret, merchant features |
| Decision Agent | Convert signals into intervention actions | src/coach_agent.py, src/narrative.py | Status, narrative, nudge, cap |
| Memory and Learning | Persist state and reward loops | src/coach_memory.py, src/lightning.py | Snapshot history, reward-aware traces |
| Action Delivery | Move insight into user channels | src/delivery.py, src/insights.py | WhatsApp/email drafts, summary exports |
| Experience Layer | Render full product in UI | app.py, src/ui.py | Multi-tab interactive dashboard |

### Component Contract Alignment

| Upstream | Contract | Downstream |
|---|---|---|
| src/data.py | normalized schema with datetime, amount, category, merchant, optional regret | analytics + regret + merchant modules |
| analytics + regret + merchant | feature bundle for risk and behavior context | coach_agent |
| coach_agent | intervention state (status, nudge, suggested cap, reward signal) | memory, delivery, streamlit presentation |
| coach_memory + user feedback | time-scoped user response history | lightning trace capture |
| lightning | reward-tagged trace metadata | optimization and evaluation workflows |

## 4) End-to-End Data Flow

This sequence shows how one upload becomes intervention-ready output.

```mermaid
flowchart TD
    U[Upload CSV] --> V[Validate and normalize]
    V --> W[Compute forecast + addiction + anomaly + regret + merchant signals]
    W --> X[Run coach workflow: anomaly -> pattern -> nudge -> limit]
    X --> Y[Generate narrative]
    X --> Z[Store dataset-scoped snapshot]
    X --> A1[Capture feedback as reward]
    X --> A2[Build WhatsApp/email draft links]
    A1 --> A3[Use reward in trace capture when available]
    Y --> A4[Render in dashboard]
    Z --> A4
    A2 --> A4
    A3 --> A4
```

## 5) Core Modules

Each module has one clear role in the overall product loop.

| Module | Role | Primary Value |
|---|---|---|
| Broke Date Predictor | projects month-end risk | prevents late-month surprises |
| Habit Scoring | category behavior intensity | detects repeat over-spend loops |
| Weekly Anomalies | week-level spike detection | flags early drift |
| Regret Analytics | regret by category/time/amount | adds behavioral meaning |
| Merchant Intelligence | late-night and regret-linked merchant view | reveals leakage sources |
| Coach Agent | anomaly -> pattern -> nudge -> cap workflow | daily intervention guidance |
| Memory Layer | upload-scoped snapshots | prevents cross-session contamination |
| Reward Layer | feedback to reward signal | real human learning input |
| Delivery Layer | prefilled WhatsApp/email drafts | moves action outside dashboard |
| Insight Layer | shareable cards and exports | portfolio and reporting ready |

## Additional Highlights

- Local-first operation with optional AI enhancement
- Real feedback loop instead of one-way recommendation engine
- Strong separation of analytics, agent, delivery, and UI concerns
- Unit test coverage for core coaching logic and fallback paths

## 6) Quickstart

Get running in three simple steps.

1. Setup environment

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

2. Run dashboard

```bash
streamlit run app.py
```

3. Run tests

```bash
pytest -q
```

## 7) Configuration

Use these optional settings only when needed.

Optional environment variables:

```bash
set GROQ_API_KEY=your_key_here
set COACH_EMAIL_TO=you@example.com
set COACH_WHATSAPP_NUMBER=919XXXXXXXXX
set COACH_MEMORY_DIR=.coach_memory
set COACH_MEMORY_PATH=
```

Notes:

- If GROQ_API_KEY is missing, narrative generation uses deterministic fallback.
- Default memory mode isolates snapshots using upload-scoped keys.

## 8) Testing and Evaluation

Run tests before every PR to keep behavior stable.

Unit coverage includes:

- anomaly routing behavior
- anomaly status transitions
- limit suggestion logic
- reward scoring behavior
- narrative fallback path when Groq is not configured

Run:

```bash
pytest -q
```

## 9) Demo Assets

Use these files for consistent portfolio and product demos.

- docs/DEMO_WALKTHROUGH.md
- docs/screenshots/README.md

Suggested screenshot pack:

- dashboard-overview
- coach-agent-tab
- regret-insights-tab
- merchant-insights-tab
- delivery-links

## About the Project

UPI Mirror is built as a practical behavioral finance product, not a static chart dashboard.
It combines forecasting, behavioral diagnostics, intervention design, and user feedback loops so outputs are actionable, measurable, and demo-ready.

## 10) Tech Stack

This stack is chosen for speed, clarity, and practical delivery.

- Python 3.11+
- Streamlit
- Pandas
- NumPy
- scikit-learn
- Plotly
- LangGraph
- langchain-groq
- Agent Lightning
- pytest

### Tech Stack Alignment by Layer

| Layer | Tools | Why This Fit |
|---|---|---|
| Interface | Streamlit, Plotly | Fast interactive product surface with rich charting |
| Data Processing | Pandas, NumPy | Reliable tabular transformation and vectorized computation |
| Modeling | scikit-learn | Stable regression baseline for broke-date projection |
| Agent Orchestration | LangGraph | Explicit stateful graph for deterministic coach routing |
| Narrative Provider | langchain-groq (optional) | Low-friction LLM integration with fallback safety |
| Learning and Tracing | Agent Lightning | Reward-aware observability for intervention loops |
| Quality | pytest | Lightweight, repeatable verification for core logic |

### Runtime Alignment

| Concern | Current Choice | Rationale |
|---|---|---|
| Local Dev | Python venv + Streamlit run | Simple onboarding and reproducible setup |
| Optional AI Mode | GROQ_API_KEY gate | Predictable fallback when key is absent |
| Memory Isolation | upload-scoped keying | Prevents cross-dataset contamination |
| Delivery Channel | deep-link drafts first | Zero-cost action path before infra scaling |
| Verification | local pytest suite | Fast feedback loop before PR/merge |

## 11) Roadmap

These are the next high-impact upgrades.

- scheduled nudge delivery automation
- optional encryption-at-rest for memory snapshots
- scenario benchmark suite for coaching quality
- CI checks for tests and linting

## 12) Repository Layout

The structure keeps analytics, agent logic, and UI concerns separated.

```text
UPI-Mirror/
|- app.py
|- requirements.txt
|- src/
|  |- analytics.py
|  |- coach_agent.py
|  |- coach_memory.py
|  |- data.py
|  |- delivery.py
|  |- insights.py
|  |- lightning.py
|  |- merchant.py
|  |- narrative.py
|  |- regret.py
|  |- ui.py
|- tests/
|  |- test_coach_agent_unit.py
|  |- test_narrative_fallback.py
|- docs/
|  |- DEMO_WALKTHROUGH.md
|  |- screenshots/
|     |- README.md
```

## 13) License

MIT license keeps usage simple for personal and commercial learning projects.

---

<div align="center">

<strong>Built and maintained by @Yashaswini-V21</strong><br/>
UPI Mirror is an open project focused on predictive personal finance and behavior-driven intervention design.

If you like this work, star this repository: https://github.com/Yashaswini-V21/UPI-Mirror

</div>
