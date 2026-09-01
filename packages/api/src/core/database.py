from collections.abc import AsyncGenerator

from fastapi import Depends
from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import declarative_base

from src.settings import Settings
from src.state import State, get_state

Base = declarative_base()


def build_engine(settings: Settings) -> AsyncEngine:
    return create_async_engine(settings.postgres_url, echo=False, future=True)


def build_sessionmaker(engine: AsyncEngine) -> async_sessionmaker[AsyncSession]:
    return async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def get_db(state: State = Depends(get_state)) -> AsyncGenerator[AsyncSession]:
    async with state.db_sessionmaker() as session:
        try:
            yield session
        finally:
            await session.close()
