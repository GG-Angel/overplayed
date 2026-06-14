from fastapi import Request, Depends

from user_manager import UserManager
from queue_manager import QueueManager
from core.settings import settings


class AppState:
    def __init__(
        self,
        user_manager: UserManager,
        queue_manager: QueueManager,
    ):
        self.user_manager = user_manager
        self.queue_manager = queue_manager


def get_app_state(request: Request) -> AppState:
    return request.app.state[settings.app_state_key]


def get_queue_manager(state: AppState = Depends(get_app_state)) -> QueueManager:
    return state.queue_manager
