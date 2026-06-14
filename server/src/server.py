from core.oauth import build_spotify_oauth
import uvicorn
from contextlib import asynccontextmanager
from aiohttp import ClientSession
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, Response, status
from core.limiter import limiter
from core.config import Settings, APP_STATE_KEY
from core.database import build_engine, build_sessionmaker, init_db
from core.redis import build_redis_pool
from state import State
from routes import auth, users, playlists, previews, metrics


def build_app(settings: Settings) -> FastAPI:
    @asynccontextmanager
    async def lifespan(app: FastAPI):
        db_engine = build_engine(settings)
        db_sessionmaker = build_sessionmaker(db_engine)
        redis_pool = build_redis_pool(settings)
        oauth = build_spotify_oauth()

        await init_db(db_engine)

        async with ClientSession() as session:
            app.state[APP_STATE_KEY] = State(
                settings=settings,
                session=session,
                db_engine=db_engine,
                db_sessionmaker=db_sessionmaker,
                redis_pool=redis_pool,
                oauth=oauth,
            )
            yield

        await db_engine.dispose()
        await redis_pool.disconnect()

    app = FastAPI(lifespan=lifespan)

    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)  # ty:ignore[invalid-argument-type]

    app.add_middleware(
        CORSMiddleware,
        allow_origins=[settings.frontend_url],
        allow_credentials=True,
        allow_methods=["GET", "POST", "DELETE"],
        allow_headers=["*"],
    )

    @app.get("/")
    def handle_healthcheck():
        return ":3"

    @app.get("/favicon.ico")
    def handle_favicon():
        return Response(status_code=status.HTTP_204_NO_CONTENT)

    app.include_router(auth.router, prefix="/auth", tags=["auth"])
    app.include_router(users.router, prefix="/users", tags=["users"])
    app.include_router(playlists.router, prefix="/playlists", tags=["playlists"])
    app.include_router(previews.router, prefix="/previews", tags=["previews"])
    app.include_router(metrics.router, prefix="/metrics", tags=["metrics"])

    return app


async def start(app: FastAPI):
    config = uvicorn.Config(
        app,
        host="0.0.0.0",
        port=8080,
        proxy_headers=True,
        forwarded_allow_ips="*",
    )
    await uvicorn.Server(config).serve()
