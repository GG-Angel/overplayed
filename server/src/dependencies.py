from time import time
from spotipy import SpotifyOAuth, Spotify
from settings import STATE_KEY, Settings
from state import State
from fastapi import Request, Cookie, HTTPException
from cache.client import RedisClient
from models import TokenInfo

TOKEN_EXPIRY_BUFFER = 120


def get_app_state(request: Request) -> State:
    return request.app.state[STATE_KEY]


def get_redis(request: Request) -> RedisClient:
    return get_app_state(request).redis()


def get_settings(request: Request) -> Settings:
    return get_app_state(request).settings


def get_oauth(request: Request) -> SpotifyOAuth:
    return get_app_state(request).oauth


def _is_token_expired(token: TokenInfo) -> bool:
    return token.expires_at - int(time()) < TOKEN_EXPIRY_BUFFER


async def _refresh_token(
    request: Request, session_id: str, token: TokenInfo
) -> TokenInfo:
    oauth, redis = get_oauth(request), get_redis(request)
    new_token = TokenInfo(**oauth.refresh_access_token(token.refresh_token))
    await redis.set_session(session_id, new_token)
    return new_token


async def get_spotify(request: Request, session_id: str = Cookie()) -> Spotify:
    redis = get_redis(request)
    token = await redis.get_session(session_id)

    if not token:
        raise HTTPException(status_code=401, detail="Login required.")

    if _is_token_expired(token):
        token = await _refresh_token(request, session_id, token)

    return Spotify(auth=token.access_token)
