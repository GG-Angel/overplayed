from user_manager import UserManager
from queue_manager import QueueManager


class QueueWorker:
    def __init__(self, users: UserManager, queue: QueueManager):
        self._users = users
        self._queue = queue

    async def start(self) -> None:
        pass
