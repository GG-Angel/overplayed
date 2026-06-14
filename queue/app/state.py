from typing import AsyncGenerator
from redis.asyncio import Redis, ConnectionPool
from fastapi import Request, Depends
from user_manager import UserManager
from queue_manager import QueueManager
from queue_controller import QueueController
from core.settings import settings


class AppState:
    def __init__(
        self,
        user_manager: UserManager,
        queue_controller: QueueController,
        redis_pool: ConnectionPool,
    ):
        self.user_manager = user_manager
        self.queue_controller = queue_controller
        self.redis_pool = redis_pool


def get_app_state(request: Request) -> AppState:
    return request.state[settings.app_state_key]


async def get_redis(state: AppState = Depends(get_app_state)) -> AsyncGenerator[Redis]:
    redis = Redis(connection_pool=state.redis_pool)
    try:
        yield redis
    finally:
        await redis.aclose()


def get_queue_manager(
    state: AppState = Depends(get_app_state),
    redis: Redis = Depends(get_redis),
) -> QueueManager:
    return QueueManager(user_manager=state.user_manager, redis=redis)
