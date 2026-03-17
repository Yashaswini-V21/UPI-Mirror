<div align="center">

# 💳 UPI Mirror

### Predictive Behavioural Finance Intelligence from UPI Data

> *Most expense tools report the past.*
> *UPI Mirror predicts risk, explains behaviour, and helps prevent repeat spending mistakes.*

[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=flat-square&logo=python&logoColor=white)](https://python.org)
[![Streamlit](https://img.shields.io/badge/Streamlit-1.55-FF4B4B?style=flat-square&logo=streamlit&logoColor=white)](https://streamlit.io)
[![Scikit-learn](https://img.shields.io/badge/Scikit--learn-1.8-F7931E?style=flat-square&logo=scikit-learn&logoColor=white)](https://scikit-learn.org)
[![Plotly](https://img.shields.io/badge/Plotly-6.0-3F4F75?style=flat-square&logo=plotly&logoColor=white)](https://plotly.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-13d7b0?style=flat-square)](LICENSE)
[![Status](https://img.shields.io/badge/Status-In%20Progress-f59e0b?style=flat-square)](#)

**Built by [Yashaswini V](https://github.com/Yashaswini-V21)**

**Project Status:** In Progress (active development)

</div>

---

## Overview

**UPI Mirror** is an end-to-end behavioural finance analytics platform built entirely on free, open-source tools. It transforms raw UPI transaction exports into a predictive intelligence layer — surfacing spending forecasts, compulsive habit scores, anomaly alerts, and merchant-level behaviour patterns that no standard banking app provides.

The core insight: **the most impactful financial decisions are behavioural, not numerical.** UPI Mirror quantifies behaviour.

---

## What This Project Does

UPI Mirror turns a simple UPI transaction CSV into a complete behavioural intelligence report.

You can use it to:
- Predict when your monthly budget is likely to run out
- Identify categories that behave like spending addictions
- Catch abnormal weekly spikes before they become a pattern
- Measure post-purchase regret by category, amount, and hour
- Discover merchants driving late-night, high-regret spends
- Generate safe-to-share insight cards for resumes and LinkedIn

In short: it is not a passive expense tracker, it is an **early warning + behaviour correction system** for personal finance.

---

## What Makes It Unique

Most student finance tools either:
- Show static dashboards (pie charts, bar graphs)
- Require paid subscriptions or bank integrations
- Track what happened — never what's *about* to happen

UPI Mirror does something different across every layer:

| Layer | Standard Tools | UPI Mirror |
|-------|---------------|------------|
| **Prediction** | No forecasting | Linear regression → exact broke date |
| **Behaviour** | Category totals | Multi-factor addiction scoring per category |
| **Anomaly** | No alerts | IQR-based statistical spike detection |
| **Emotion** | No emotional layer | Regret scores correlated with time + amount |
| **Merchant** | Basic spend lists | Late-night pattern alerts, regret-spend scatter |
| **Shareability** | Export raw CSV | One-click LinkedIn post generator |
| **Access** | Paid APIs / bank login | Works on any UPI export, fully offline |

> *"Behavioural data science nobody has done this way."* — built on personal transaction data, not textbook datasets.

---

## Feature Set

| Module | Technique | Output |
|--------|-----------|--------|
| **Broke Date Predictor** | Linear regression on daily cumulative spend | "You will exhaust your budget by March 22 — 7 days from now" |
| **Spending Addiction Score** | Multi-factor scoring: frequency + consistency + amount growth + late-night share | 0–100 score per category with trend direction |
| **Weekly Anomaly Detection** | IQR-based outlier flagging | "This week's food spend is 2.8 σ above your baseline" |
| **Savings Simulator** | Compound interest projection | Cut one category by 30% + 6% FD → ₹18,400 in 12 months |
| **Category Regret Score** | Regret (1–5) correlated with amount, time-of-day | "Your Food Delivery regret score is 4.2/5 after 10 PM" |
| **Merchant Insights** | Late-night share analysis + regret-spend scatter | "Zomato: 68% of orders after 10 PM — ₹4,200 in late-night spend" |
| **Spending Coach Agent** | LangGraph workflow + Groq narrative + Agent Lightning trace hooks | Daily coach state: anomaly → repeat pattern → nudge → limit suggestion |
| **Coach Memory** | JSON snapshot store, 30-day rolling history, isolated by upload hash | 7-day status chart and feedback history stay scoped to the active dataset |
| **Feedback Rewards** | Thumbs-up / thumbs-down on each nudge | user_reward (+1 / −1) written back to the snapshot and used as Agent Lightning reward when available |
| **Delivery Channels** | WhatsApp/email deep-link drafts generated from live coach output | Send today's nudge outside the dashboard in one click |
| **Shareable Insight Cards** | Templated post generation + CSV export | One-click LinkedIn post with blurred numbers, safe to share publicly |

---

## System Architecture

```mermaid
flowchart TD
    subgraph INPUT["📥 Data Input"]
        A1([UPI CSV Upload]) 
        A2([90-day Demo Data])
    end

    subgraph INGESTION["⚙️ Ingestion Layer — src/data.py"]
        B[Schema Validation\nType Coercion\nOptional Regret Column]
    end

    subgraph ANALYTICS["🧠 Analytics Layer"]
        direction TB
        D["src/analytics.py\n─────────────────\n• Broke Date · Linear Regression\n• Addiction Score · Multi-factor\n• Anomaly Detection · IQR\n• Savings · Compound Interest"]
        E["src/regret.py\n─────────────────\n• Per-category Regret Stats\n• Regret × Hour-of-Day\n• Regret × Amount Buckets"]
        F["src/merchant.py\n─────────────────\n• Top Merchants by Spend\n• Late-night Alerts (≥30%)\n• Regret–Spend Scatter"]
        G["src/insights.py\n─────────────────\n• LinkedIn Post Generator\n• Stats Summary CSV Export"]
    end

    subgraph AGENT["🤖 Agent Layer"]
        I["src/narrative.py\n─────────────────\n• Groq Narrative\n• Deterministic Fallback"]
        J["src/coach_agent.py\n─────────────────\n• LangGraph Spending Coach\n• Anomaly → Pattern → Nudge → Limit"]
        K["src/coach_memory.py\n─────────────────\n• Daily JSON Snapshot Store\n• 7-day Status History"]
        L["src/lightning.py\n─────────────────\n• Agent Lightning Traces\n• Reward Span Capture"]
        M["src/delivery.py\n─────────────────\n• WhatsApp Draft Link\n• Email Draft Link"]
    end

    subgraph PRESENTATION["🖥️ Presentation Layer"]
        H["src/ui.py\nStyles + Component Helpers"]
        APP["app.py · Streamlit Dashboard\n──────────────────────────────\nDS Features · Regret Score\nMerchant Insights · Coach Agent\nInsight Cards · Unique Angles · Free Tools"]
    end

    A1 & A2 --> B
    B --> D & E & F & G
    D & E & F & G --> I
    I --> J --> K
    J --> M
    D & E & F & G --> H
    J --> H
    M --> H
    H --> APP
```

### Data Flow (Step-by-Step)

1. User uploads UPI CSV (or uses auto-generated 90-day demo data).
2. `src/data.py` validates schema, parses datetimes, and standardizes types.
3. `src/analytics.py` computes broke-date forecast, addiction score, anomaly flags, and savings simulation.
4. `src/regret.py` computes regret intensity and time/amount relationships.
5. `src/merchant.py` computes merchant-level late-night and regret-linked spend patterns.
6. `src/narrative.py` builds a plain-English daily narrative using Groq when available and falls back to a deterministic template otherwise.
7. `src/coach_agent.py` runs a LangGraph coach workflow: anomaly detected → repeat pattern check → personalised nudge → limit suggestion.
8. `src/coach_memory.py` appends snapshots to dataset-scoped memory files (keyed by upload hash) so histories never leak across sessions.
9. `src/lightning.py` records coach traces and emits reward to Agent Lightning; it prefers `user_reward` when available and falls back to heuristic urgency otherwise.
10. The user can accept or dismiss the nudge — `record_feedback()` writes `user_reward` (±1.0) back into the same snapshot and that signal is reused in trace capture.
11. `src/delivery.py` builds WhatsApp and email deep links from the live nudge so the message can be sent outside the app.
12. `app.py` + `src/ui.py` present all outputs in a multi-tab interactive dashboard.

---

## Project Structure

```
UPI-Mirror/
│
├── app.py                  # Streamlit entrypoint — all tabs and layout
├── requirements.txt        # Pinned dependencies
│
└── src/
    ├── data.py             # CSV loader, schema validator, demo data generator
    ├── analytics.py        # Broke-date predictor, addiction score, anomaly, savings
    ├── regret.py           # Regret analytics: per-category, hourly, amount correlation
    ├── merchant.py         # Merchant ranking, late-night alerts, regret ranking
    ├── narrative.py        # Groq narrative generation with deterministic fallback
    ├── coach_agent.py      # LangGraph spending coach workflow
    ├── coach_memory.py     # Daily JSON snapshot store — 30-day rolling history
    ├── lightning.py        # Agent Lightning trace capture for coach runs
    ├── delivery.py         # WhatsApp/email delivery-link generator for coach nudges
    ├── insights.py         # LinkedIn card generator, summary CSV export
    └── ui.py               # CSS injection, hero card, shared UI components
```

---

## Quickstart (Professional Setup)

### 1. Prerequisites

- Python 3.11 or above
- Git
- Terminal / PowerShell

### 2. Clone Repository

```bash
git clone https://github.com/Yashaswini-V21/UPI-Mirror.git
cd UPI-Mirror
```

### 3. Create and Activate Virtual Environment

```bash
# Windows
python -m venv .venv
.venv\Scripts\activate

# macOS / Linux
python -m venv .venv
source .venv/bin/activate
```

### 4. Install Dependencies

```bash
pip install -r requirements.txt
```

### 5. Launch Dashboard

```bash
streamlit run app.py
```

### 5.1 Optional AI Environment Variables

```bash
# Groq narrative provider
set GROQ_API_KEY=your_groq_key_here
```

If `GROQ_API_KEY` is missing, the Spending Coach still runs using a deterministic narrative fallback.

### 6. Open in Browser

Visit [http://localhost:8501](http://localhost:8501) — demo data loads automatically. No CSV required to explore the full feature set.

---

## CSV Schema

Bring your own UPI export. The only required columns are the first four:

```csv
datetime,amount,category,merchant,regret
2026-03-01 20:15:00,320.0,Food Delivery,Zomato,4
2026-03-02 09:30:00,180.0,Cafe,Blue Tokai,2
2026-03-03 11:00:00,640.0,Groceries,Blinkit,1
```

| Column | Format | Required |
|--------|--------|----------|
| `datetime` | `YYYY-MM-DD HH:MM:SS` | ✅ |
| `amount` | `float` — amount in Rs. | ✅ |
| `category` | `string` | ✅ |
| `merchant` | `string` | ✅ |
| `regret` | `int` 1–5 | ⬜ optional |

---

## Tech Stack

| Tool | Version | Role |
|------|---------|------|
| **Python** | 3.11+ | Core runtime |
| **Pandas** | 2.3 | Data wrangling, aggregations, time-series resampling |
| **Scikit-learn** | 1.8 | Linear regression for broke-date prediction |
| **Streamlit** | 1.55 | Interactive web dashboard with real-time sidebar controls |
| **Plotly** | 6.0 | Line, bar, scatter, area, bubble charts |
| **NumPy** | 2.0 | Numerical computation and array operations |
| **LangGraph** | 0.2+ | Stateful spending coach workflow |
| **Groq via langchain-groq** | 0.2+ | Plain-English spending narrative generation |
| **Agent Lightning** | 0.3+ | Trace capture and future reward optimization loop |

**Zero paid APIs. Zero external databases. Runs fully offline on your own data.**

Groq is optional. Without an API key, the coach falls back to a local rule-based narrative. Agent Lightning is also optional at runtime; it is used to capture coach traces for future optimization rather than to power the dashboard itself.

---

## Product Roadmap

The core agent layer is live: coach workflow, dataset-isolated memory, user feedback rewards, delivery links, and Agent Lightning trace capture are integrated.

Next product milestones:

1. Add test coverage for coach routing, reward paths, and memory isolation behavior.
2. Auto-send scheduling layer for daily nudges (instead of manual click-through drafts).
3. Add optional encrypted-at-rest memory storage for privacy-sensitive usage.
4. Publish a polished demo walkthrough with screenshots and contribution templates.

---

## Future Enhancements

| Priority | Feature | Why it matters |
|----------|---------|----------------|
| High | WhatsApp / Email nudge delivery | Closes the loop from insight to behavior change |
| High | Per-merchant weekly trend drill-down | Makes merchant-level habit shifts visible over time |
| Medium | Isolation Forest anomaly detection | Improves robustness when spend data is heavily skewed |
| Medium | Narrative quality tuning from reward history | Uses feedback-driven reward traces to improve nudge relevance |
| Medium | Light and dark theme toggle | Better accessibility and demo flexibility |
| Low | Multi-month comparison view | Shows habit improvement or decline across months |
| Low | PhonePe / Google Pay CSV auto-parser | Reduces manual cleanup for real exports |
| Low | Budget goal tracker | Turns diagnostics into a simple action plan |

---

## Practical Impact

UPI Mirror is designed to support real spending decisions, not just reporting.

- **Before overspending:** broke-date prediction warns when current pace is unsafe
- **During the month:** anomaly alerts catch unusual jumps early
- **After transactions:** regret analysis identifies repeat triggers
- **At merchant level:** late-night and high-regret patterns reveal where leakage happens
- **For communication:** shareable cards convert analysis into resume/LinkedIn-ready proof

### How This Is Different

- It is behaviour-first, not category-chart-first
- It gives forward-looking signals, not only historical summaries
- It combines forecasting, anomaly detection, regret analytics, and communication in one app
- It runs fully offline on plain CSV input with no paid APIs

---

<div align="center">

Built by **[Yashaswini V](https://github.com/Yashaswini-V21)**

*Star the repo ⭐ if this helped you think differently about your own spending.*

</div>
