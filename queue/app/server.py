from contextlib import asynccontextmanager

from aiohttp import ClientSession
from core.limiter import limiter
from cryptography.fernet import Fernet
from fastapi import FastAPI, Response, status
from fastapi.middleware.cors import CORSMiddleware
from locking import DistributedLock
from redis.asyncio import ConnectionPool, Redis
from routes import queue
from services.queue import QueueEmailer, QueueRepository, QueueService, QueueWorker
from services.spotify import (
    SpotifyTokenProvider,
    SpotifyUserManager,
    SpotifyUserValidator,
)
from services.turnstile import TurnstileVerifier
from settings import APP_STATE_KEY, settings
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from state import State


@asynccontextmanager
async def lifespan(app: FastAPI):
    http = ClientSession()
    redis_pool = ConnectionPool.from_url(
        url=settings.redis_url,
        decode_responses=True,
        max_connections=10,
    )
    redis = Redis(connection_pool=redis_pool)

    try:
        crypto = Fernet(key=settings.redis_key)
        token_provider = SpotifyTokenProvider(
            http, redis, crypto, settings.spotify_auth_client_id
        )
        user_validator = await SpotifyUserValidator.create(http)

        queue_emailer = QueueEmailer(redis, user_validator)
        queue_service = QueueService(
            SpotifyUserManager(http, redis, token_provider, settings.spotify_client_id),
            user_validator,
            queue_emailer,
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
            queue_emailer=queue_emailer,
            turnstile_verifier=turnstile_verifier,
        )

        await token_provider.seed_token(settings.spotify_refresh_token)
        queue_worker.start()

        yield

    finally:
        await http.close()
        await redis_pool.aclose()


def build_app() -> FastAPI:
    app = FastAPI(lifespan=lifespan)

    # rate limiting
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)  # ty:ignore[invalid-argument-type]

    # cors
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[settings.app_frontend_url],
        allow_credentials=True,
        allow_methods=["GET", "POST", "DELETE"],
        allow_headers=["*"],
    )

    app.include_router(queue.router, prefix="/queue", tags=["queue"])

    @app.get("/")
    def handle_healthcheck():
        return "ok!"

    @app.get("/favicon.ico")
    def handle_favicon():
        return Response(status_code=status.HTTP_204_NO_CONTENT)

    return app
