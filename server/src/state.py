from asyncio import Task, Lock
from fastapi import Request, Depends
from aiohttp import ClientSession
from spotipy import SpotifyOAuth
from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, async_sessionmaker
from redis.asyncio import ConnectionPool
from settings import Settings, APP_STATE_KEY


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
        self.background_tasks: set[Task] = set()
        self.playlist_locks: dict[tuple[str, str], Lock] = {}


def get_state(request: Request) -> State:
    return request.app.state[APP_STATE_KEY]


def get_settings(state: State = Depends(get_state)) -> Settings:
    return state.settings


def get_oauth(state: State = Depends(get_state)) -> SpotifyOAuth:
    return state.oauth


def get_session(state: State = Depends(get_state)) -> ClientSession:
    return state.session
