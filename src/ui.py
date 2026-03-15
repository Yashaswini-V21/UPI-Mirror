from __future__ import annotations

import pandas as pd
import streamlit as st


def inject_styles() -> None:
    st.markdown(
        """
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&family=IBM+Plex+Mono:wght@400;600&display=swap');

            :root {
                --bg: #08111f;
                --panel: #0e1728;
                --panel-soft: rgba(18, 30, 52, 0.76);
                --copy: #d9e1f2;
                --muted: #7f8aa6;
                --line: rgba(112, 130, 168, 0.22);
                --teal: #13d7b0;
                --teal-soft: rgba(19, 215, 176, 0.16);
                --amber: #ffbb38;
                --rose: #ff5a7d;
            }

            .stApp {
                background:
                    radial-gradient(circle at top right, rgba(19, 215, 176, 0.08), transparent 30%),
                    radial-gradient(circle at 15% 10%, rgba(255, 90, 125, 0.08), transparent 24%),
                    linear-gradient(180deg, #070d17 0%, #0b1321 100%);
                color: var(--copy);
            }

            [data-testid="stHeader"] {
                background: transparent;
            }

            [data-testid="stSidebar"] {
                background: rgba(7, 13, 23, 0.9);
                border-right: 1px solid var(--line);
            }

            .hero-card,
            .metric-card,
            .content-card,
            .quote-card {
                border: 1px solid var(--line);
                background: linear-gradient(180deg, rgba(11, 20, 34, 0.92), rgba(9, 16, 28, 0.92));
                border-radius: 22px;
                padding: 1.35rem 1.4rem;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.24);
            }

            .eyebrow {
                color: var(--amber);
                font-family: 'IBM Plex Mono', monospace;
                font-size: 0.72rem;
                letter-spacing: 0.24em;
                text-transform: uppercase;
                margin-bottom: 0.75rem;
            }

            .hero-title {
                font-family: 'Space Grotesk', sans-serif;
                font-size: clamp(2.2rem, 3vw, 3.7rem);
                line-height: 1.02;
                font-weight: 700;
                margin: 0;
                color: #f3f7ff;
            }

            .hero-copy,
            .body-copy {
                color: var(--muted);
                font-size: 1.04rem;
                line-height: 1.75;
                margin-top: 0.9rem;
            }

            .badge-row {
                display: flex;
                gap: 0.65rem;
                flex-wrap: wrap;
                margin-bottom: 1rem;
            }

            .badge {
                font-family: 'IBM Plex Mono', monospace;
                font-size: 0.72rem;
                border: 1px solid var(--line);
                border-radius: 999px;
                padding: 0.32rem 0.7rem;
                color: #e8eeff;
                background: rgba(255, 255, 255, 0.02);
            }

            .metric-label {
                color: var(--muted);
                font-family: 'IBM Plex Mono', monospace;
                text-transform: uppercase;
                letter-spacing: 0.16em;
                font-size: 0.72rem;
            }

            .metric-value {
                color: #f8fbff;
                font-family: 'Space Grotesk', sans-serif;
                font-size: 2rem;
                font-weight: 700;
                margin-top: 0.5rem;
            }

            .metric-subtle {
                color: var(--teal);
                margin-top: 0.4rem;
                font-size: 0.9rem;
            }

            .section-title {
                font-family: 'IBM Plex Mono', monospace;
                text-transform: uppercase;
                letter-spacing: 0.22em;
                color: #92a0be;
                font-size: 0.75rem;
                margin-bottom: 0.8rem;
            }

            .quote-card {
                border-left: 4px solid var(--teal);
                background: linear-gradient(180deg, rgba(5, 40, 36, 0.7), rgba(8, 30, 30, 0.72));
            }

            .quote-card p {
                color: #b7f8eb;
                font-size: 1.1rem;
                line-height: 1.7;
                margin: 0;
            }

            .stTabs [data-baseweb="tab-list"] {
                gap: 1rem;
            }

            .stTabs [data-baseweb="tab"] {
                font-family: 'IBM Plex Mono', monospace;
                font-size: 0.78rem;
                letter-spacing: 0.2em;
                text-transform: uppercase;
                color: #76829e;
                padding-bottom: 1rem;
            }

            .stTabs [aria-selected="true"] {
                color: var(--teal);
                border-bottom: 2px solid var(--teal);
            }

            div[data-testid="stMetric"] {
                background: transparent;
                border: none;
                padding: 0;
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
                <span class="badge">Personal pain</span>
                <span class="badge">FinTech</span>
                <span class="badge">Built from your own data</span>
            </div>
            <div class="eyebrow">UPI Mirror</div>
            <h1 class="hero-title">Student money shame bot, but actually useful.</h1>
            <p class="hero-copy">
                Brutally honest UPI spend tracker with a broke-date predictor, spending addiction score,
                anomaly detection, and a savings simulator. Upload a CSV or start with demo data.
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
