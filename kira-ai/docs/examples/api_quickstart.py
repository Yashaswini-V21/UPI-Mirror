#!/usr/bin/env python3
"""docs/examples/api_quickstart.py
=================================
Kira-AI API Quickstart Example.

This script demonstrates how to interact with the Kira-AI FastAPI endpoints
using Python's `requests` library. It covers the full lifecycle:
  1. Health check & Integration check
  2. statement upload (CSV/PDF)
  3. Coaching pipeline execution
  4. Nudge feedback loop
  5. What-if scenario simulation
  6. PII-masked CSV export
"""

import os
import sys
import time
import requests

API_URL = os.getenv("KIRA_API_URL", "http://localhost:8000")
API_KEY = os.getenv("KIRA_AI_API_KEY", "your-super-secret-kira-api-key-here")

# Ensure requests library is installed
try:
    import requests
except ImportError:
    print("Error: The 'requests' library is required to run this script.")
    print("Please install it via: pip install requests")
    sys.exit(1)


def get_headers():
    return {
        "Authorization": f"Bearer {API_KEY}"
    }


def check_health():
    print(f"\n--- Checking Health at {API_URL} ---")
    response = requests.get(f"{API_URL}/health")
    if response.status_code == 200:
        print("Success: API Health Check passed.")
        print(response.json())
    else:
        print(f"Error: API Health Check failed with status {response.status_code}.")
        sys.exit(1)


def upload_statement(csv_data: str, filename: str = "statement.csv"):
    print(f"\n--- Uploading {filename} ---")
    files = {
        "file": (filename, csv_data, "text/csv")
    }
    
    # We pass the auth bearer token
    response = requests.post(
        f"{API_URL}/upload",
        files=files,
        headers=get_headers()
    )
    
    if response.status_code == 200:
        res_json = response.json()
        print("Success: Uploaded statement successfully.")
        print(f"Upload ID: {res_json.get('upload_id')}")
        print(f"Total Rows: {res_json.get('rows')}")
        print(f"Categories Found: {res_json.get('categories')}")
        return res_json.get("upload_id")
    else:
        print(f"Error: Upload failed. Status: {response.status_code}, Body: {response.text}")
        sys.exit(1)


def get_coach_nudge(upload_id: str, budget: float = 15000.0):
    print(f"\n--- Fetching Coaching Insight (Budget: ₹{budget:,}) ---")
    
    # The endpoint accepts upload_id and budget as query params
    response = requests.post(
        f"{API_URL}/coach",
        params={"upload_id": upload_id, "budget": budget},
        headers=get_headers()
    )
    
    if response.status_code == 200:
        res_json = response.json()
        print("Success: Received Coach recommendations.")
        print(f"Status: {res_json.get('status').upper()}")
        print(f"Suggested Cap: ₹{res_json.get('suggested_cap')}")
        print(f"Confidence: {res_json.get('confidence_score') * 100:.1f}%")
        print(f"Daily Burn: ₹{res_json.get('signals', {}).get('burn_rate_daily', 0):.2f}/day")
        print(f"Nudge: \"{res_json.get('nudge')}\"")
        print(f"Gemini Narrative:\n{res_json.get('narrative')}")
        return res_json
    else:
        print(f"Error: Coaching request failed. Status: {response.status_code}, Body: {response.text}")
        sys.exit(1)


def submit_feedback(upload_id: str, accepted: bool):
    print(f"\n--- Submitting Feedback (Accepted: {accepted}) ---")
    payload = {
        "upload_id": upload_id,
        "accepted": accepted
    }
    
    response = requests.post(
        f"{API_URL}/feedback",
        json=payload,
        headers=get_headers()
    )
    
    if response.status_code == 200:
        print("Success: Feedback recorded.")
        print(response.json())
    else:
        print(f"Error: Failed to record feedback. Status: {response.status_code}, Body: {response.text}")


def simulate_scenario(upload_id: str, budget: float, cut_percent: float, category: str):
    print(f"\n--- Simulating What-If Budget Cut ({cut_percent}% off {category}) ---")
    payload = {
        "upload_id": upload_id,
        "budget": budget,
        "cutback_pct": cut_percent,
        "cutback_category": category,
        "scenario_label": f"Trim {category} by {cut_percent}%"
    }
    
    response = requests.post(
        f"{API_URL}/scenarios",
        json=payload,
        headers=get_headers()
    )
    
    if response.status_code == 200:
        res_json = response.json()
        print("Success: Scenario simulated.")
        print(f"Original Days Left: {res_json.get('original_days_left')} days")
        print(f"New Days Left: {res_json.get('new_days_left')} days")
        print(f"Days Gained: {res_json.get('days_gained')} days!")
        print(f"Estimated Savings: ₹{res_json.get('new_monthly_savings'):,}")
        return res_json
    else:
        print(f"Error: Scenario simulation failed. Status: {response.status_code}, Body: {response.text}")


def export_masked_csv(upload_id: str):
    print(f"\n--- Exporting PII-Masked Ledger ---")
    
    response = requests.get(
        f"{API_URL}/export/csv",
        params={"upload_id": upload_id},
        headers=get_headers()
    )
    
    if response.status_code == 200:
        print("Success: Masked CSV retrieved.")
        csv_text = response.text
        # Print first few lines of the CSV
        lines = csv_text.splitlines()[:5]
        print("\n".join(lines))
        print("...")
    else:
        print(f"Error: Masked CSV export failed. Status: {response.status_code}, Body: {response.text}")


def main():
    print("==================================================")
    print("              Kira-AI Client Launcher             ")
    print("==================================================")
    
    # 1. Health check
    check_health()
    
    # Create sample CSV string
    sample_csv = (
        "datetime,amount,category,merchant\n"
        f"2026-06-01 09:30:00,150.0,Food,Local Tea Stall\n"
        f"2026-06-02 12:45:00,450.0,Food,Lunch Dhaba\n"
        f"2026-06-03 22:15:00,850.0,Food,Swiggy Delivery\n"
        f"2026-06-04 18:30:00,280.0,Transit,Uber Ride\n"
        f"2026-06-05 22:50:00,990.0,Food,Zomato Late Night\n"
        f"2026-06-06 14:00:00,2400.0,Shopping,Amazon Retail\n"
        f"2026-06-07 23:05:00,1200.0,Food,Late Swiggy Dinner\n"
    )
    
    # 2. Upload statement
    upload_id = upload_statement(sample_csv)
    
    # 3. Get coach narrative & nudge (linear regression + LangGraph pipeline)
    get_coach_nudge(upload_id, budget=10000.0)
    
    # 4. Accept the nudge (feedback mechanism for reinforcement scoring)
    submit_feedback(upload_id, accepted=True)
    
    # 5. Simulate what-if scenario (reducing Swiggy / Food)
    simulate_scenario(upload_id, budget=10000.0, cut_percent=40.0, category="Food")
    
    # 6. Export PII-masked CSV (de-identifies account detail and hashes merchants)
    export_masked_csv(upload_id)


if __name__ == "__main__":
    # Make sure to run your FastAPI dev server first!
    # e.g.: uvicorn api.main:app --reload --port 8000
    main()
