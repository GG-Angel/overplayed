from spotipy import SpotifyOAuth
from settings import Settings
from cache.pool import create_pool, close_pool
from cache.dummy import DummyCacheHandler
from redis.asyncio import ConnectionPool, Redis


class State:
    def __init__(self):
        self.settings: Settings = Settings()
        self.redis_pool: ConnectionPool = create_pool(self.settings.redis)
        self.oauth: SpotifyOAuth = SpotifyOAuth(
            client_id=self.settings.spotify.client_id,
            client_secret=self.settings.spotify.client_secret,
            scope=self.settings.spotify.scope,
            redirect_uri=self.settings.spotify.callback_url,
            cache_handler=DummyCacheHandler(),
        )

    def redis(self) -> Redis:
        return Redis(connection_pool=self.redis_pool)

    async def __aenter__(self):
        return self

    async def __aexit__(self, *_):
        await close_pool(self.redis_pool)
