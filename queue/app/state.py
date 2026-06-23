from fastapi import Request
from dataclasses import dataclass
from spotify.users import UserManager
from spotify.validate import UserValidator
from spotify.token import TokenManager
from settings import APP_STATE_KEY
from queues.manager import QueueManager


@dataclass
class State:
    auth: TokenManager
    users: UserManager
    validator: UserValidator
    queue: QueueManager


def get_state(request: Request) -> State:
    return request.app.state[APP_STATE_KEY]
