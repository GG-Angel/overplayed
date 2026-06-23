import asyncio
from fakeredis.aioredis import FakeRedis
from loguru import logger
from redis.asyncio import Redis
from spotify.users import NewUser

QUEUE_KEY = "queue:waiting"


class QueueManager:
    def __init__(self, redis: Redis):
        self.redis = redis

    async def enqueue(self, user: NewUser) -> int:
        pos = await self.redis.rpush(QUEUE_KEY, user.model_dump_json())
        logger.info(f"Queued user: {user.name} (pos: {pos})")
        return pos

    async def dequeue(self, count: int = 1) -> list[NewUser]:
        result = await self.redis.lpop(QUEUE_KEY, count=count)

        if result is None or not isinstance(result, list):
            logger.info("Queue is empty. No users dequeued.")
            return []

        users = [NewUser.model_validate_json(user) for user in result]
        logger.info(f"Dequeued {len(users)} users: {[u.name for u in users]}")
        return users

    async def get_size(self) -> int:
        return await self.redis.llen(QUEUE_KEY)

    async def is_user_in_queue(self, email: str) -> bool:
        waiting_users = [
            NewUser.model_validate_json(u)
            for u in await self.redis.lrange(QUEUE_KEY, 0, -1)
        ]
        return email in set([u.email for u in waiting_users])


async def main():
    manager = QueueManager(FakeRedis())
    assert await manager.get_size() == 0
    await manager.enqueue(NewUser(name="John Doe", email="johnexample@gmail.com"))
    await manager.enqueue(NewUser(name="Jane Doe", email="janeexample@gmail.com"))
    await manager.enqueue(NewUser(name="Evelyn Lee", email="evelynexample@gmail.com"))
    assert await manager.get_size() == 3
    await manager.dequeue()
    assert await manager.get_size() == 2
    await manager.dequeue(count=2)
    assert await manager.get_size() == 0
    await manager.dequeue(count=10)
    assert await manager.get_size() == 0


if __name__ == "__main__":
    asyncio.run(main())
