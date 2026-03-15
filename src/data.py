from __future__ import annotations

import random
from datetime import datetime, timedelta
from io import BytesIO, StringIO

import pandas as pd


EXPECTED_COLUMNS = ["datetime", "amount", "category", "merchant"]


def _build_sample_transactions() -> pd.DataFrame:
    rng = random.Random(21)
    end_date = datetime.now().replace(hour=20, minute=0, second=0, microsecond=0)
    start_date = end_date - timedelta(days=89)

    category_profiles = [
        {
            "category": "Food Delivery",
            "merchants": ["Zomato", "Swiggy"],
            "amount_range": (180, 420),
            "hours": [12, 13, 20, 21, 22, 23],
            "weight": 0.30,
        },
        {
            "category": "Cafe",
            "merchants": ["Starbucks", "Third Wave Coffee", "Blue Tokai"],
            "amount_range": (120, 280),
            "hours": [9, 10, 11, 16, 17, 18],
            "weight": 0.12,
        },
        {
            "category": "Groceries",
            "merchants": ["Blinkit", "Instamart", "DMart Ready"],
            "amount_range": (250, 980),
            "hours": [10, 11, 18, 19, 20],
            "weight": 0.18,
        },
        {
            "category": "Commute",
            "merchants": ["Uber", "Rapido", "Metro Card"],
            "amount_range": (80, 320),
            "hours": [8, 9, 18, 19, 21],
            "weight": 0.15,
        },
        {
            "category": "Shopping",
            "merchants": ["Myntra", "Amazon", "Nykaa"],
            "amount_range": (350, 1800),
            "hours": [14, 15, 19, 20, 22],
            "weight": 0.10,
        },
        {
            "category": "Entertainment",
            "merchants": ["BookMyShow", "Spotify", "Netflix"],
            "amount_range": (99, 799),
            "hours": [18, 19, 20, 21, 22],
            "weight": 0.08,
        },
        {
            "category": "Bills",
            "merchants": ["Jio", "Airtel", "Electricity Board"],
            "amount_range": (299, 1450),
            "hours": [9, 10, 11],
            "weight": 0.07,
        },
    ]

    categories = [profile["category"] for profile in category_profiles]
    weights = [profile["weight"] for profile in category_profiles]
    profile_lookup = {profile["category"]: profile for profile in category_profiles}

    rows: list[dict[str, object]] = []
    current = start_date
    while current <= end_date:
        transaction_count = rng.choices([1, 2, 3, 4], weights=[0.2, 0.35, 0.3, 0.15], k=1)[0]
        if current.weekday() in (4, 5):
            transaction_count += 1

        for _ in range(transaction_count):
            category = rng.choices(categories, weights=weights, k=1)[0]
            profile = profile_lookup[category]
            hour = rng.choice(profile["hours"])
            minute = rng.choice([0, 5, 10, 15, 20, 30, 35, 40, 45, 50])
            amount = rng.randint(*profile["amount_range"])

            if category == "Food Delivery" and current.day in (1, 7, 14, 21, 28):
                amount += rng.randint(100, 280)
            if category == "Shopping" and current.day > 24:
                amount += rng.randint(150, 500)

            rows.append(
                {
                    "datetime": current.replace(hour=hour, minute=minute),
                    "amount": float(amount),
                    "category": category,
                    "merchant": rng.choice(profile["merchants"]),
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
    frame = frame.dropna(subset=["datetime", "amount", "category", "merchant"])
    frame = frame.sort_values("datetime").reset_index(drop=True)
    return frame
