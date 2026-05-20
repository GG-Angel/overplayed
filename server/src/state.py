from spotipy import SpotifyOAuth
from settings import Settings
from cache.dummy import DummyCacheHandler
from redis.asyncio import Redis, ConnectionPool
from aiohttp import ClientSession
from cache.core import RedisCore


class State:
    def __init__(self):
        self.settings = Settings()
        self.oauth = SpotifyOAuth(
            client_id=self.settings.spotify.client_id,
            client_secret=self.settings.spotify.client_secret,
            scope=self.settings.spotify.scope,
            redirect_uri=self.settings.spotify.callback_url,
            cache_handler=DummyCacheHandler(),
        )
        self.deezer_session = ClientSession(base_url=self.settings.deezer.base_url)

        self._redis_pool = ConnectionPool.from_url(
            self.settings.redis.url,
            password=self.settings.redis.password,
            max_connections=self.settings.redis.max_connections,
            decode_responses=True,
        )

        self.redis = RedisCore(
            redis=Redis(connection_pool=self._redis_pool),
            encryption_key=self.settings.redis.encryption_key,
        )

    async def __aenter__(self):
        return self

    async def __aexit__(self, *_):
        await self.deezer_session.close()
        await self._redis_pool.aclose()
