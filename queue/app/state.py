from fastapi import Request
from dataclasses import dataclass
from spotify.users import UserRepository
from spotify.validate import UserValidator
from spotify.token import TokenRepository
from settings import APP_STATE_KEY
from queues.manager import UserQueueController


@dataclass
class State:
    auth: TokenRepository
    users: UserRepository
    validator: UserValidator
    queue: UserQueueController


def get_state(request: Request) -> State:
    return request.app.state[APP_STATE_KEY]
