from __future__ import annotations

import pandas as pd
import streamlit as st


def inject_styles() -> None:
    st.markdown(
        """
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap');

            :root {
                --copy: #f7f8ff;
                --muted: #f6d8bb;
                --line: rgba(255, 255, 255, 0.20);
                --panel: rgba(20, 29, 59, 0.65);
                --panel-strong: rgba(14, 21, 44, 0.84);
                --mint: #72f4d2;
                --gold: #ffd46b;
                --coral: #ff8f79;
            }

            .stApp {
                background:
                    radial-gradient(1100px 550px at 10% -15%, rgba(255, 180, 108, 0.50), transparent 58%),
                    radial-gradient(760px 420px at 95% 8%, rgba(96, 221, 207, 0.42), transparent 52%),
                    linear-gradient(145deg, #14192f 0%, #253e73 42%, #2f6a96 100%);
                color: var(--copy);
                font-family: 'Plus Jakarta Sans', sans-serif;
            }

            [data-testid="stHeader"] {
                background: transparent;
            }

            [data-testid="stSidebar"] {
                background: linear-gradient(170deg, rgba(17, 24, 49, 0.97), rgba(20, 39, 76, 0.94));
                border-right: 1px solid rgba(255, 255, 255, 0.14);
            }

            .hero-card,
            .metric-card,
            .content-card,
            .how-card,
            .quote-card {
                border: 1px solid var(--line);
                background: linear-gradient(180deg, var(--panel-strong), var(--panel));
                border-radius: 22px;
                padding: 1.35rem 1.4rem;
                box-shadow: 0 22px 46px rgba(0, 0, 0, 0.26);
                backdrop-filter: blur(6px);
            }

            .eyebrow {
                color: var(--gold);
                font-family: 'JetBrains Mono', monospace;
                font-size: 0.72rem;
                letter-spacing: 0.24em;
                text-transform: uppercase;
                margin-bottom: 0.75rem;
            }

            .hero-title {
                font-family: 'Plus Jakarta Sans', sans-serif;
                font-size: clamp(2.2rem, 3vw, 3.7rem);
                line-height: 1.02;
                font-weight: 800;
                margin: 0;
                color: #ffffff;
            }

            .hero-copy,
            .body-copy {
                color: var(--muted);
                font-size: 1rem;
                line-height: 1.72;
                margin-top: 0.9rem;
            }

            .badge-row {
                display: flex;
                gap: 0.65rem;
                flex-wrap: wrap;
                margin-bottom: 1rem;
            }

            .badge {
                font-family: 'JetBrains Mono', monospace;
                font-size: 0.72rem;
                border: 1px solid rgba(255, 255, 255, 0.2);
                border-radius: 999px;
                padding: 0.32rem 0.7rem;
                color: #f6f7ff;
                background: rgba(255, 255, 255, 0.08);
            }

            .metric-label {
                color: var(--muted);
                font-family: 'JetBrains Mono', monospace;
                text-transform: uppercase;
                letter-spacing: 0.16em;
                font-size: 0.72rem;
            }

            .metric-value {
                color: #ffffff;
                font-family: 'Plus Jakarta Sans', sans-serif;
                font-size: 2rem;
                font-weight: 800;
                margin-top: 0.5rem;
            }

            .metric-subtle {
                color: var(--mint);
                margin-top: 0.4rem;
                font-size: 0.9rem;
            }

            .section-title {
                font-family: 'JetBrains Mono', monospace;
                text-transform: uppercase;
                letter-spacing: 0.22em;
                color: #d6e4ff;
                font-size: 0.75rem;
                margin-bottom: 0.8rem;
            }

            .how-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
                gap: 0.8rem;
                margin-top: 0.7rem;
            }

            .how-step {
                border: 1px solid rgba(255, 255, 255, 0.16);
                border-radius: 14px;
                padding: 0.8rem 0.9rem;
                background: rgba(255, 255, 255, 0.06);
            }

            .how-step .step-no {
                font-family: 'JetBrains Mono', monospace;
                font-size: 0.68rem;
                color: var(--gold);
                letter-spacing: 0.16em;
                text-transform: uppercase;
            }

            .how-step .step-title {
                margin-top: 0.35rem;
                font-weight: 700;
                font-size: 0.98rem;
                color: #ffffff;
            }

            .how-step .step-copy {
                margin-top: 0.3rem;
                color: var(--muted);
                font-size: 0.88rem;
                line-height: 1.5;
            }

            .quote-card {
                border-left: 4px solid var(--mint);
                background: linear-gradient(180deg, rgba(12, 54, 70, 0.72), rgba(22, 41, 70, 0.7));
            }

            .quote-card p {
                color: #cefff5;
                font-size: 1.1rem;
                line-height: 1.7;
                margin: 0;
            }

            .stTabs [data-baseweb="tab-list"] {
                gap: 1rem;
            }

            .stTabs [data-baseweb="tab"] {
                font-family: 'JetBrains Mono', monospace;
                font-size: 0.78rem;
                letter-spacing: 0.2em;
                text-transform: uppercase;
                color: #f0d8bf;
                padding-bottom: 1rem;
            }

            .stTabs [aria-selected="true"] {
                color: var(--mint);
                border-bottom: 2px solid var(--mint);
            }

            div[data-testid="stMetric"] {
                background: transparent;
                border: none;
                padding: 0;
            }

            [data-testid="stExpander"] {
                border: 1px solid rgba(255, 255, 255, 0.16);
                border-radius: 14px;
                background: rgba(16, 27, 54, 0.62);
            }

            @media (max-width: 768px) {
                .hero-title {
                    font-size: 2rem;
                }
            }
        </style>
        """,
        unsafe_allow_html=True,
    )


def render_hero(current_spend: float, projected_month_end: float) -> None:
    st.markdown(
        f"""
        <div class="hero-card">
            <div class="badge-row">
                <span class="badge">Behavior Intelligence</span>
                <span class="badge">Consumer FinTech</span>
                <span class="badge">Made for launch</span>
            </div>
            <div class="eyebrow">UPI Mirror</div>
            <h1 class="hero-title">SaaS-grade personal finance coach from raw UPI data.</h1>
            <p class="hero-copy">
                Turn daily transactions into a live risk board with broke-date forecasting,
                behavior scoring, anomaly routing, and action-ready nudges.
            </p>
            <p class="body-copy">
                This month you have already spent <strong>Rs. {current_spend:,.0f}</strong>.
                At the current burn rate, month-end spend lands near <strong>Rs. {projected_month_end:,.0f}</strong>.
            </p>
        </div>
        """,
        unsafe_allow_html=True,
    )


def render_free_stack() -> None:
    st.markdown(
        """
        <div class="content-card">
            <div class="section-title">Free tools</div>
            <div class="badge-row">
                <span class="badge">Pandas</span>
                <span class="badge">Scikit-learn</span>
                <span class="badge">Streamlit</span>
                <span class="badge">Plotly</span>
                <span class="badge">Your own UPI data</span>
            </div>
        </div>
        """,
        unsafe_allow_html=True,
    )


def render_how_it_works(using_demo_data: bool) -> None:
    source_badge = "Using built-in demo dataset" if using_demo_data else "Using uploaded CSV"
    st.markdown(
        f"""
        <div class="how-card">
            <div class="section-title">How it works</div>
            <div class="badge-row">
                <span class="badge">{source_badge}</span>
                <span class="badge">Realtime in-memory analysis</span>
                <span class="badge">No external DB needed</span>
            </div>
            <div class="how-grid">
                <div class="how-step">
                    <div class="step-no">Step 1</div>
                    <div class="step-title">Ingest</div>
                    <div class="step-copy">Upload CSV with datetime, amount, category, merchant, regret.</div>
                </div>
                <div class="how-step">
                    <div class="step-no">Step 2</div>
                    <div class="step-title">Analyze</div>
                    <div class="step-copy">Model computes risk, spikes, category intensity, and regret context.</div>
                </div>
                <div class="how-step">
                    <div class="step-no">Step 3</div>
                    <div class="step-title">Coach</div>
                    <div class="step-copy">Agent sets status, builds narrative, and suggests a weekly cap.</div>
                </div>
                <div class="how-step">
                    <div class="step-no">Step 4</div>
                    <div class="step-title">Act</div>
                    <div class="step-copy">Open WhatsApp or email draft and send the nudge in one click.</div>
                </div>
            </div>
        </div>
        """,
        unsafe_allow_html=True,
    )


def render_unique_angles(addiction_scores: pd.DataFrame) -> None:
    top_category = "Food Delivery"
    top_score = 74
    if not addiction_scores.empty:
        top_category = str(addiction_scores.iloc[0]["category"])
        top_score = int(addiction_scores.iloc[0]["score"])

    st.markdown(
        f"""
        <div class="content-card">
            <div class="section-title">Unique angles</div>
            <p class="body-copy">
                Most finance apps stop at charts. This one turns your own UPI data into a behavior story:
                which category is becoming compulsive, which week was abnormal, and how much you would save if you cut the habit.
            </p>
            <p class="body-copy">
                Current strongest signal: <strong>{top_category}</strong> with an addiction score of <strong>{top_score}/100</strong>.
            </p>
        </div>
        """,
        unsafe_allow_html=True,
    )


def render_quote() -> None:
    st.markdown(
        """
        <div class="quote-card">
            <p>
                I was a broke student who did not know where the money was going. So I built a model that predicts my broke date,
                flags spending spikes, and tells me which habits are becoming expensive rituals.
            </p>
        </div>
        """,
        unsafe_allow_html=True,
    )
