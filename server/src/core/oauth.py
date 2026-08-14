from spotipy import SpotifyOAuth
from spotipy.cache_handler import CacheHandler

from settings import settings


class _NoOpCacheHandler(CacheHandler):
    def get_cached_token(self) -> None:
        return None

    def save_token_to_cache(self, token_info: dict[str, object]) -> None:
        pass


def build_spotify_oauth() -> SpotifyOAuth:
    return SpotifyOAuth(
        client_id=settings.spotify_client_id,
        client_secret=settings.spotify_client_secret,
        redirect_uri=settings.callback_url,
        scope=settings.spotify_scope,
        cache_handler=_NoOpCacheHandler(),
    )
