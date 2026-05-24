import asyncpg
from contextlib import asynccontextmanager
from typing import AsyncIterator
from spotipy import SpotifyOAuth
from settings import Settings
from aiohttp import ClientSession
from cache import RedisCore, DummyCacheHandler
from redis.asyncio import Redis, ConnectionPool


class State:
    def __init__(
        self,
        settings: Settings,
        session: ClientSession,
        oauth: SpotifyOAuth,
        redis: RedisCore,
        db: asyncpg.Pool,
    ):
        self.settings = settings
        self.session = session
        self.oauth = oauth
        self.redis = redis
        self.db = db


@asynccontextmanager
async def build_state(settings: Settings) -> AsyncIterator[State]:
    async with (
        ClientSession() as session,
        asyncpg.create_pool(dsn=settings.postgres.url) as db,
    ):
        redis_pool = ConnectionPool.from_url(
            settings.redis.url, password=settings.redis.password, decode_responses=True
        )

        try:
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
        finally:
            await redis_pool.aclose()
