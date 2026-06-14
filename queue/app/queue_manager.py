from redis.asyncio import Redis
from user_manager import UserManager, NewUser


QUEUE_KEY = "queue"


class QueueManager:
    def __init__(self, user_manager: UserManager, redis: Redis):
        self._user_manager = user_manager
        self._redis = redis

    async def enqueue(self, user: NewUser) -> None:
        await self._redis.rpush(QUEUE_KEY, user.model_dump_json())

    async def dequeue(self, count: int) -> list[NewUser]:
        result = await self._redis.lpop(QUEUE_KEY, count=count)
        if result is None or not isinstance(result, list):
            return []
        return [NewUser.model_validate_json(user) for user in result]
