from loguru import logger
from redis.asyncio import Redis
from user_manager import NewUser


QUEUE_KEY = "queue"


class QueueManager:
    def __init__(self, redis: Redis):
        self.redis = redis

    async def enqueue(self, user: NewUser) -> None:
        await self.redis.rpush(QUEUE_KEY, user.model_dump_json())
        logger.info(f"Queued user: {user.name}")

    async def dequeue(self, count: int) -> list[NewUser]:
        result = await self.redis.lpop(QUEUE_KEY, count=count)

        if result is None or not isinstance(result, list):
            logger.info("Queue is empty. No users dequeued.")
            return []

        users = [NewUser.model_validate_json(user) for user in result]
        logger.info(f"Dequeued {len(users)} users: {[u.name for u in users]}")
        return users
