from __future__ import annotations

from datetime import datetime

import pandas as pd
import plotly.express as px
import streamlit as st

from src.analytics import (
    compute_addiction_scores,
    detect_weekly_anomalies,
    month_to_date_spend,
    predict_broke_date,
    simulate_savings,
)
from src.data import load_transactions
from src.ui import inject_styles, render_free_stack, render_hero, render_quote, render_unique_angles


st.set_page_config(page_title="UPI Mirror", page_icon="chart_with_upwards_trend", layout="wide")
inject_styles()

st.sidebar.markdown("## Configure the mirror")
uploaded_file = st.sidebar.file_uploader("Upload UPI CSV", type=["csv"])
monthly_budget = st.sidebar.number_input("Monthly budget (Rs.)", min_value=1000, value=18000, step=500)
cut_percent = st.sidebar.slider("Cut-back target (%)", min_value=5, max_value=60, value=25, step=5)
annual_interest_rate = st.sidebar.slider("Savings interest / FD rate (%)", min_value=1.0, max_value=12.0, value=6.0, step=0.5)
months = st.sidebar.slider("Projection window (months)", min_value=3, max_value=24, value=12, step=1)

try:
    transactions = load_transactions(uploaded_file)
except ValueError as exc:
    st.error(str(exc))
    st.stop()

transactions = transactions.copy()
transactions["datetime"] = pd.to_datetime(transactions["datetime"])
transactions["date"] = transactions["datetime"].dt.date
transactions["week"] = transactions["datetime"].dt.to_period("W").astype(str)

current_spend = month_to_date_spend(transactions, reference_date=datetime.now())
prediction = predict_broke_date(transactions, monthly_budget=monthly_budget, reference_date=datetime.now())
addiction_scores = compute_addiction_scores(transactions)
weekly = detect_weekly_anomalies(transactions)
savings = simulate_savings(current_spend, cut_percent=cut_percent, annual_interest_rate=annual_interest_rate, months=months)

top_category = "None yet"
if not addiction_scores.empty:
    top_category = str(addiction_scores.iloc[0]["category"])

render_hero(current_spend=current_spend, projected_month_end=float(prediction["projected_month_end"]))

if uploaded_file is None:
    st.info("Showing deterministic demo data for the last 90 days. Upload your own CSV with columns: datetime, amount, category, merchant.")

metric_columns = st.columns(4)
with metric_columns[0]:
    st.markdown('<div class="metric-card"><div class="metric-label">Month to date</div><div class="metric-value">Rs. {:,.0f}</div><div class="metric-subtle">Budget Rs. {:,.0f}</div></div>'.format(current_spend, monthly_budget), unsafe_allow_html=True)
with metric_columns[1]:
    broke_label = prediction["predicted_date"].strftime("%d %b") if prediction["predicted_date"] else "Budget safe"
    sub_label = "{} days left".format(prediction["days_left"]) if prediction["days_left"] is not None else "No overrun predicted"
    st.markdown(f'<div class="metric-card"><div class="metric-label">Broke date</div><div class="metric-value">{broke_label}</div><div class="metric-subtle">{sub_label}</div></div>', unsafe_allow_html=True)
with metric_columns[2]:
    st.markdown('<div class="metric-card"><div class="metric-label">Projected month-end</div><div class="metric-value">Rs. {:,.0f}</div><div class="metric-subtle">Daily burn Rs. {:,.0f}</div></div>'.format(prediction["projected_month_end"], prediction["daily_burn"]), unsafe_allow_html=True)
with metric_columns[3]:
    top_score = int(addiction_scores.iloc[0]["score"]) if not addiction_scores.empty else 0
    st.markdown(f'<div class="metric-card"><div class="metric-label">Top habit alert</div><div class="metric-value">{top_score}/100</div><div class="metric-subtle">{top_category}</div></div>', unsafe_allow_html=True)

tabs = st.tabs(["DS Features", "Unique Angles", "Free Tools"])

with tabs[0]:
    chart_left, chart_right = st.columns([1.25, 1])
    with chart_left:
        daily_spend = (
            transactions.groupby(transactions["datetime"].dt.floor("D"))["amount"]
            .sum()
            .reset_index(name="amount")
        )
        spend_chart = px.line(
            daily_spend,
            x="datetime",
            y="amount",
            markers=True,
            color_discrete_sequence=["#13d7b0"],
            title="Daily spend pattern",
        )
        spend_chart.update_layout(
            paper_bgcolor="rgba(0,0,0,0)",
            plot_bgcolor="rgba(0,0,0,0)",
            font_color="#d9e1f2",
            xaxis_title="",
            yaxis_title="Amount (Rs.)",
            margin=dict(l=10, r=10, t=50, b=10),
        )
        st.plotly_chart(spend_chart, use_container_width=True)

    with chart_right:
        category_spend = transactions.groupby("category", as_index=False)["amount"].sum().sort_values("amount", ascending=False)
        category_chart = px.bar(
            category_spend,
            x="amount",
            y="category",
            orientation="h",
            color="amount",
            color_continuous_scale=["#16304d", "#13d7b0"],
            title="Where the money went",
        )
        category_chart.update_layout(
            paper_bgcolor="rgba(0,0,0,0)",
            plot_bgcolor="rgba(0,0,0,0)",
            font_color="#d9e1f2",
            coloraxis_showscale=False,
            xaxis_title="Amount (Rs.)",
            yaxis_title="",
            margin=dict(l=10, r=10, t=50, b=10),
        )
        st.plotly_chart(category_chart, use_container_width=True)

    detail_left, detail_right = st.columns([1.1, 0.9])
    with detail_left:
        st.markdown("### Addiction score by category")
        st.dataframe(addiction_scores, use_container_width=True, hide_index=True)

    with detail_right:
        st.markdown("### Weekly anomalies")
        anomaly_table = weekly.copy()
        anomaly_table["week_end"] = anomaly_table["datetime"].dt.strftime("%d %b %Y")
        anomaly_table["status"] = anomaly_table["is_anomaly"].map({True: "Spike", False: "Normal"})
        st.dataframe(
            anomaly_table[["week_end", "weekly_spend", "severity", "status"]],
            use_container_width=True,
            hide_index=True,
        )

    st.markdown("### Savings simulator")
    savings_chart = px.area(
        savings,
        x="month",
        y=["saved_from_cutbacks", "projected_balance"],
        color_discrete_sequence=["#ffbb38", "#13d7b0"],
    )
    savings_chart.update_layout(
        paper_bgcolor="rgba(0,0,0,0)",
        plot_bgcolor="rgba(0,0,0,0)",
        font_color="#d9e1f2",
        xaxis_title="Month",
        yaxis_title="Amount (Rs.)",
        margin=dict(l=10, r=10, t=10, b=10),
        legend_title_text="",
    )
    st.plotly_chart(savings_chart, use_container_width=True)

with tabs[1]:
    render_unique_angles(addiction_scores)
    st.markdown("### Why this product angle works")
    st.markdown(
        """
        - Personal pain becomes a measurable product: broke-date prediction from your own spend history.
        - Behavioral finance instead of generic charts: score categories that look ritualistic or compulsive.
        - Story-friendly output: anomaly spikes and regret categories are easy to post, explain, and demo.
        """
    )
    render_quote()

with tabs[2]:
    render_free_stack()
    st.markdown("### CSV schema")
    st.code("datetime,amount,category,merchant", language="text")
    st.markdown("### Suggested next issues")
    st.markdown(
        """
        1. Add a regret score input after each food order.
        2. Add merchant-level broke triggers like 'Swiggy after 10PM'.
        3. Add exportable insight cards for LinkedIn and demo videos.
        """
    )
