import asyncio
from datetime import datetime, timedelta, timezone

from loguru import logger

from user_manager import UserManager
from queue_manager import QueueManager


MAX_ACTIVE_USERS = 5
POLL_INTERVAL = 10
ACCESS_DURATION = timedelta(hours=3)


class QueueController:
    def __init__(self, user_manager: UserManager, queue_manager: QueueManager):
        self._user_manager = user_manager
        self._queue_manager = queue_manager

    async def run(self) -> None:
        logger.info("queue worker started")
        while True:
            try:
                await self._tick()
            except Exception:
                logger.exception("queue worker tick failed")
            await asyncio.sleep(POLL_INTERVAL)

    async def _tick(self) -> None:
        users = await self._user_manager.get_users()
        now = datetime.now(timezone.utc)

        active = 0
        for user in users:
            if now >= user.createdAt + ACCESS_DURATION:
                await self._user_manager.remove_user(user.id)
            else:
                active += 1

        open_slots = MAX_ACTIVE_USERS - active
        if open_slots <= 0:
            return

        new_users = await self._queue_manager.dequeue(count=open_slots)
        for new_user in new_users:
            await self._user_manager.add_user(new_user)
        if new_users:
            logger.info(f"Granted access to {len(new_users)} new users")
