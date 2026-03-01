"""Integration tests for API endpoints."""
import pytest
from fastapi.testclient import TestClient

from main import app

client = TestClient(app)


# ── Health & Info ──────────────────────────────────────────────

def test_root_returns_status():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"
    assert "disclaimer" in data


def test_disclaimer_endpoint():
    response = client.get("/api/disclaimer")
    assert response.status_code == 200
    assert "educational purposes" in response.json()["disclaimer"].lower()


# ── Tax Calculation ────────────────────────────────────────────

def test_calculate_individual_tax():
    response = client.post("/api/tax/calculate", json={
        "entity_type": "1040",
        "gross_income": 75000,
        "filing_status": "single",
    })
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["data"]["tax_liability"] > 0
    assert data["data"]["disclaimer"]


def test_calculate_corporate_tax():
    response = client.post("/api/tax/calculate", json={
        "entity_type": "1120",
        "gross_income": 500000,
        "filing_status": "single",
    })
    assert response.status_code == 200
    data = response.json()
    assert data["data"]["tax_liability"] == 105000.00


def test_calculate_with_itemized():
    response = client.post("/api/tax/calculate", json={
        "entity_type": "1040",
        "gross_income": 100000,
        "filing_status": "single",
        "itemized_deductions": 25000,
    })
    assert response.status_code == 200
    assert response.json()["data"]["deduction_type"] == "Itemized"


def test_calculate_married_joint():
    response = client.post("/api/tax/calculate", json={
        "entity_type": "1040",
        "gross_income": 120000,
        "filing_status": "married_joint",
    })
    assert response.status_code == 200
    assert response.json()["data"]["deduction_amount"] == 29200


def test_calculate_all_filing_statuses():
    """All four filing statuses should work."""
    for status in ["single", "married_joint", "married_separate", "head_of_household"]:
        response = client.post("/api/tax/calculate", json={
            "entity_type": "1040",
            "gross_income": 80000,
            "filing_status": status,
        })
        assert response.status_code == 200, f"Failed for {status}"


# ── Validation Errors ──────────────────────────────────────────

def test_negative_income_rejected():
    response = client.post("/api/tax/calculate", json={
        "entity_type": "1040",
        "gross_income": -1000,
        "filing_status": "single",
    })
    assert response.status_code == 422


def test_invalid_entity_type():
    response = client.post("/api/tax/calculate", json={
        "entity_type": "W-2",
        "gross_income": 50000,
        "filing_status": "single",
    })
    assert response.status_code == 400


def test_invalid_filing_status():
    response = client.post("/api/tax/calculate", json={
        "entity_type": "1040",
        "gross_income": 50000,
        "filing_status": "divorced",
    })
    assert response.status_code == 422


def test_absurdly_high_income_rejected():
    response = client.post("/api/tax/calculate", json={
        "entity_type": "1040",
        "gross_income": 2_000_000_000,
        "filing_status": "single",
    })
    assert response.status_code == 422


# ── Quarterly Estimates ────────────────────────────────────────

def test_quarterly_estimate():
    response = client.post("/api/tax/quarterly", json={
        "estimated_annual_income": 100000,
        "filing_status": "single",
        "withholding_to_date": 5000,
    })
    assert response.status_code == 200
    data = response.json()["data"]
    assert len(data["payment_schedule"]) == 4


# ── Voice Agent ────────────────────────────────────────────────

def test_voice_chat_no_api_key(monkeypatch):
    """Without ANTHROPIC_API_KEY, voice chat returns 503."""
    monkeypatch.delenv("ANTHROPIC_API_KEY", raising=False)
    response = client.post("/api/voice/chat", json={
        "message": "Hello, I need tax advice",
    })
    assert response.status_code == 503


def test_voice_websocket_not_implemented():
    """WebSocket voice endpoint returns not-implemented message."""
    with client.websocket_connect("/ws/voice") as ws:
        data = ws.receive_json()
        assert "Not Implemented" in data["error"]


# ── Document Analysis ──────────────────────────────────────────

def test_document_analysis_no_api_key(monkeypatch):
    """Without ANTHROPIC_API_KEY, returns 503."""
    monkeypatch.delenv("ANTHROPIC_API_KEY", raising=False)
    response = client.post("/api/documents/analyze", json={
        "document_type": "W-2",
        "document_data": {"employer": "Test Corp", "wages": 75000},
    })
    assert response.status_code == 503


# ── Audit Defense ──────────────────────────────────────────────

def test_audit_defense_no_api_key(monkeypatch):
    """Without ANTHROPIC_API_KEY, returns 503."""
    monkeypatch.delenv("ANTHROPIC_API_KEY", raising=False)
    response = client.post("/api/audit/analyze", json={
        "notice_text": "The IRS is questioning your home office deduction for tax year 2023.",
        "client_documents": {},
    })
    assert response.status_code == 503


def test_audit_defense_short_notice():
    """Notice text too short → 422."""
    response = client.post("/api/audit/analyze", json={
        "notice_text": "short",
        "client_documents": {},
    })
    assert response.status_code == 422
