from fastapi import Request
from queue_manager import QueueManager
from user_manager import UserManager
from core.settings import settings


class State:
    def __init__(self, users: UserManager, queue: QueueManager):
        self.users = users
        self.queue = queue


def get_state(request: Request) -> QueueManager:
    return request.app.state[settings.app_state_key]
