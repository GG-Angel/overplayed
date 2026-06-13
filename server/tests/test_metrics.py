from core.config import settings
from server import build_app
from fastapi.testclient import TestClient

app = build_app(settings)


def test_get_global_swipe_metrics():
    with TestClient(app) as client:
        response = client.get("/metrics")
        assert response.status_code == 200
