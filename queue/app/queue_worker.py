from loguru import logger
from datetime import datetime, timezone, timedelta
import asyncio
from user_manager import UserManager, USER_LIMIT
from queue_manager import QueueManager

POLL_INTERVAL = 6000
USER_ACCESS_DURATION = timedelta(hours=3)


class QueueWorker:
    def __init__(self, users: UserManager, queue: QueueManager):
        self.users = users
        self.queue = queue

    async def start(self) -> None:
        now = datetime.now(timezone.utc)
        while True:
            # 1. evict expired users
            current_users = await self.users.get_users()
            num_active = len(current_users)
            for user in current_users:
                if now < user.createdAt + USER_ACCESS_DURATION:
                    continue
                num_active -= 1
                try:
                    await self.users.remove_user(user)
                except Exception:
                    logger.warning(f"Failed to remove expired user {user.name}. They may have already been removed. Ignoring...")  # fmt: skip

            # 2. fill in empty slots
            new_users = await self.queue.dequeue(count=max(0, USER_LIMIT - num_active))
            for user in new_users:
                try:
                    await self.users.add_user(user)
                except Exception as e:
                    logger.error(f"Failed to add user {user.name}: {e}")

            await asyncio.sleep(POLL_INTERVAL)
