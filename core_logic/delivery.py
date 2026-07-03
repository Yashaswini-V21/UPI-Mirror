from __future__ import annotations

import os
from urllib.parse import quote

from core_logic.coach_agent import SpendingCoachResult


def _clean_phone_number(value: str) -> str:
    return "".join(ch for ch in value if ch.isdigit())


def build_coach_delivery_message(coach_result: SpendingCoachResult) -> str:
    limit_line = (
        f"Suggested {coach_result.limit_window} cap: Rs. {coach_result.suggested_limit:,.0f}"
        if coach_result.suggested_limit > 0
        else "Suggested cap: Track only"
    )
    return (
        f"Kira-AI - {coach_result.title}\n"
        f"Status: {coach_result.status.title()}\n"
        f"{limit_line}\n\n"
        f"Nudge:\n{coach_result.nudge}\n\n"
        "Shared from Kira-AI Coach."
    )


def build_whatsapp_url(message: str, phone_number: str | None = None) -> str:
    encoded = quote(message)
    if phone_number:
        cleaned = _clean_phone_number(phone_number)
        if cleaned:
            return f"https://wa.me/{cleaned}?text={encoded}"
    return f"https://wa.me/?text={encoded}"


def build_mailto_url(subject: str, body: str, recipient_email: str | None = None) -> str:
    recipient = (recipient_email or "").strip()
    return f"mailto:{recipient}?subject={quote(subject)}&body={quote(body)}"


def default_delivery_targets() -> tuple[str, str]:
    email = os.getenv("COACH_EMAIL_TO", "").strip()
    whatsapp = os.getenv("COACH_WHATSAPP_NUMBER", "").strip()
    return email, whatsapp
