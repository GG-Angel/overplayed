from spotipy import SpotifyOAuth
from settings import Settings
from cache.pool import create_pool, close_pool
from cache.dummy import DummyCacheHandler
from cache.client import RedisClient
from redis.asyncio import ConnectionPool, Redis
from aiohttp import ClientSession


class State:
    def __init__(self):
        self.settings: Settings = Settings()
        self.oauth: SpotifyOAuth = SpotifyOAuth(
            client_id=self.settings.spotify.client_id,
            client_secret=self.settings.spotify.client_secret,
            scope=self.settings.spotify.scope,
            redirect_uri=self.settings.spotify.callback_url,
            cache_handler=DummyCacheHandler(),
        )
        self.deezer_session: ClientSession = ClientSession(
            base_url=self.settings.deezer.base_url
        )

        self._redis_pool: ConnectionPool = create_pool(self.settings.redis)

    def redis(self) -> RedisClient:
        return RedisClient(
            redis=Redis(connection_pool=self._redis_pool), settings=self.settings.redis
        )

    async def __aenter__(self):
        return self

    async def __aexit__(self, *_):
        await close_pool(self._redis_pool)
