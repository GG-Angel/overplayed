from aiohttp import ClientSession
from fastapi import Depends, Request
from redis.asyncio import ConnectionPool
from spotipy import SpotifyOAuth
from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, async_sessionmaker

from settings import APP_STATE_KEY, Settings


class State:
    def __init__(
        self,
        settings: Settings,
        session: ClientSession,
        oauth: SpotifyOAuth,
        db_engine: AsyncEngine,
        db_sessionmaker: async_sessionmaker[AsyncSession],
        redis_pool: ConnectionPool,
    ):
        self.settings = settings
        self.session = session
        self.oauth = oauth
        self.db_engine = db_engine
        self.db_sessionmaker = db_sessionmaker
        self.redis_pool = redis_pool


def get_state(request: Request) -> State:
    return request.app.state[APP_STATE_KEY]


def get_settings(state: State = Depends(get_state)) -> Settings:
    return state.settings


def get_oauth(state: State = Depends(get_state)) -> SpotifyOAuth:
    return state.oauth


def get_session(state: State = Depends(get_state)) -> ClientSession:
    return state.session
