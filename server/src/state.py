from spotipy import SpotifyOAuth
from settings import Settings


class State:
    def __init__(self):
        self.settings: Settings = Settings()
        self.oauth: SpotifyOAuth = SpotifyOAuth(
            client_id=self.settings.spotify.client_id,
            client_secret=self.settings.spotify.client_secret,
            scope=self.settings.spotify.scope,
            redirect_uri=self.settings.spotify.callback_url,
        )
