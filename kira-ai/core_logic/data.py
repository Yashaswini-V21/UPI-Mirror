from __future__ import annotations

import numpy as np
from datetime import datetime, timedelta
from io import BytesIO, StringIO

import pandas as pd


EXPECTED_COLUMNS = ["datetime", "amount", "category", "merchant"]
OPTIONAL_COLUMNS = ["regret"]


def _build_sample_transactions() -> pd.DataFrame:
    rng = np.random.default_rng(21)
    end_date = datetime.now().replace(hour=20, minute=0, second=0, microsecond=0)
    start_date = end_date - timedelta(days=89)

    # base_regret: typical regret (1-5) for this category — used to generate realistic demo scores
    category_profiles = [
        {
            "category": "Food Delivery",
            "merchants": ["Zomato", "Swiggy"],
            "amount_range": (180, 420),
            "hours": [12, 13, 20, 21, 22, 23],
            "weight": 0.30,
            "base_regret": 4,
        },
        {
            "category": "Cafe",
            "merchants": ["Starbucks", "Third Wave Coffee", "Blue Tokai"],
            "amount_range": (120, 280),
            "hours": [9, 10, 11, 16, 17, 18],
            "weight": 0.12,
            "base_regret": 2,
        },
        {
            "category": "Groceries",
            "merchants": ["Blinkit", "Instamart", "DMart Ready"],
            "amount_range": (250, 980),
            "hours": [10, 11, 18, 19, 20],
            "weight": 0.18,
            "base_regret": 1,
        },
        {
            "category": "Commute",
            "merchants": ["Uber", "Rapido", "Metro Card"],
            "amount_range": (80, 320),
            "hours": [8, 9, 18, 19, 21],
            "weight": 0.15,
            "base_regret": 2,
        },
        {
            "category": "Shopping",
            "merchants": ["Myntra", "Amazon", "Nykaa"],
            "amount_range": (350, 1800),
            "hours": [14, 15, 19, 20, 22],
            "weight": 0.10,
            "base_regret": 3,
        },
        {
            "category": "Entertainment",
            "merchants": ["BookMyShow", "Spotify", "Netflix"],
            "amount_range": (99, 799),
            "hours": [18, 19, 20, 21, 22],
            "weight": 0.08,
            "base_regret": 2,
        },
        {
            "category": "Bills",
            "merchants": ["Jio", "Airtel", "Electricity Board"],
            "amount_range": (299, 1450),
            "hours": [9, 10, 11],
            "weight": 0.07,
            "base_regret": 1,
        },
    ]

    categories = [profile["category"] for profile in category_profiles]
    weights = [profile["weight"] for profile in category_profiles]
    profile_lookup = {profile["category"]: profile for profile in category_profiles}

    rows: list[dict[str, object]] = []
    current = start_date
    while current <= end_date:
        transaction_count = int(rng.choice([1, 2, 3, 4], p=[0.2, 0.35, 0.3, 0.15]))
        if current.weekday() in (4, 5):
            transaction_count += 1

        for _ in range(transaction_count):
            category = str(rng.choice(categories, p=weights))
            profile = profile_lookup[category]
            hour = int(rng.choice(profile["hours"]))
            minute = int(rng.choice([0, 5, 10, 15, 20, 30, 35, 40, 45, 50]))
            amount = int(rng.integers(profile["amount_range"][0], profile["amount_range"][1] + 1))

            if category == "Food Delivery" and current.day in (1, 7, 14, 21, 28):
                amount += int(rng.integers(100, 280 + 1))
            if category == "Shopping" and current.day > 24:
                amount += int(rng.integers(150, 500 + 1))

            # regret is higher late at night and when amount is outsized
            base_regret = int(profile["base_regret"])
            regret_bump = 1 if hour >= 22 else 0
            regret_bump += 1 if amount > (profile["amount_range"][1] * 0.8) else 0
            raw_regret = base_regret + regret_bump + int(rng.choice([-1, 0, 0, 1]))
            regret = min(max(raw_regret, 1), 5)

            rows.append(
                {
                    "datetime": current.replace(hour=hour, minute=minute),
                    "amount": float(amount),
                    "category": category,
                    "merchant": str(rng.choice(profile["merchants"])),
                    "regret": regret,
                }
            )

        current += timedelta(days=1)

    frame = pd.DataFrame(rows).sort_values("datetime").reset_index(drop=True)
    return frame


def load_transactions(uploaded_file) -> pd.DataFrame:
    if uploaded_file is None:
        return _build_sample_transactions()

    raw = uploaded_file.getvalue()
    if isinstance(raw, bytes):
        try:
            buffer = StringIO(raw.decode("utf-8"))
        except UnicodeDecodeError:
            buffer = BytesIO(raw)
    else:
        buffer = StringIO(str(raw))

    frame = pd.read_csv(buffer)
    missing = [column for column in EXPECTED_COLUMNS if column not in frame.columns]
    if missing:
        raise ValueError(
            "CSV is missing columns: " + ", ".join(missing) + ". Expected columns are: " + ", ".join(EXPECTED_COLUMNS)
        )

    frame = frame.copy()
    frame["datetime"] = pd.to_datetime(frame["datetime"])
    frame["amount"] = pd.to_numeric(frame["amount"], errors="coerce")
    frame["category"] = frame["category"].astype(str).str.strip()
    frame["merchant"] = frame["merchant"].astype(str).str.strip()
    frame = frame.dropna(subset=["datetime", "amount", "category", "merchant"])
    frame = frame[(frame["category"] != "") & (frame["merchant"] != "")]
    if frame.empty:
        raise ValueError(
            "CSV has no valid rows after cleaning. Ensure datetime, amount, category, and merchant are populated."
        )
    if "regret" in frame.columns:
        frame["regret"] = pd.to_numeric(frame["regret"], errors="coerce").clip(1, 5)
    frame = frame.sort_values("datetime").reset_index(drop=True)
    return frame
