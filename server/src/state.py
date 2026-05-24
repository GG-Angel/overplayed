from database.models import Base
from contextlib import asynccontextmanager, AsyncExitStack
from typing import AsyncIterator
from spotipy import SpotifyOAuth
from settings import Settings
from aiohttp import ClientSession
from cache import RedisCore, DummyCacheHandler
from redis.asyncio import Redis, ConnectionPool
from sqlalchemy.ext.asyncio import (
    create_async_engine,
    async_sessionmaker,
    AsyncSession,
)


class State:
    def __init__(
        self,
        settings: Settings,
        session: ClientSession,
        oauth: SpotifyOAuth,
        redis: RedisCore,
        db: async_sessionmaker[AsyncSession],
    ):
        self.settings = settings
        self.session = session
        self.oauth = oauth
        self.redis = redis
        self.db = db


@asynccontextmanager
async def build_state(settings: Settings) -> AsyncIterator[State]:
    async with AsyncExitStack() as stack:
        engine = create_async_engine(settings.postgres.url, echo=settings.debug)
        stack.push_async_callback(engine.dispose)

        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

        db = async_sessionmaker(bind=engine, expire_on_commit=False)

        session = await stack.enter_async_context(ClientSession())

        redis_pool = ConnectionPool.from_url(
            settings.redis.url,
            password=settings.redis.password,
            decode_responses=True,
        )
        stack.push_async_callback(redis_pool.aclose)

        redis = RedisCore(
            redis=Redis(connection_pool=redis_pool),
            encryption_key=settings.redis.encryption_key,
        )

        oauth = SpotifyOAuth(
            client_id=settings.spotify.client_id,
            client_secret=settings.spotify.client_secret,
            scope=settings.spotify.scope,
            redirect_uri=settings.callback_url,
            cache_handler=DummyCacheHandler(),
        )

        yield State(
            settings=settings,
            db=db,
            redis=redis,
            session=session,
            oauth=oauth,
        )
