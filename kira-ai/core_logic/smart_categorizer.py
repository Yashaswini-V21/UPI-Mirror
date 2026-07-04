"""src/smart_categorizer.py
=========================
Kira-AI Gemini-powered smart transaction categorizer.

Classifies ambiguous or uncategorized merchant names into spending categories
using the Gemini API, with circuit-breaker protection and regex fallback.

Usage:
    from core_logic.smart_categorizer import categorize_transactions
    df = categorize_transactions(df)  # fills missing/unknown categories

Categories follow the Kira standard taxonomy:
  Food, Transit, Subscriptions, Shopping, Entertainment, Essentials,
  Utilities, Health, Education, Travel, Transfers, Other
"""

from __future__ import annotations

import logging
import os
import re
from typing import Any

LOGGER = logging.getLogger(__name__)

# ── Kira standard category taxonomy ──────────────────────────────────────────
KIRA_CATEGORIES = [
    "Food", "Transit", "Subscriptions", "Shopping", "Entertainment",
    "Essentials", "Utilities", "Health", "Education", "Travel",
    "Transfers", "Other",
]

# ── Regex-based fallback categorizer ─────────────────────────────────────────
_MERCHANT_PATTERNS: list[tuple[re.Pattern[str], str]] = [
    (re.compile(r"swiggy|zomato|domin|pizza|food|burger|cafe|restaurant|biryani|chai|tea|starbucks|mcdonald|kfc|dunkin", re.I), "Food"),
    (re.compile(r"uber|ola|rapido|metro|bus|train|irctc|redbus|cab|auto|lyft|grab|transit", re.I), "Transit"),
    (re.compile(r"netflix|spotify|prime|hotstar|disney|youtube|apple\.com|google\s*play|subscription|jio\s*cinema|zee5|audible", re.I), "Subscriptions"),
    (re.compile(r"amazon|flipkart|myntra|ajio|meesho|shopee|ebay|alibaba|nykaa|tata\s*cliq|croma|reliance\s*digital", re.I), "Shopping"),
    (re.compile(r"bookmyshow|pvr|inox|game|steam|playstation|xbox|cinema|ticket|event|concert", re.I), "Entertainment"),
    (re.compile(r"bigbasket|blinkit|zepto|dmart|more|grofers|grocery|supermarket|milk|vegetable|kirana|ration", re.I), "Essentials"),
    (re.compile(r"electric|water|gas|broadband|airtel|jio|vodafone|bsnl|tata\s*power|adani|bill\s*pay|recharge|postpaid|prepaid", re.I), "Utilities"),
    (re.compile(r"apollo|pharma|medic|hospital|doctor|clinic|1mg|netmeds|pharmeasy|health|dental|lab|diagnostic|eye", re.I), "Health"),
    (re.compile(r"school|college|udemy|coursera|tuition|book|education|unacademy|byjus|upgrad|simplilearn", re.I), "Education"),
    (re.compile(r"hotel|booking\.com|makemytrip|goibibo|cleartrip|flight|air\s*india|indigo|spicejet|resort|airbnb|oyo", re.I), "Travel"),
    (re.compile(r"transfer|neft|imps|upi|rtgs|gpay|paytm|phonepe|sent\s*to|received|self\s*transfer|atm|withdraw", re.I), "Transfers"),
]


def _regex_categorize(merchant: str) -> str:
    """Attempt to categorize a merchant name using regex patterns.

    Args:
        merchant: The raw merchant or description string.

    Returns:
        Matched category or ``"Other"`` if no pattern matches.
    """
    if not merchant or not merchant.strip():
        return "Other"

    for pattern, category in _MERCHANT_PATTERNS:
        if pattern.search(merchant):
            return category
    return "Other"


def _batch_categorize_gemini(merchants: list[str]) -> dict[str, str]:
    """Use Gemini to categorize a batch of unknown merchants.

    Protected by the Kira circuit breaker. Falls back gracefully on any error.

    Args:
        merchants: List of merchant name strings to classify.

    Returns:
        Dict mapping merchant names to categories. May be partial on error.
    """
    try:
        import google.generativeai as genai
    except ImportError:
        LOGGER.debug("google-generativeai not installed; skipping Gemini categorization")
        return {}

    api_key = (os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY") or "").strip()
    if not api_key:
        return {}

    try:
        from core_logic.resilience import gemini_breaker, CircuitBreakerError
    except ImportError:
        gemini_breaker = None
        CircuitBreakerError = Exception

    categories_str = ", ".join(KIRA_CATEGORIES)
    merchant_list = "\n".join(f"- {m}" for m in merchants[:50])  # Cap at 50 per batch

    prompt = (
        f"Classify each merchant into exactly one of these categories: {categories_str}\n\n"
        f"Merchants:\n{merchant_list}\n\n"
        "Return ONLY a JSON object mapping each merchant to its category. "
        "Example: {\"Swiggy\": \"Food\", \"Uber\": \"Transit\"}\n"
        "Do not wrap in markdown fences. Use exact merchant names as keys."
    )

    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel("gemini-2.0-flash")

        if gemini_breaker is not None:
            response = gemini_breaker.call(
                model.generate_content, prompt,
                generation_config={"temperature": 0.1, "max_output_tokens": 1000},
            )
        else:
            response = model.generate_content(
                prompt,
                generation_config={"temperature": 0.1, "max_output_tokens": 1000},
            )

        text = getattr(response, "text", "").strip()
        # Strip markdown fences if present
        if text.startswith("```"):
            text = re.sub(r"^```(?:json)?\s*", "", text, flags=re.I)
            text = re.sub(r"\s*```$", "", text)

        import json
        result = json.loads(text)
        if isinstance(result, dict):
            # Validate categories
            return {
                k: v for k, v in result.items()
                if isinstance(v, str) and v in KIRA_CATEGORIES
            }
    except CircuitBreakerError:
        LOGGER.warning("Circuit breaker open; skipping Gemini categorization")
    except Exception as exc:
        LOGGER.warning("Gemini categorization failed: %s", exc)

    return {}


def categorize_merchant(merchant: str) -> str:
    """Categorize a single merchant string using regex patterns.

    For bulk/AI-powered categorization, use :func:`categorize_transactions`.

    Args:
        merchant: Raw merchant or description string.

    Returns:
        Category string from the Kira taxonomy.
    """
    return _regex_categorize(merchant)


def categorize_transactions(
    df: Any,
    merchant_column: str = "merchant",
    category_column: str = "category",
    use_gemini: bool = True,
) -> Any:
    """Fill missing or 'Other' categories in a transaction DataFrame.

    Strategy:
      1. Apply regex-based categorization to all uncategorized rows.
      2. For remaining 'Other' rows, batch-query Gemini for AI classification.

    Args:
        df:              Transaction DataFrame.
        merchant_column: Column name containing merchant/description text.
        category_column: Column name for the category (created if absent).
        use_gemini:      Whether to attempt Gemini classification for unknowns.

    Returns:
        The DataFrame with the category column populated.
    """
    import pandas as pd

    if merchant_column not in df.columns:
        LOGGER.debug("No '%s' column found; skipping smart categorization", merchant_column)
        return df

    frame = df.copy()

    # Ensure category column exists
    if category_column not in frame.columns:
        frame[category_column] = "Other"

    # Step 1: Regex categorization for empty/Other categories
    needs_category = (
        frame[category_column].isna()
        | (frame[category_column].astype(str).str.strip() == "")
        | (frame[category_column].astype(str) == "Other")
    )

    if needs_category.any():
        frame.loc[needs_category, category_column] = (
            frame.loc[needs_category, merchant_column]
            .astype(str)
            .apply(_regex_categorize)
        )

    # Step 2: Gemini for remaining unknowns
    if use_gemini:
        still_other = frame[category_column].astype(str) == "Other"
        if still_other.any():
            unknown_merchants = (
                frame.loc[still_other, merchant_column]
                .astype(str)
                .unique()
                .tolist()
            )
            if unknown_merchants:
                gemini_results = _batch_categorize_gemini(unknown_merchants)
                if gemini_results:
                    merchant_to_category = {m.lower(): c for m, c in gemini_results.items()}
                    frame.loc[still_other, category_column] = (
                        frame.loc[still_other, merchant_column]
                        .astype(str)
                        .apply(lambda m: merchant_to_category.get(m.lower(), "Other"))
                    )
                    categorized_count = sum(1 for c in gemini_results.values() if c != "Other")
                    LOGGER.info(
                        "Gemini categorized %d/%d unknown merchants",
                        categorized_count,
                        len(unknown_merchants),
                    )

    return frame
