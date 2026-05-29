"""
Test suite for Kira-AI FastAPI endpoints.

Uses TestClient for integration tests of all major API paths.
Environment configured at module level before app import.
"""

import os

import pytest
from fastapi.testclient import TestClient

# ════════════════════════════════════════════════════════════════════════════════
# Environment Setup (before app import)
# ════════════════════════════════════════════════════════════════════════════════

os.environ["KIRA_AI_API_KEY"] = "test-kira-ci-key-abc123"
os.environ["KIRA_AI_API_TOKEN"] = "test-kira-ci-key-abc123"
os.environ["API_KEY"] = "test-kira-ci-key-abc123"
os.environ["GEMINI_API_KEY"] = ""
os.environ["GITLAB_TOKEN"] = ""
os.environ["GITLAB_PROJECT_ID"] = ""

# Import app AFTER env setup
from api.main import app


# ════════════════════════════════════════════════════════════════════════════════
# Fixtures
# ════════════════════════════════════════════════════════════════════════════════


@pytest.fixture(scope="module")
def client():
    """FastAPI TestClient instance (module-scoped for efficiency)."""
    return TestClient(app)


@pytest.fixture(scope="module")
def auth():
    """Valid authorization headers."""
    return {"Authorization": "Bearer test-kira-ci-key-abc123"}


@pytest.fixture(scope="module")
def valid_csv_bytes():
    """Valid 20-row CSV with required columns."""
    rows = ["datetime,amount,category,merchant"]
    for i in range(20):
        date = f"2024-05-{(i % 28) + 1:02d}"
        amount = 100 + (i * 50)
        category = ["Food", "Transport", "Entertainment", "Shopping"][i % 4]
        merchant = f"Store {i}"
        rows.append(f"{date},{amount},{category},{merchant}")
    return "\n".join(rows).encode("utf-8")


@pytest.fixture(scope="module")
def upload_and_coach(client, auth, valid_csv_bytes):
    """
    Shared fixture: Upload CSV and run coach.
    
    Returns tuple: (upload_response, coach_response)
    """
    files = {"file": ("test.csv", valid_csv_bytes, "text/csv")}
    upload_resp = client.post("/upload", files=files, headers=auth)
    assert upload_resp.status_code == 200, f"Upload failed: {upload_resp.text}"
    
    upload_id = upload_resp.json()["upload_id"]
    coach_resp = client.post(f"/coach?upload_id={upload_id}&budget=10000", headers=auth)
    
    return upload_resp, coach_resp


# ════════════════════════════════════════════════════════════════════════════════
# Test: Health & Root
# ════════════════════════════════════════════════════════════════════════════════


def test_health_returns_200(client):
    """GET /health should return 200."""
    response = client.get("/health")
    assert response.status_code == 200


def test_health_has_required_fields(client):
    """GET /health should have all required fields."""
    response = client.get("/health")
    data = response.json()
    assert "status" in data
    assert data["status"] == "ok"
    assert "version" in data
    assert "uptime_seconds" in data
    assert "gemini_connected" in data
    assert "gitlab_connected" in data


def test_root_returns_200(client):
    """GET / should return 200."""
    response = client.get("/")
    assert response.status_code == 200


def test_root_has_version(client):
    """GET / should include version."""
    response = client.get("/")
    data = response.json()
    assert "version" in data
    assert "name" in data



# ════════════════════════════════════════════════════════════════════════════════
# Test: Upload
# ════════════════════════════════════════════════════════════════════════════════


def test_upload_valid_csv_returns_200(client, auth, valid_csv_bytes):
    """POST /upload should return 200 for valid CSV."""
    files = {"file": ("test.csv", valid_csv_bytes, "text/csv")}
    response = client.post("/upload", files=files, headers=auth)
    assert response.status_code == 200, f"Upload failed: {response.text}"


def test_upload_response_has_upload_id(client, auth, valid_csv_bytes):
    """Upload response should include upload_id."""
    files = {"file": ("test.csv", valid_csv_bytes, "text/csv")}
    response = client.post("/upload", files=files, headers=auth)
    assert response.status_code == 200, f"Upload failed: {response.text}"
    data = response.json()
    assert "upload_id" in data
    assert data["upload_id"].startswith("kira_")


def test_upload_response_has_rows_count(client, auth, valid_csv_bytes):
    """Upload response should include rows count."""
    files = {"file": ("test.csv", valid_csv_bytes, "text/csv")}
    response = client.post("/upload", files=files, headers=auth)
    assert response.status_code == 200, f"Upload failed: {response.text}"
    data = response.json()
    assert "rows" in data
    assert data["rows"] == 20


def test_upload_response_has_date_range(client, auth, valid_csv_bytes):
    """Upload response should include date_range with start and end."""
    files = {"file": ("test.csv", valid_csv_bytes, "text/csv")}
    response = client.post("/upload", files=files, headers=auth)
    assert response.status_code == 200, f"Upload failed: {response.text}"
    data = response.json()
    assert "date_range" in data
    assert "start" in data["date_range"]
    assert "end" in data["date_range"]


def test_upload_response_has_categories(client, auth, valid_csv_bytes):
    """Upload response should include categories list."""
    files = {"file": ("test.csv", valid_csv_bytes, "text/csv")}
    response = client.post("/upload", files=files, headers=auth)
    assert response.status_code == 200, f"Upload failed: {response.text}"
    data = response.json()
    assert "categories" in data
    assert isinstance(data["categories"], list)
    assert len(data["categories"]) > 0


def test_upload_response_has_parsed_format(client, auth, valid_csv_bytes):
    """Upload response should include parsed_format."""
    files = {"file": ("test.csv", valid_csv_bytes, "text/csv")}
    response = client.post("/upload", files=files, headers=auth)
    assert response.status_code == 200, f"Upload failed: {response.text}"
    data = response.json()
    assert "parsed_format" in data
    assert data["parsed_format"] in ("csv", "google_pay", "paytm", "phonepe", "generic_pdf")



# ════════════════════════════════════════════════════════════════════════════════
# Test: Coach
# ════════════════════════════════════════════════════════════════════════════════


def test_coach_returns_200_with_valid_params(client, auth, upload_and_coach):
    """GET /coach with valid params should return 200."""
    _, coach_resp = upload_and_coach
    assert coach_resp.status_code == 200


def test_coach_response_has_all_fields(client, auth, upload_and_coach):
    """Coach response should have all required fields."""
    _, coach_resp = upload_and_coach
    data = coach_resp.json()
    
    required_fields = [
        "upload_id",
        "status",
        "days_left",
        "narrative",
        "action",
        "urgency",
        "tip",
        "suggested_cap",
        "nudge",
        "signals",
        "whatsapp_link",
        "confidence_score",
    ]
    for field in required_fields:
        assert field in data, f"Missing field: {field}"


def test_coach_status_is_valid_enum(client, auth, upload_and_coach):
    """Coach status should be one of: stable, watch, critical."""
    _, coach_resp = upload_and_coach
    data = coach_resp.json()
    status = data.get("status")
    assert status in ("stable", "watch", "critical")


def test_coach_urgency_is_valid(client, auth, upload_and_coach):
    """Coach urgency should be one of: low, medium, high."""
    _, coach_resp = upload_and_coach
    data = coach_resp.json()
    urgency = data.get("urgency")
    assert urgency in ("low", "medium", "high")


def test_coach_confidence_score_in_range(client, auth, upload_and_coach):
    """Confidence score should be between 0 and 1."""
    _, coach_resp = upload_and_coach
    data = coach_resp.json()
    score = data.get("confidence_score")
    assert isinstance(score, (int, float))
    assert 0 <= score <= 1


def test_coach_whatsapp_link_is_valid(client, auth, upload_and_coach):
    """WhatsApp link should start with https://wa.me/."""
    _, coach_resp = upload_and_coach
    data = coach_resp.json()
    link = data.get("whatsapp_link")
    assert isinstance(link, str)
    assert link.startswith("https://wa.me/")


def test_coach_narrative_is_non_empty(client, auth, upload_and_coach):
    """Narrative should be non-empty string."""
    _, coach_resp = upload_and_coach
    data = coach_resp.json()
    narrative = data.get("narrative")
    assert isinstance(narrative, str)
    assert len(narrative) > 0


def test_coach_signals_has_required_fields(client, auth, upload_and_coach):
    """Signals object should have all required fields."""
    _, coach_resp = upload_and_coach
    data = coach_resp.json()
    signals = data.get("signals", {})
    
    required_fields = [
        "anomaly_detected",
        "habit_score",
        "confidence_score",
    ]
    for field in required_fields:
        assert field in signals, f"Missing signal field: {field}"


# ════════════════════════════════════════════════════════════════════════════════
# Test: Feedback
# ════════════════════════════════════════════════════════════════════════════════


def test_feedback_accepted_returns_200(client, auth, upload_and_coach):
    """POST /feedback with accepted=true should return 200."""
    _, coach_resp = upload_and_coach
    upload_id = coach_resp.json().get("upload_id")
    
    payload = {
        "upload_id": upload_id,
        "nudge_id": "n1",
        "accepted": True,
    }
    response = client.post("/feedback", json=payload, headers=auth)
    assert response.status_code == 200


def test_feedback_dismissed_returns_200(client, auth, upload_and_coach):
    """POST /feedback with accepted=false should return 200."""
    _, coach_resp = upload_and_coach
    upload_id = coach_resp.json().get("upload_id")
    
    payload = {
        "upload_id": upload_id,
        "nudge_id": "n1",
        "accepted": False,
    }
    response = client.post("/feedback", json=payload, headers=auth)
    assert response.status_code == 200


def test_feedback_response_has_reward(client, auth, upload_and_coach):
    """Feedback response should include reward."""
    _, coach_resp = upload_and_coach
    upload_id = coach_resp.json().get("upload_id")
    
    payload = {
        "upload_id": upload_id,
        "nudge_id": "n1",
        "accepted": True,
    }
    response = client.post("/feedback", json=payload, headers=auth)
    data = response.json()
    assert "reward" in data


def test_feedback_response_has_acceptance_rate(client, auth, upload_and_coach):
    """Feedback response should include acceptance_rate."""
    _, coach_resp = upload_and_coach
    upload_id = coach_resp.json().get("upload_id")
    
    payload = {
        "upload_id": upload_id,
        "nudge_id": "n1",
        "accepted": True,
    }
    response = client.post("/feedback", json=payload, headers=auth)
    data = response.json()
    assert "acceptance_rate" in data


# ════════════════════════════════════════════════════════════════════════════════
# Test: Metrics
# ════════════════════════════════════════════════════════════════════════════════


def test_metrics_returns_200(client, auth):
    """GET /metrics should return 200."""
    response = client.get("/metrics", headers=auth)
    assert response.status_code == 200


def test_metrics_has_required_fields(client, auth):
    """GET /metrics should return required fields."""
    response = client.get("/metrics", headers=auth)
    data = response.json()
    
    required_fields = [
        "signal_coverage_pct",
        "nudge_acceptance_rate",
        "model_quality_score",
        "total_sessions",
    ]
    for field in required_fields:
        assert field in data, f"Missing field: {field}"


def test_metrics_model_quality_score_in_range(client, auth):
    """Model quality score should be between 0 and 1."""
    response = client.get("/metrics", headers=auth)
    data = response.json()
    score = data.get("model_quality_score")
    assert isinstance(score, (int, float))
    assert 0 <= score <= 1


# ════════════════════════════════════════════════════════════════════════════════
# Test: Integration
# ════════════════════════════════════════════════════════════════════════════════


def test_full_workflow_upload_coach_feedback(client, auth, valid_csv_bytes):
    """Full workflow: upload → coach → feedback."""
    # 1. Upload
    files = {"file": ("test.csv", valid_csv_bytes, "text/csv")}
    upload_resp = client.post("/upload", files=files, headers=auth)
    assert upload_resp.status_code == 200
    upload_id = upload_resp.json()["upload_id"]
    
    # 2. Coach
    coach_resp = client.post(f"/coach?upload_id={upload_id}&budget=10000", headers=auth)
    assert coach_resp.status_code == 200
    data = coach_resp.json()
    assert "status" in data
    
    # 3. Feedback
    feedback_payload = {
        "upload_id": upload_id,
        "nudge_id": "n1",
        "accepted": True,
    }
    feedback_resp = client.post("/feedback", json=feedback_payload, headers=auth)
    assert feedback_resp.status_code == 200


def test_multiple_uploads_have_different_ids(client, auth, valid_csv_bytes):
    """Multiple uploads should have different upload_ids."""
    files1 = {"file": ("test1.csv", valid_csv_bytes, "text/csv")}
    resp1 = client.post("/upload", files=files1, headers=auth)
    id1 = resp1.json()["upload_id"]
    
    files2 = {"file": ("test2.csv", valid_csv_bytes, "text/csv")}
    resp2 = client.post("/upload", files=files2, headers=auth)
    id2 = resp2.json()["upload_id"]
    
    assert id1 != id2
