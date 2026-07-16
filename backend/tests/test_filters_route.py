"""Test for the one implemented route: GET /api/filters/therapies.

Per the backend testing rule, every implemented route gets a test. As new routes are
implemented, add matching tests here (or in a sibling module).
"""

from fastapi.testclient import TestClient

from main import app

client = TestClient(app)


def test_filters_therapies_returns_vector():
    resp = client.get("/api/filters/therapies")
    assert resp.status_code == 200
    body = resp.json()
    keys = [t["key"] for t in body["therapies"]]
    assert "physiotherapy" in keys
    assert "occupationalTherapy" in keys
    assert len(keys) == 9
    # every item has a non-empty label
    assert all(t["label"] for t in body["therapies"])


def test_unimplemented_route_returns_501():
    resp = client.get("/api/indicators")
    assert resp.status_code == 501
