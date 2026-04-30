from settings import STATE_KEY
from state import State
from fastapi import Request


def get_app_state(request: Request) -> State:
    return request.app.state[STATE_KEY]
