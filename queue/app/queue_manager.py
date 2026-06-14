from loguru import logger
from redis.asyncio import Redis
from user_manager import NewUser


class QueueManager:
    def __init__(self, redis: Redis):
        self.redis = redis
        self.cache_key = "queue:waiting"

    async def enqueue(self, user: NewUser) -> None:
        await self.redis.rpush(self.cache_key, user.model_dump_json())
        logger.info(f"Queued user: {user.name}")

    async def dequeue(self, count: int) -> list[NewUser]:
        result = await self.redis.lpop(self.cache_key, count=count)

        if result is None or not isinstance(result, list):
            logger.info("Queue is empty. No users dequeued.")
            return []

        users = [NewUser.model_validate_json(user) for user in result]
        logger.info(f"Dequeued {len(users)} users: {[u.name for u in users]}")
        return users

    async def get_size(self) -> int:
        return await self.redis.llen(self.cache_key)
