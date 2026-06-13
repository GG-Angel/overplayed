from core.config import settings
from state import build_state
from server import build_app
from fastapi.testclient import TestClient

app = build_app(build_state(settings))

client = TestClient(app)


def test_get_global_swipe_metrics():
    response = client.get("/metrics")
    assert response.status_code == 200
