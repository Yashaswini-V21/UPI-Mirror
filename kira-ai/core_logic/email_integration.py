"""Email integration for Kira-AI using Resend API.

Environment variables:
  - RESEND_API_KEY: Resend API authentication key (required for integration)
  - FROM_EMAIL: Sender email address (default: onboarding@resend.dev)
  - TO_EMAIL: Recipient email address (required for integration)

All functions gracefully degrade if integration is disabled.
"""

from __future__ import annotations

import logging
import os
from typing import Any, Optional

from fastapi.background import BackgroundTasks

try:
    from resend import Resend
except ImportError:
    Resend = None

LOGGER = logging.getLogger(__name__)

# Configuration from environment
RESEND_API_KEY = os.getenv("RESEND_API_KEY", "").strip()
FROM_EMAIL = os.getenv("FROM_EMAIL", "onboarding@resend.dev").strip()
TO_EMAIL = os.getenv("TO_EMAIL", "").strip()


def _is_enabled() -> bool:
    """Check if email integration is enabled (API key and recipient configured)."""
    return bool(RESEND_API_KEY and TO_EMAIL)


def _get_resend_client() -> Optional[Resend]:
    """Return Resend client instance if available and enabled."""
    if not _is_enabled() or Resend is None:
        return None
    try:
        return Resend(api_key=RESEND_API_KEY)
    except Exception as exc:
        LOGGER.warning(f"Failed to initialize Resend client: {exc}")
        return None


def _build_email_html(coach_state: dict[str, Any]) -> str:
    """
    Build a responsive HTML email template with Kira-AI coaching data.

    Features:
    - Dark theme with purple/green accent colors
    - Mobile-responsive table-based layout
    - Status badge with color coding
    - Days left counter
    - Narrative blockquote
    - Action button with CTA
    - Tip section
    - Footer

    Args:
        coach_state: Coach workflow state dict

    Returns:
        HTML email body as string
    """
    # Extract data from coach_state
    status = coach_state.get("status", "stable").lower()
    days_left = coach_state.get("days_left", "N/A")
    top_category = coach_state.get("top_category", "Unknown")
    narrative = coach_state.get("narrative", "No insights available.")[:200]
    suggested_cap = coach_state.get("suggested_cap", 0)
    burn_rate = coach_state.get("burn_rate_daily", 0.0)
    confidence_score = coach_state.get("confidence_score", 0.0)

    # Color coding for status
    status_colors = {
        "stable": {"bg": "#10b981", "text": "#ecfdf5", "label": "Stable"},
        "watch": {"bg": "#f59e0b", "text": "#fffbeb", "label": "Watch"},
        "critical": {"bg": "#ef4444", "text": "#fef2f2", "label": "Critical"},
    }
    status_style = status_colors.get(status, status_colors["stable"])

    # Days left color (same as status)
    days_color_map = {
        "stable": "#10b981",
        "watch": "#f59e0b",
        "critical": "#ef4444",
    }
    days_color = days_color_map.get(status, "#10b981")

    html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Kira-AI Coaching Summary</title>
    <style>
        body {{
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Helvetica Neue", Arial, sans-serif;
            background-color: #f3f4f6;
        }}
        .email-container {{
            max-width: 600px;
            margin: 0 auto;
            background-color: #08090f;
            color: #eeeaf8;
        }}
        .header {{
            padding: 32px 24px;
            text-align: center;
            border-bottom: 1px solid #1f2937;
        }}
        .header-title {{
            font-size: 32px;
            font-weight: 700;
            letter-spacing: -0.02em;
            margin: 0;
            font-family: "Space Grotesk", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }}
        .header-kira {{
            color: #a78bfa;
        }}
        .header-ai {{
            color: #34d399;
        }}
        .content {{
            padding: 32px 24px;
        }}
        .status-section {{
            margin-bottom: 28px;
            text-align: center;
        }}
        .status-badge {{
            display: inline-block;
            background-color: {status_style['bg']};
            color: {status_style['text']};
            padding: 8px 16px;
            border-radius: 8px;
            font-weight: 600;
            font-size: 14px;
            margin-bottom: 16px;
        }}
        .days-left {{
            font-size: 48px;
            font-weight: 700;
            color: {days_color};
            margin: 16px 0;
        }}
        .days-label {{
            font-size: 14px;
            color: #9ca3af;
            margin-top: 8px;
        }}
        .stats-grid {{
            display: table;
            width: 100%;
            margin: 28px 0;
            border-collapse: collapse;
        }}
        .stat-cell {{
            display: table-cell;
            width: 50%;
            padding: 16px;
            border: 1px solid #1f2937;
            text-align: center;
        }}
        .stat-label {{
            font-size: 12px;
            color: #9ca3af;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-bottom: 8px;
        }}
        .stat-value {{
            font-size: 18px;
            font-weight: 600;
            color: #34d399;
        }}
        .narrative {{
            background-color: #111827;
            border-left: 4px solid #a78bfa;
            padding: 16px;
            margin: 24px 0;
            border-radius: 4px;
            font-size: 14px;
            line-height: 1.6;
            color: #d1d5db;
        }}
        .action-button {{
            display: inline-block;
            background-color: #08090f;
            border: 2px solid #34d399;
            color: #34d399;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            font-size: 14px;
            margin: 24px 0;
            text-align: center;
        }}
        .action-button:hover {{
            background-color: #111827;
        }}
        .action-section {{
            text-align: center;
            margin: 28px 0;
        }}
        .tip-section {{
            background-color: rgba(245, 158, 11, 0.1);
            border: 1px solid #92400e;
            border-radius: 8px;
            padding: 16px;
            margin: 24px 0;
            color: #fcd34d;
        }}
        .tip-label {{
            font-weight: 600;
            margin-bottom: 8px;
            color: #f59e0b;
        }}
        .footer {{
            padding: 24px;
            text-align: center;
            border-top: 1px solid #1f2937;
            font-size: 12px;
            color: #6b7280;
        }}
        .footer-link {{
            color: #34d399;
            text-decoration: none;
        }}
        .footer-link:hover {{
            text-decoration: underline;
        }}
        @media (max-width: 600px) {{
            .email-container {{
                width: 100%;
            }}
            .header {{
                padding: 24px 16px;
            }}
            .header-title {{
                font-size: 24px;
            }}
            .content {{
                padding: 24px 16px;
            }}
            .days-left {{
                font-size: 36px;
            }}
            .stat-cell {{
                display: block;
                width: 100% !important;
                margin-bottom: 12px;
                padding: 12px;
            }}
            .action-button {{
                width: 100%;
                box-sizing: border-box;
            }}
        }}
    </style>
</head>
<body>
    <div class="email-container">
        <!-- Header -->
        <div class="header">
            <h1 class="header-title">
                <span class="header-kira">Kira</span><span class="header-ai">-AI</span>
            </h1>
            <p style="margin: 8px 0 0 0; color: #9ca3af; font-size: 14px;">Your Spending Coach</p>
        </div>

        <!-- Content -->
        <div class="content">
            <!-- Status Section -->
            <div class="status-section">
                <div class="status-badge">{status_style['label']}</div>
                <div class="days-left">{days_left}</div>
                <div class="days-label">Days until you run out of money</div>
            </div>

            <!-- Stats Grid -->
            <table class="stats-grid">
                <tr>
                    <td class="stat-cell">
                        <div class="stat-label">Daily Burn Rate</div>
                        <div class="stat-value">₹{burn_rate:.2f}</div>
                    </td>
                    <td class="stat-cell">
                        <div class="stat-label">Suggested Cap</div>
                        <div class="stat-value">₹{suggested_cap:.0f}</div>
                    </td>
                </tr>
                <tr>
                    <td class="stat-cell">
                        <div class="stat-label">Top Category</div>
                        <div class="stat-value">{top_category}</div>
                    </td>
                    <td class="stat-cell">
                        <div class="stat-label">Confidence</div>
                        <div class="stat-value">{confidence_score:.0%}</div>
                    </td>
                </tr>
            </table>

            <!-- Narrative -->
            <div class="narrative">
                "{narrative}"
            </div>

            <!-- Action Button -->
            <div class="action-section">
                <a href="https://kira-ai.example.com" class="action-button">View Full Analysis</a>
            </div>

            <!-- Tip Section -->
            <div class="tip-section">
                <div class="tip-label">💡 Kira's Tip</div>
                <p style="margin: 0; font-size: 14px; line-height: 1.5;">
                    Try setting a daily spending limit for {top_category} to smooth out your burn rate. Even a 10% reduction could extend your runway by several days.
                </p>
            </div>
        </div>

        <!-- Footer -->
        <div class="footer">
            <p style="margin: 0 0 8px 0;">Sent by <strong>Kira-AI</strong></p>
            <p style="margin: 0; color: #4b5563;">
                Your intelligent spending coach • 
                <a href="https://kira-ai.example.com" class="footer-link">Dashboard</a>
            </p>
        </div>
    </div>
</body>
</html>
"""
    return html_content


def send_broke_date_warning(coach_state: dict[str, Any]) -> bool:
    """
    Send a warning email when the user is about to run out of money.

    Only sends if days_left <= 7 and email integration is enabled.

    Args:
        coach_state: Coach workflow state dict containing days_left, status, etc.

    Returns:
        True if sent successfully, False on failure
    """
    if not _is_enabled():
        return False

    days_left = coach_state.get("days_left", float("inf"))
    if days_left > 7:
        return False

    client = _get_resend_client()
    if not client:
        LOGGER.warning("Resend client not available for broke_date_warning")
        return False

    try:
        email_html = _build_email_html(coach_state)
        subject = f"⚠️ Kira: {days_left} days until you run out of money"

        response = client.emails.send(
            {
                "from": FROM_EMAIL,
                "to": TO_EMAIL,
                "subject": subject,
                "html": email_html,
            }
        )

        LOGGER.info(
            "Broke date warning email sent: days_left=%s, email_id=%s",
            days_left,
            response.get("id", "unknown"),
        )
        return True

    except Exception as exc:
        LOGGER.error(
            f"Failed to send broke_date_warning email: {exc}",
            exc_info=True,
        )
        return False


def send_weekly_summary(session_stats: dict[str, Any]) -> bool:
    """
    Send a weekly summary email with coaching insights.

    Args:
        session_stats: Session statistics dict with spending data

    Returns:
        True if sent successfully, False on failure
    """
    if not _is_enabled():
        return False

    client = _get_resend_client()
    if not client:
        LOGGER.warning("Resend client not available for weekly_summary")
        return False

    try:
        # Convert session_stats to coach_state format for HTML template
        coach_state = {
            "status": session_stats.get("status", "stable"),
            "days_left": session_stats.get("days_left", "N/A"),
            "top_category": session_stats.get("top_category", "Unknown"),
            "narrative": session_stats.get("summary", ""),
            "suggested_cap": session_stats.get("suggested_cap", 0),
            "burn_rate_daily": session_stats.get("avg_daily_burn", 0.0),
            "confidence_score": session_stats.get("accuracy", 0.0),
        }

        email_html = _build_email_html(coach_state)
        subject = "📊 Your Kira weekly coaching summary"

        response = client.emails.send(
            {
                "from": FROM_EMAIL,
                "to": TO_EMAIL,
                "subject": subject,
                "html": email_html,
            }
        )

        LOGGER.info(
            "Weekly summary email sent: email_id=%s",
            response.get("id", "unknown"),
        )
        return True

    except Exception as exc:
        LOGGER.error(
            f"Failed to send weekly_summary email: {exc}",
            exc_info=True,
        )
        return False


def queue_email_notification(
    background_tasks: BackgroundTasks, coach_state: dict[str, Any]
) -> None:
    """
    Queue an email notification to be sent in the background.

    Adds the broke_date_warning email task to FastAPI BackgroundTasks
    if the coach status warrants an alert. Non-blocking.

    Args:
        background_tasks: FastAPI BackgroundTasks instance
        coach_state: Coach workflow state dict
    """
    if not _is_enabled():
        return

    days_left = coach_state.get("days_left", float("inf"))
    if days_left <= 7:
        background_tasks.add_task(send_broke_date_warning, coach_state)
        LOGGER.debug(
            "Queued broke_date_warning email in background tasks (days_left=%s)",
            days_left,
        )