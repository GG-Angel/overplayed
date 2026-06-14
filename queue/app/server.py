import asyncio
import uvicorn
import redis.asyncio as aioredis
from contextlib import asynccontextmanager
from aiohttp import ClientSession
from fastapi import FastAPI
from core.settings import settings
from routes import queue
from user_manager import UserManager
from queue_manager import QueueManager
from queue_worker import QueueWorker


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.session = ClientSession(
        base_url="https://developer.spotify.com",
        headers={"Authorization": f"Bearer {settings.spotify_bearer_token}"},
        raise_for_status=True,
    )

    app.state.redis_pool = aioredis.ConnectionPool.from_url(
        settings.redis_url,
        decode_responses=True,
        max_connections=5,
    )

    app.state.redis = aioredis.Redis(connection_pool=app.state.redis_pool)

    app.state.users = UserManager(session=app.state.session, client_id=settings.spotify_client_id)  # fmt: skip
    app.state.queue = QueueManager(redis=app.state.redis)

    worker = QueueWorker(users=app.state.users, queue=app.state.queue)
    worker_task = asyncio.create_task(worker.start())
    app.state.tasks = set(worker_task)

    yield

    await app.state.session.close()
    await app.state.redis_pool.disconnect()


async def start():
    app = FastAPI(lifespan=lifespan)

    app.include_router(queue.router)

    config = uvicorn.Config(app, host="0.0.0.0", port=8000)
    await uvicorn.Server(config).serve()
