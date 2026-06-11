from spotipy import CacheHandler


class DummyCacheHandler(CacheHandler):
    """Used to avoid spotipy caching behavior since we're using Redis."""

    def get_cached_token(self):
        return

    def save_token_to_cache(self, token_info):
        return
