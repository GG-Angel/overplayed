import asyncio
from contextlib import asynccontextmanager, suppress

import uvicorn
from aiohttp import ClientSession
from fastapi import FastAPI
from redis.asyncio import Redis

from core.settings import settings
from state import AppState
from routes import queue
from user_manager import UserManager
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
        Redis.from_url(
            settings.redis_url,
            decode_responses=True,
            max_connections=5,
        ) as redis,
    ):
        user_manager = UserManager(
            client_id=settings.spotify_client_id,
            session=session,
        )
        queue_manager = QueueManager(user_manager=user_manager, redis=redis)
        queue_controller = QueueController(
            user_manager=user_manager,
            queue_manager=queue_manager,
        )

        app.state[settings.app_state_key] = AppState(
            user_manager=user_manager,
            queue_manager=queue_manager,
        )

        worker_task = asyncio.create_task(queue_controller.run())
        try:
            yield
        finally:
            worker_task.cancel()
            with suppress(asyncio.CancelledError):
                await worker_task


async def start():
    app = FastAPI(lifespan=lifespan)
    app.include_router(queue.router)

    config = uvicorn.Config(app, host="0.0.0.0", port=8080)
    await uvicorn.Server(config).serve()
