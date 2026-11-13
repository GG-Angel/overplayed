from contextlib import asynccontextmanager
from typing import Literal

from aiohttp import ClientSession
from fastapi import APIRouter, FastAPI, Response, status
from fastapi.middleware.cors import CORSMiddleware
from redis.asyncio import Redis
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from src.cache.client import RedisClient
from src.core.database import build_engine, build_sessionmaker
from src.core.limiter import limiter
from src.core.oauth import build_spotify_oauth
from src.core.redis import build_redis_pool
from src.routes import auth, playlists, previews, stats, users
from src.services.auth.evictions import build_eviction_consumer
from src.services.spotify.cache import build_spotify_cache
from src.settings import APP_STATE_KEY, settings
from src.state import State


@asynccontextmanager
async def lifespan(app: FastAPI):
    db_engine = build_engine(settings)
    db_sessionmaker = build_sessionmaker(db_engine)
    redis_pool = build_redis_pool(settings)
    oauth = build_spotify_oauth()

    redis = Redis(connection_pool=redis_pool)
    eviction_consumer = build_eviction_consumer(
        redis,
        build_spotify_cache(RedisClient(redis), settings),
        settings,
    )

    async with ClientSession() as session:
        app.state[APP_STATE_KEY] = State(
            settings=settings,
            session=session,
            db_engine=db_engine,
            db_sessionmaker=db_sessionmaker,
            redis_pool=redis_pool,
            oauth=oauth,
        )

        eviction_consumer.start()

        yield

        await eviction_consumer.stop()

    await redis.aclose()
    await db_engine.dispose()
    await redis_pool.disconnect()


def build_app() -> FastAPI:
    app = FastAPI(lifespan=lifespan)

    # rate limiting
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)  # pyright: ignore[reportArgumentType] # ty:ignore[invalid-argument-type]

    # cors
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[settings.app_frontend_url],
        allow_credentials=True,
        allow_methods=["GET", "POST", "DELETE"],
        allow_headers=["*"],
    )

    root = APIRouter(prefix="/api")

    root.include_router(auth.router, prefix="/auth", tags=["auth"])
    root.include_router(users.router, prefix="/users", tags=["users"])
    root.include_router(playlists.router, prefix="/playlists", tags=["playlists"])
    root.include_router(previews.router, prefix="/previews", tags=["previews"])
    root.include_router(stats.router, prefix="/stats", tags=["stats"])

    @root.get("/health")
    def handle_healthcheck() -> Literal["ok!"]:
        return "ok!"

    @root.get("/favicon.ico")
    def handle_favicon() -> Response:
        return Response(status_code=status.HTTP_204_NO_CONTENT)

    app.include_router(root)

    return app
