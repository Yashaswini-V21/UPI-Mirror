from __future__ import annotations

import re
from datetime import datetime
from io import BytesIO

import pandas as pd

try:
    from PyPDF2 import PdfReader
    PDF_AVAILABLE = True
except ImportError:
    PDF_AVAILABLE = False


def parse_upi_pdf(file_bytes: bytes) -> pd.DataFrame:
    """
    Parse UPI transaction history from a PDF statement.
    
    Supports common formats from Google Pay, Paytm, PhonePe statements.
    Expected patterns: date, merchant/receiver, amount, status.
    
    Returns a DataFrame with normalized columns: datetime, amount, category, merchant.
    """
    if not PDF_AVAILABLE:
        raise ImportError("PyPDF2 is required for PDF parsing. Install with: pip install PyPDF2")
    
    try:
        reader = PdfReader(BytesIO(file_bytes))
        text = ""
        for page in reader.pages:
            text += page.extract_text()
    except Exception as exc:
        raise ValueError(f"Failed to read PDF: {exc}")
    
    transactions = _extract_transactions_from_text(text)
    if not transactions:
        raise ValueError(
            "No transactions found in PDF. Ensure it is a valid UPI statement "
            "with date, amount, and merchant columns."
        )
    
    df = pd.DataFrame(transactions)
    df["datetime"] = pd.to_datetime(df["datetime"], errors="coerce")
    df["amount"] = pd.to_numeric(df["amount"], errors="coerce")
    df = df.dropna(subset=["datetime", "amount"])
    
    if "category" not in df.columns:
        df["category"] = df["merchant"].apply(_infer_category)
    if "merchant" not in df.columns:
        df["merchant"] = "Unknown"
    
    return df[["datetime", "amount", "category", "merchant"]].reset_index(drop=True)


def _extract_transactions_from_text(text: str) -> list[dict[str, str]]:
    """
    Regex-based extraction of transaction rows from PDF text.
    Handles common UPI statement formats.
    """
    transactions = []
    
    date_patterns = [
        r"(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})",
        r"(\d{4}[-/]\d{1,2}[-/]\d{1,2})",
    ]
    amount_pattern = r"₹\s*([\d,]+(?:\.\d{2})?)"
    
    lines = text.split("\n")
    for line in lines:
        if not line.strip():
            continue
        
        date_match = None
        for pattern in date_patterns:
            date_match = re.search(pattern, line)
            if date_match:
                break
        
        amount_match = re.search(amount_pattern, line)
        
        if date_match and amount_match:
            date_str = date_match.group(1)
            amount_str = amount_match.group(1).replace(",", "")
            
            merchant = _extract_merchant_name(line)
            
            transactions.append({
                "datetime": date_str,
                "amount": amount_str,
                "merchant": merchant,
            })
    
    return transactions


def _extract_merchant_name(line: str) -> str:
    """Extract merchant/receiver name from transaction line."""
    parts = line.split()
    
    for i, part in enumerate(parts):
        if "₹" in part or part in ("sent", "received", "paid", "transfer", "to", "from"):
            if i > 0:
                return parts[i - 1].strip(".,;:")
    
    words = [p for p in parts if len(p) > 2 and not any(c.isdigit() for c in p)]
    return words[0] if words else "Unknown"


def _infer_category(merchant: str) -> str:
    """Simple heuristic category inference based on merchant name."""
    merchant_lower = merchant.lower()
    
    mappings = {
        "food delivery": ["swiggy", "zomato", "ubereats", "foodpanda"],
        "cafe": ["starbucks", "coffee", "cafe", "brew"],
        "groceries": ["blinkit", "instamart", "dmart", "bigbasket", "grocery"],
        "commute": ["uber", "rapido", "ola", "auto", "taxi"],
        "shopping": ["amazon", "flipkart", "myntra", "nykaa", "mall"],
        "entertainment": ["netflix", "spotify", "bookmyshow", "cinema"],
        "bills": ["jio", "airtel", "vodafone", "electricity", "water"],
    }
    
    for category, keywords in mappings.items():
        if any(kw in merchant_lower for kw in keywords):
            return category
    
    return "Essentials"
