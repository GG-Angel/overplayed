import core.redis
import core.database
from sqlalchemy.ext.asyncio import AsyncSession
from typing import AsyncIterator
from core.config import APP_STATE_KEY, Settings
from aiohttp import ClientSession
from spotipy import SpotifyOAuth
from fastapi import Depends, Request
from .state import State


def get_state(request: Request) -> State:
    return request.app.state[APP_STATE_KEY]


def get_settings(state: State = Depends(get_state)) -> Settings:
    return state.settings


def get_oauth(state: State = Depends(get_state)) -> SpotifyOAuth:
    return state.oauth


def get_session(state: State = Depends(get_state)) -> ClientSession:
    return state.session
