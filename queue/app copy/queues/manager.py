import asyncio
from fakeredis.aioredis import FakeRedis
from loguru import logger
from redis.asyncio import Redis
from spotify.users import NewUser

QUEUE_KEY = "queue:waiting"


class QueueRepository:
    def __init__(self, redis: Redis):
        self.redis = redis

    async def enqueue(self, user: NewUser) -> int:
        pos = await self.redis.rpush(QUEUE_KEY, user.model_dump_json())
        logger.debug(f"Queued user: {user.name} (pos: {pos})")
        return pos

    async def dequeue(self, count: int = 1) -> list[NewUser]:
        result = await self.redis.lpop(QUEUE_KEY, count=count)

        if result is None or not isinstance(result, list):
            logger.debug("Queue is empty. No users dequeued.")
            return []

        users = [NewUser.model_validate_json(user) for user in result]
        logger.debug(f"Dequeued {len(users)} users: {[u.name for u in users]}")
        return users

    async def get_users(self) -> list[NewUser]:
        return [
            NewUser.model_validate_json(u)
            for u in await self.redis.lrange(QUEUE_KEY, 0, -1)
        ]

    async def get_size(self) -> int:
        return await self.redis.llen(QUEUE_KEY)

    async def has_user(self, email: str) -> bool:
        return email in set([u.email for u in await self.get_users()])


async def main():
    manager = QueueRepository(FakeRedis())
    assert len(await manager.get_users()) == 0
    await manager.enqueue(NewUser(name="John Doe", email="johnexample@gmail.com"))
    await manager.enqueue(NewUser(name="Jane Doe", email="janeexample@gmail.com"))
    await manager.enqueue(NewUser(name="Evelyn Lee", email="evelynexample@gmail.com"))
    assert len(await manager.get_users()) == 3
    await manager.dequeue()
    assert len(await manager.get_users()) == 2
    await manager.dequeue(count=2)
    assert len(await manager.get_users()) == 0
    await manager.dequeue(count=10)
    assert len(await manager.get_users()) == 0


if __name__ == "__main__":
    asyncio.run(main())
