from contextlib import asynccontextmanager

from aiohttp import ClientSession
from core.limiter import limiter
from fastapi import FastAPI, Response, status
from fastapi.middleware.cors import CORSMiddleware
from locking import DistributedLock
from redis.asyncio import ConnectionPool, Redis
from routes import queue
from services.queue import (
    QueueRepository,
    QueueService,
    QueueWorker,
    build_email_service,
)
from services.spotify import (
    build_spotify_token_provider,
    build_spotify_user_manager,
    build_spotify_user_validator,
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
        token_provider = build_spotify_token_provider(http, redis)
        user_validator = await build_spotify_user_validator(http)

        queue_emailer = build_email_service(redis)
        queue_service = QueueService(
            build_spotify_user_manager(http, redis, token_provider),
            user_validator,
            queue_emailer,
            QueueRepository(redis),
            DistributedLock(redis, timeout=30, blocking_timeout=10),
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
