import core.redis
from core.config import APP_STATE_KEY, Settings
from aiohttp import ClientSession
from spotipy import SpotifyOAuth
from fastapi import Depends, Request
from .state import State
from .cache.client import RedisClient


def get_state(request: Request) -> State:
    return request.app.state[APP_STATE_KEY]


def get_settings(state: State = Depends(get_state)) -> Settings:
    return state.settings


def get_oauth(state: State = Depends(get_state)) -> SpotifyOAuth:
    return state.oauth


def get_session(state: State = Depends(get_state)) -> ClientSession:
    return state.session


async def get_redis(settings: Settings = Depends(get_settings)) -> RedisClient:
    async with core.redis.get_session() as session:
        return RedisClient(redis=session, encryption_key=settings.redis.encryption_key)
