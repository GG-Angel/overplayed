import asyncio
from fakeredis.aioredis import FakeRedis
from loguru import logger
from redis.asyncio import Redis
from app.spotify.users import NewUser


class QueueManager:
    def __init__(self, redis: Redis):
        self.redis = redis
        self.cache_key = "queue:waiting"

    async def enqueue(self, user: NewUser) -> int:
        pos = await self.redis.rpush(self.cache_key, user.model_dump_json())
        logger.info(f"Queued user: {user.name} (pos: {pos})")
        return pos

    async def dequeue(self, count: int = 1) -> list[NewUser]:
        result = await self.redis.lpop(self.cache_key, count=count)

        if result is None or not isinstance(result, list):
            logger.info("Queue is empty. No users dequeued.")
            return []

        users = [NewUser.model_validate_json(user) for user in result]
        logger.info(f"Dequeued {len(users)} users: {[u.name for u in users]}")
        return users

    async def get_size(self) -> int:
        return await self.redis.llen(self.cache_key)


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
