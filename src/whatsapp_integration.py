"""WhatsApp integration for Kira-AI with two modes: wa.me links and optional Twilio.

Environment variables:
  - TWILIO_ACCOUNT_SID: Twilio account ID (optional, for Mode B)
  - TWILIO_AUTH_TOKEN: Twilio auth token (optional, for Mode B)
  - TWILIO_WHATSAPP_FROM: Twilio WhatsApp sandbox number (default: +14155238886)
  - TWILIO_WHATSAPP_TO: Default recipient number for Twilio (optional)

Mode A (Always Available):
  - generate_whatsapp_link() returns a wa.me deep-link
  - Works without any setup or API keys
  - Frontend button opens link in new tab

Mode B (Optional):
  - send_whatsapp_message() sends via Twilio API
  - Requires TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN
  - Free sandbox mode available
"""

from __future__ import annotations

import logging
import os
from typing import Any
from urllib.parse import quote

try:
    from twilio.rest import Client
except ImportError:
    Client = None

LOGGER = logging.getLogger(__name__)

# Environment configuration
TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID", "").strip()
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN", "").strip()
TWILIO_WHATSAPP_FROM = os.getenv("TWILIO_WHATSAPP_FROM", "+14155238886").strip()
TWILIO_WHATSAPP_TO = os.getenv("TWILIO_WHATSAPP_TO", "").strip()

# Twilio sandbox number (always available for free testing)
TWILIO_SANDBOX_NUMBER = "+14155238886"


def _is_twilio_enabled() -> bool:
    """Check if Twilio WhatsApp integration is enabled."""
    return bool(TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN and Client is not None)


def _build_coach_message(coach_state: dict[str, Any]) -> str:
    """
    Build the WhatsApp message from coach state.

    Format:
    🤖 *Kira-AI Coach*

    Status: {STATUS}
    Days left: {days_left} days

    {nudge}

    Suggested cap: ₹{suggested_cap:,.0f}/week on {top_category}

    ─────────────────
    Powered by Kira-AI

    Args:
        coach_state: Coach workflow state dict

    Returns:
        Formatted message string for WhatsApp
    """
    status = coach_state.get("status", "stable").title()
    days_left = coach_state.get("days_left", "N/A")
    nudge = coach_state.get("nudge", "Keep your spending steady.")
    suggested_cap = coach_state.get("suggested_cap", 0)
    top_category = coach_state.get("top_category", "Unknown")

    message = (
        f"🤖 *Kira-AI Coach*\n\n"
        f"Status: {status}\n"
        f"Days left: {days_left} days\n\n"
        f"{nudge}\n\n"
        f"Suggested cap: ₹{suggested_cap:,.0f}/week on {top_category}\n\n"
        f"─────────────────\n"
        f"Powered by Kira-AI"
    )
    return message


def generate_whatsapp_link(coach_state: dict[str, Any]) -> str:
    """
    Generate a wa.me deep-link for WhatsApp sharing (Mode A).

    Works without any API keys or setup. Frontend can render as a button
    that opens the link in a new tab, pre-filling the message.

    Args:
        coach_state: Coach workflow state dict

    Returns:
        wa.me URL with URL-encoded message
    """
    message = _build_coach_message(coach_state)
    encoded_message = quote(message)
    return f"https://wa.me/?text={encoded_message}"


def send_whatsapp_message(to_number: str, coach_state: dict[str, Any]) -> bool:
    """
    Send a WhatsApp message via Twilio API (Mode B).

    Only sends if Twilio is properly configured. Gracefully fails if not.

    Args:
        to_number: Recipient phone number in E.164 format (e.g., "+919876543210")
        coach_state: Coach workflow state dict

    Returns:
        True if sent successfully, False on any failure
    """
    if not _is_twilio_enabled():
        LOGGER.debug("Twilio not enabled, skipping WhatsApp send")
        return False

    if not to_number or not to_number.startswith("+"):
        LOGGER.warning(f"Invalid to_number format: {to_number}")
        return False

    try:
        client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
        message_body = _build_coach_message(coach_state)

        response = client.messages.create(
            from_=f"whatsapp:{TWILIO_WHATSAPP_FROM}",
            to=f"whatsapp:{to_number}",
            body=message_body,
        )

        LOGGER.info(
            "WhatsApp message sent via Twilio: to=%s, sid=%s",
            to_number,
            response.sid,
        )
        return True

    except Exception as exc:
        LOGGER.error(
            f"Failed to send WhatsApp message via Twilio to {to_number}: {exc}",
            exc_info=True,
        )
        return False


def get_whatsapp_config() -> dict[str, Any]:
    """
    Get the current WhatsApp integration configuration.

    Returns dict with:
      - mode: "twilio" (both modes available) or "link_only" (Mode A only)
      - sandbox_number: Twilio sandbox number (+14155238886)
      - link_available: True (always available)
      - twilio_enabled: Boolean indicating Twilio Mode B availability

    Returns:
        Configuration dict
    """
    twilio_enabled = _is_twilio_enabled()
    mode = "twilio" if twilio_enabled else "link_only"

    return {
        "mode": mode,
        "sandbox_number": TWILIO_SANDBOX_NUMBER,
        "link_available": True,
        "twilio_enabled": twilio_enabled,
    }