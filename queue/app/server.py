import asyncio
import uvicorn
import routes
import redis.asyncio as aioredis
from contextlib import asynccontextmanager
from aiohttp import ClientSession
from fastapi import FastAPI
from core.settings import settings
from user_manager import UserManager
from queue_manager import QueueManager
from queue_worker import QueueWorker
from state import State


@asynccontextmanager
async def lifespan(app: FastAPI):
    session = ClientSession(
        base_url="https://developer.spotify.com",
        headers={"Authorization": f"Bearer {settings.spotify_bearer_token}"},
        raise_for_status=True,
    )
    redis_pool = aioredis.ConnectionPool.from_url(
        settings.redis_url,
        decode_responses=True,
        max_connections=10,
    )
    redis = aioredis.Redis(connection_pool=redis_pool)

    state = State(
        users=UserManager(
            session=session,
            redis=redis,
            client_id=settings.spotify_client_id,
        ),
        queue=QueueManager(redis=redis),
    )

    worker = QueueWorker(users=state.users, queue=state.queue)
    state.tasks.add(asyncio.create_task(worker.start()))

    app.state[settings.app_state_key] = state

    yield

    await session.close()
    await redis_pool.disconnect()


async def start():
    app = FastAPI(lifespan=lifespan)
    app.include_router(routes.router)

    config = uvicorn.Config(app, host="0.0.0.0", port=8000)
    await uvicorn.Server(config).serve()
