from settings import settings
from spotipy import SpotifyOAuth


def build_spotify_oauth() -> SpotifyOAuth:
    return SpotifyOAuth(
        client_id=settings.spotify_client_id,
        client_secret=settings.spotify_client_secret,
        redirect_uri=settings.callback_url,
        scope=settings.spotify_scope,
    )
