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
from src.coach_agent import run_spending_coach_agent
from src.coach_memory import load_history, record_feedback, save_snapshot
from src.data import load_transactions
from src.lightning import agentlightning_is_available, record_coach_trace
from src.regret import compute_regret_stats, regret_by_hour, regret_amount_correlation, top_regret_insight
from src.merchant import top_merchants_by_spend, late_night_merchant_alerts, merchant_regret_correlation, top_late_night_insight
from src.insights import generate_linkedin_card, generate_summary_stats
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
regret_stats = compute_regret_stats(transactions)
regret_hourly = regret_by_hour(transactions)
regret_amount = regret_amount_correlation(transactions)
regret_headline = top_regret_insight(regret_stats)
merchant_top = top_merchants_by_spend(transactions)
merchant_late_night = late_night_merchant_alerts(transactions)
merchant_regret = merchant_regret_correlation(transactions)
merchant_headline = top_late_night_insight(merchant_late_night)
coach_result = run_spending_coach_agent(
    transactions=transactions,
    monthly_budget=monthly_budget,
    prediction=prediction,
    addiction_scores=addiction_scores,
    weekly=weekly,
    regret_stats=regret_stats,
    merchant_late_night=merchant_late_night,
)
agentlightning_enabled = agentlightning_is_available()
save_snapshot(coach_result.as_dict())
coach_history = load_history(last_n=7)

_top_addiction_category = str(addiction_scores.iloc[0]["category"]) if not addiction_scores.empty else "N/A"
_top_addiction_score = int(addiction_scores.iloc[0]["score"]) if not addiction_scores.empty else 0
_late_night_merchant = str(merchant_late_night.iloc[0]["merchant"]) if not merchant_late_night.empty else None
_late_night_share = float(merchant_late_night.iloc[0]["late_night_share"]) if not merchant_late_night.empty else 0.0
_top_regret_category = str(regret_stats.iloc[0]["category"]) if not regret_stats.empty else None
_top_regret_score = float(regret_stats.iloc[0]["mean_regret"]) if not regret_stats.empty else 0.0

linkedin_card = generate_linkedin_card(
    current_spend=current_spend,
    monthly_budget=monthly_budget,
    broke_date=prediction["predicted_date"],
    top_addiction_category=_top_addiction_category,
    top_addiction_score=_top_addiction_score,
    late_night_merchant=_late_night_merchant,
    late_night_share=_late_night_share,
    top_regret_category=_top_regret_category,
    top_regret_score=_top_regret_score,
)
summary_df = generate_summary_stats(
    transactions=transactions,
    current_spend=current_spend,
    monthly_budget=monthly_budget,
    prediction=prediction,
    addiction_scores=addiction_scores,
    regret_stats=regret_stats,
    merchant_late_night=merchant_late_night,
)

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

tabs = st.tabs(["DS Features", "Regret Score", "Merchant Insights", "Coach Agent", "Insight Cards", "Unique Angles", "Free Tools"])

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
    st.markdown(f"> **Shame bot says:** {regret_headline}")

    if not regret_stats.empty:
        reg_left, reg_right = st.columns([1.1, 0.9])
        with reg_left:
            st.markdown("### Regret score by category")
            st.dataframe(regret_stats, use_container_width=True, hide_index=True)

        with reg_right:
            if not regret_hourly.empty:
                hour_chart = px.bar(
                    regret_hourly,
                    x="hour",
                    y="mean_regret",
                    color="mean_regret",
                    color_continuous_scale=["#13d7b0", "#ffbb38", "#ff5a7d"],
                    range_color=[1, 5],
                    title="Regret by time of day",
                    labels={"hour": "Hour", "mean_regret": "Avg regret"},
                )
                hour_chart.update_layout(
                    paper_bgcolor="rgba(0,0,0,0)",
                    plot_bgcolor="rgba(0,0,0,0)",
                    font_color="#d9e1f2",
                    coloraxis_showscale=False,
                    margin=dict(l=10, r=10, t=50, b=10),
                )
                st.plotly_chart(hour_chart, use_container_width=True)

        if not regret_amount.empty:
            st.markdown("### Does spending more = more regret?")
            amt_chart = px.bar(
                regret_amount,
                x="amount_bucket",
                y="mean_regret",
                color="mean_regret",
                text="mean_regret",
                color_continuous_scale=["#13d7b0", "#ffbb38", "#ff5a7d"],
                range_color=[1, 5],
                title="Regret vs spend amount bucket",
                labels={"amount_bucket": "Spend level", "mean_regret": "Avg regret (1–5)"},
            )
            amt_chart.update_layout(
                paper_bgcolor="rgba(0,0,0,0)",
                plot_bgcolor="rgba(0,0,0,0)",
                font_color="#d9e1f2",
                coloraxis_showscale=False,
                margin=dict(l=10, r=10, t=50, b=10),
            )
            st.plotly_chart(amt_chart, use_container_width=True)
    else:
        st.info("Add a `regret` column (1–5) to your CSV to enable regret analysis.")

with tabs[2]:
    st.markdown(f"> **Late-night alert:** {merchant_headline}")

    merch_left, merch_right = st.columns([1.1, 0.9])
    with merch_left:
        st.markdown("### Top merchants by spend")
        st.dataframe(merchant_top, use_container_width=True, hide_index=True)

    with merch_right:
        if not merchant_late_night.empty:
            ln_chart = px.bar(
                merchant_late_night,
                x="late_night_share",
                y="merchant",
                orientation="h",
                color="late_night_share",
                color_continuous_scale=["#ffbb38", "#ff5a7d"],
                title="Late-night order share (%) by merchant",
                labels={"late_night_share": "% after 10 PM", "merchant": ""},
            )
            ln_chart.update_layout(
                paper_bgcolor="rgba(0,0,0,0)",
                plot_bgcolor="rgba(0,0,0,0)",
                font_color="#d9e1f2",
                coloraxis_showscale=False,
                margin=dict(l=10, r=10, t=50, b=10),
            )
            st.plotly_chart(ln_chart, use_container_width=True)
        else:
            st.info("No merchant with 30%+ late-night order share detected.")

    if not merchant_regret.empty:
        st.markdown("### Merchant regret ranking")
        regret_chart = px.scatter(
            merchant_regret,
            x="total_spend",
            y="avg_regret",
            size="transaction_count",
            text="merchant",
            color="avg_regret",
            color_continuous_scale=["#13d7b0", "#ffbb38", "#ff5a7d"],
            range_color=[1, 5],
            title="Regret vs spend per merchant (bubble size = frequency)",
            labels={"total_spend": "Total spend (Rs.)", "avg_regret": "Avg regret (1–5)"},
        )
        regret_chart.update_traces(textposition="top center")
        regret_chart.update_layout(
            paper_bgcolor="rgba(0,0,0,0)",
            plot_bgcolor="rgba(0,0,0,0)",
            font_color="#d9e1f2",
            coloraxis_showscale=False,
            margin=dict(l=10, r=10, t=50, b=10),
        )
        st.plotly_chart(regret_chart, use_container_width=True)

with tabs[3]:
    st.markdown(f"### {coach_result.title}")
    provider_line = f"Narrative source: {coach_result.narrative_provider} · {coach_result.narrative_model}"
    st.caption(provider_line)

    coach_cols = st.columns(4)
    coach_cols[0].metric("Coach status", coach_result.status.title())
    coach_cols[1].metric("Anomaly", "Yes" if coach_result.anomaly_detected else "No")
    coach_cols[2].metric("Repeat pattern", "Yes" if coach_result.repeat_pattern_detected else "No")
    coach_cols[3].metric(
        f"Suggested {coach_result.limit_window} cap",
        f"Rs. {coach_result.suggested_limit:,.0f}" if coach_result.suggested_limit > 0 else "Track only",
    )

    st.markdown("### Daily narrative")
    st.info(coach_result.narrative)

    st.markdown("### Personalised nudge")
    st.markdown(coach_result.nudge)

    st.markdown("### Did this nudge help?")
    _today_str = datetime.now().date().isoformat()
    _fb_cols = st.columns(2)
    if _fb_cols[0].button("\U0001f44d  I'll try it", use_container_width=True, key="fb_accept"):
        record_feedback(_today_str, accepted=True)
        st.session_state["nudge_feedback"] = "accepted"
    if _fb_cols[1].button("\U0001f44e  Not for me", use_container_width=True, key="fb_dismiss"):
        record_feedback(_today_str, accepted=False)
        st.session_state["nudge_feedback"] = "dismissed"
    _fb = st.session_state.get("nudge_feedback")
    if _fb == "accepted":
        st.success("Great — marked as accepted. Reward +1.0 saved alongside today's snapshot.")
    elif _fb == "dismissed":
        st.warning("Got it — marked as dismissed. Reward \u22121.0 saved so the coach can learn from this.")

    st.markdown("### Agent flow")
    for action in coach_result.actions:
        st.markdown(f"- {action}")

    if coach_history:
        st.markdown("### Last 7 days — coach status history")
        history_df = pd.DataFrame(coach_history)
        history_df["date"] = pd.to_datetime(history_df["date"])
        status_map = {"stable": 0, "watch": 1, "critical": 2}
        history_df["status_level"] = history_df["status"].map(status_map).fillna(0)
        history_chart = px.bar(
            history_df,
            x="date",
            y="status_level",
            color="status",
            color_discrete_map={"stable": "#13d7b0", "watch": "#ffbb38", "critical": "#ff5a7d"},
            labels={"date": "", "status_level": "Risk level", "status": "Status"},
            title="Daily coach status (0 = stable, 1 = watch, 2 = critical)",
        )
        history_chart.update_layout(
            paper_bgcolor="rgba(0,0,0,0)",
            plot_bgcolor="rgba(0,0,0,0)",
            font_color="#d9e1f2",
            showlegend=True,
            margin=dict(l=10, r=10, t=50, b=10),
            yaxis=dict(tickvals=[0, 1, 2], ticktext=["Stable", "Watch", "Critical"]),
        )
        st.plotly_chart(history_chart, use_container_width=True)
        _history_cols = ["date", "status", "top_category", "suggested_limit", "reward_signal"]
        _col_rename = {"top_category": "focus category", "suggested_limit": "cap (Rs.)", "reward_signal": "urgency"}
        if "user_feedback" in history_df.columns:
            _history_cols.append("user_feedback")
            _col_rename["user_feedback"] = "your call"
        st.dataframe(
            history_df[_history_cols]
            .rename(columns=_col_rename)
            .sort_values("date", ascending=False),
            use_container_width=True,
            hide_index=True,
        )

    if agentlightning_enabled:
        if st.button("Capture Agent Lightning trace", use_container_width=True):
            reward_snapshots = load_history(last_n=30)
            reward_history = [
                float(s["user_reward"])
                for s in reward_snapshots
                if s.get("user_reward") is not None
            ]
            reward_override = reward_history[-1] if reward_history else None
            reward_source = "user_feedback" if reward_override is not None else "heuristic"
            st.session_state["coach_trace_result"] = record_coach_trace(
                coach_result,
                reward_override=reward_override,
                reward_source=reward_source,
                reward_history=reward_history,
            )

        trace_result = st.session_state.get("coach_trace_result")
        if trace_result is not None:
            status_callout = st.success if trace_result.enabled else st.warning
            status_callout(trace_result.message)
            if trace_result.enabled:
                st.caption(
                    "Trace spans: {} · Reward: {:.1f} · Source: {} · History points: {} · Rollout: {}".format(
                        trace_result.span_count,
                        trace_result.reward,
                        trace_result.reward_source,
                        trace_result.reward_history_count,
                        trace_result.rollout_id,
                    )
                )
                if trace_result.reward_history_count > 0:
                    st.caption("Average user reward in history: {:.2f}".format(trace_result.reward_history_mean))
    else:
        st.info("Install the updated requirements to enable Agent Lightning trace capture for coach runs.")

with tabs[4]:
    st.markdown("### Post your data. Go viral.")
    st.markdown(
        "Copy the post below, blur your numbers manually, and post on LinkedIn. "
        "This exact angle gets traction in student and fresher communities every time."
    )
    st.text_area("LinkedIn post (copy and edit as needed)", value=linkedin_card, height=280)

    st.markdown("### Download your full stats summary")
    csv_bytes = summary_df.to_csv(index=False).encode("utf-8")
    st.download_button(
        label="Download insight_summary.csv",
        data=csv_bytes,
        file_name="upi_mirror_insight_summary.csv",
        mime="text/csv",
    )

    st.markdown("### Your headline numbers (blurred for sharing)")
    blur_cols = st.columns(3)
    blur_cols[0].metric("Month spend", "Rs. ██,███")
    blur_cols[1].metric("Broke date", prediction["predicted_date"].strftime("%d %b") if prediction["predicted_date"] else "Safe")
    blur_cols[2].metric("Top habit", f"{_top_addiction_category} ({_top_addiction_score}/100)")

with tabs[5]:
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

with tabs[6]:
    render_free_stack()
    st.markdown("### CSV schema")
    st.code("datetime,amount,category,merchant,regret", language="text")
    st.markdown("`regret` is optional (1–5 integer). Omitting it disables the Regret Score tab.")
    st.markdown("### Suggested next issues")
    st.markdown(
        """
        1. Add WhatsApp/email delivery for the coach nudge.
        2. Multi-user sessions — isolate memory per uploaded CSV hash.
        3. Auto-capture traces after feedback so no manual click is needed.
        """
    )
