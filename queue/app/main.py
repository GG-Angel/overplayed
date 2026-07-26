from cryptography.fernet import Fernet
from redis.asyncio import ConnectionPool, Redis
from aiohttp import ClientSession
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from fastapi import FastAPI, Response, status
from settings import settings, APP_STATE_KEY
from services.queue import QueueService, QueueRepository, QueueWorker
from state import State
from locking import DistributedLock
from routers import queue
from services.turnstile import TurnstileVerifier
from services.spotify import (
    SpotifyTokenProvider,
    SpotifyUserManager,
    SpotifyUserValidator,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        http = ClientSession()
        crypto = Fernet(key=settings.redis_key)

        redis_pool = ConnectionPool.from_url(
            url=settings.redis_url,
            decode_responses=True,
            max_connections=10,
        )
        redis = Redis(connection_pool=redis_pool)

        token_provider = SpotifyTokenProvider(
            http, redis, crypto, settings.spotify_auth_client_id
        )

        queue_service = QueueService(
            SpotifyUserManager(
                http, redis, token_provider, settings.spotify_app_client_id
            ),
            await SpotifyUserValidator.create(http),
            QueueRepository(redis),
            DistributedLock(redis, "queue:lock", timeout=45, blocking_timeout=10),
        )

        queue_worker = QueueWorker(queue_service)

        turnstile_verifier = TurnstileVerifier(
            http, settings.cloudflare_turnstile_secret
        )

        app.state[APP_STATE_KEY] = State(
            queue_service=queue_service,
            queue_worker=queue_worker,
            turnstile_verifier=turnstile_verifier,
        )

        await token_provider.seed_token(settings.spotify_refresh_token)
        queue_worker.start()

        yield

    finally:
        if http is not None:
            await http.close()
        if redis_pool is not None:
            await redis_pool.aclose()


app = FastAPI(lifespan=lifespan)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url],
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


@app.get("")
def handle_healthcheck():
    return ":o"


@app.get("favicon.ico")
def handle_favicon():
    return Response(status_code=status.HTTP_204_NO_CONTENT)


app.include_router(queue.router, prefix="/queue", tags=["queue"])
