from time import time
from spotipy import SpotifyOAuth, Spotify
from settings import STATE_KEY, Settings
from state import State
from fastapi import Request, Cookie, HTTPException
from cache.client import RedisClient
from models import TokenInfo, SessionInfo
from spotify.client import SpotifyClient

TOKEN_EXPIRY_BUFFER = 120


def get_app_state(request: Request) -> State:
    return request.app.state[STATE_KEY]


def get_redis(request: Request) -> RedisClient:
    return get_app_state(request).redis()


def get_settings(request: Request) -> Settings:
    return get_app_state(request).settings


def get_oauth(request: Request) -> SpotifyOAuth:
    return get_app_state(request).oauth


def is_token_expired(token: TokenInfo) -> bool:
    return token.expires_at - int(time()) < TOKEN_EXPIRY_BUFFER


async def refresh_token(request: Request, token: TokenInfo) -> TokenInfo:
    oauth = get_oauth(request)
    new_token = TokenInfo(**oauth.refresh_access_token(token.refresh_token))
    return new_token


async def get_spotify(request: Request, session_id: str = Cookie()) -> SpotifyClient:
    redis = get_redis(request)
    session = await redis.get_session(session_id)

    if not session:
        raise HTTPException(status_code=401, detail="Login required.")

    if is_token_expired(session):
        new_token = await refresh_token(request, session)
        session = SessionInfo(user_id=session.user_id, **new_token.model_dump())
        await redis.set_session(session_id, session)

    spotify = Spotify(auth=session.access_token)
    return SpotifyClient(spotify, user_id=session.user_id)
