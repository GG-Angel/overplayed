from redis.asyncio import Redis
import uvicorn
import redis.asyncio as redis
from aiohttp import ClientSession
from contextlib import asynccontextmanager
from fastapi import FastAPI
from user_manager import UserManager
from core.settings import settings
from state import AppState
from routes import queue
from queue_manager import QueueManager
from queue_controller import QueueController


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with (
        ClientSession(
            base_url="https://developer.spotify.com",
            headers={"Authorization": f"Bearer {settings.spotify_bearer_token}"},
            raise_for_status=True,
        ) as session,
    ):
        user_manager = UserManager(
            client_id=settings.spotify_client_id,
            session=session,
        )

        redis_pool = redis.ConnectionPool.from_url(
            url=settings.redis_url,
            decode_responses=True,
            max_connections=5,
        )

        queue_controller = QueueController(
            user_manager=user_manager,
            queue_manager=QueueManager(
                user_manager=user_manager,
                redis=Redis.from_pool(redis_pool),
            ),
        )

        app_state = AppState(
            user_manager=user_manager,
            queue_controller=queue_controller,
            redis_pool=redis_pool,
        )
        app.state[settings.app_state_key] = app_state

        yield


async def start():
    app = FastAPI(lifespan=lifespan)
    app.include_router(queue.router)

    config = uvicorn.Config(app, host="0.0.0.0", port=8080)
    await uvicorn.Server(config).serve()
