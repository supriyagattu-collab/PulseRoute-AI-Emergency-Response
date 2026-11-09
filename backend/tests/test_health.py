"""
Tests for health-check endpoint.
"""


def test_health_check_returns_healthy(client):
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] in ["healthy", "degraded"]
    assert "project" in data
    assert "version" in data
    assert "database" in data
    assert "simulation" in data
    assert data["simulation"]["connected_to_real_emergency_services"] is False


def test_root_redirects_to_docs(client):
    response = client.get("/", follow_redirects=False)
    assert response.status_code in [302, 307]
    assert response.headers["location"] == "/docs"
