from fastapi import Request
from dataclasses import dataclass
from settings import APP_STATE_KEY
from service import QueueService


@dataclass
class State:
    queue: QueueService


def get_state(request: Request) -> State:
    return request.app.state[APP_STATE_KEY]
