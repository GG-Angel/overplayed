import asyncio
from loguru import logger
from datetime import datetime, timezone, timedelta
from user_manager import UserManager, USER_LIMIT
from queue_manager import QueueManager

POLL_INTERVAL = 6000
ACCESS_DURATION = timedelta(hours=3)


class QueueWorker:
    def __init__(self, users: UserManager, queue: QueueManager):
        self.users = users
        self.queue = queue

    async def start(self) -> None:
        logger.info("Started queue worker.")
        while True:
            now = datetime.now(timezone.utc)

            # 1. evict expired users
            active_users = await self.users.get_users()
            expired_users = [u for u in active_users if now >= u.createdAt + ACCESS_DURATION]  # fmt: skip
            for user in expired_users:
                try:
                    await self.users.remove_user(user)
                except Exception:
                    logger.warning(f"Failed to evict {user.name} ({user.id}), skipping")

            # 2. fill in empty slots
            num_active = len(active_users) - len(expired_users)
            available_slots = max(0, USER_LIMIT - num_active)

            if available_slots == 0:
                logger.info("No slots available, sleeping")
                await asyncio.sleep(POLL_INTERVAL)
                continue

            new_users = await self.queue.dequeue(count=available_slots)
            if not new_users:
                logger.info("Queue empty, sleeping")

            for user in new_users:
                try:
                    await self.users.add_user(user)
                except Exception as e:
                    logger.error(f"Failed to admit {user.name}: {e}")

            logger.info(f"Evicted {len(expired_users)}, admitted {len(new_users)}; sleeping")  # fmt: skip
            await asyncio.sleep(POLL_INTERVAL)
