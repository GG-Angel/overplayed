from fastapi import Request
from dataclasses import dataclass
from services.queue import QueueService, QueueWorker
from services.turnstile import TurnstileVerifier
from settings import APP_STATE_KEY


@dataclass
class State:
    queue_service: QueueService
    queue_worker: QueueWorker
    turnstile_verifier: TurnstileVerifier


def get_state(request: Request) -> State:
    """Get the application state from the request."""
    return request.app.state[APP_STATE_KEY]


def get_queue_service(request: Request) -> QueueService:
    """Get the queue service from the application state."""
    return get_state(request).queue_service


def get_turnstile_verifier(request: Request) -> TurnstileVerifier:
    """Get the Turnstile verifier from the application state."""
    return get_state(request).turnstile_verifier
