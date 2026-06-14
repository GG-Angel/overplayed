import asyncio
from loguru import logger
from datetime import datetime, timedelta
from user_manager import UserManager
from queue_manager import QueueManager


class QueueController:
    def __init__(self, user_manager: UserManager, queue_manager: QueueManager):
        self._user_manager = user_manager
        self._queue_manager = queue_manager
        self._worker_task = None

    async def start(self) -> None:
        self._worker_task = asyncio.create_task(self.worker())

    async def worker(self) -> None:
        while True:
            users = await self._user_manager.get_users()
            time = datetime.now()

            num_users = len(users)
            for user in users:
                if time >= user.createdAt + timedelta(hours=3):
                    await self._user_manager.remove_user(user.id)
                    num_users -= 1

            new_users = await self._queue_manager.dequeue(count=5 - num_users)
            for new_user in new_users:
                await self._queue_manager.enqueue(new_user)

            logger.info(f"Gave access to {len(new_users)} new users")

            await asyncio.sleep(60)
