from fastapi import Request
from dataclasses import dataclass
from spotify.users import SpotifyUserManagementClient
from spotify.validate import SpotifyUserValidator
from spotify.token import SpotifyTokenClient
from settings import APP_STATE_KEY
from queues.manager import QueueRepository


@dataclass
class State:
    auth: SpotifyTokenClient
    users: SpotifyUserManagementClient
    validator: SpotifyUserValidator
    queue: QueueRepository


def get_state(request: Request) -> State:
    return request.app.state[APP_STATE_KEY]
