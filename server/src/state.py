from fastapi import Request, Depends
from aiohttp import ClientSession
from spotipy import SpotifyOAuth
from core.config import Settings, APP_STATE_KEY


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


def get_app_state(request: Request) -> State:
    return request.app.state[APP_STATE_KEY]


def get_settings(state: State = Depends(get_app_state)) -> Settings:
    return state.settings


def get_oauth(state: State = Depends(get_app_state)) -> SpotifyOAuth:
    return state.oauth


def get_session(state: State = Depends(get_app_state)) -> ClientSession:
    return state.session
