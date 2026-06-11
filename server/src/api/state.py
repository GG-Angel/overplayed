from aiohttp import ClientSession
from spotipy import SpotifyOAuth
from core.config import Settings


class State:
    def __init__(
        self,
        settings: Settings,
        session: ClientSession,
        oauth: SpotifyOAuth,
    ):
        self.settings = settings
        self.session = session
        self.oauth = oauth


def build_state(settings: Settings) -> State:
    session = ClientSession()

    oauth = SpotifyOAuth(
        client_id=settings.spotify.client_id,
        client_secret=settings.spotify.client_secret,
        redirect_uri=settings.callback_url,
        scope=settings.spotify.scope,
    )

    return State(settings=settings, session=session, oauth=oauth)
