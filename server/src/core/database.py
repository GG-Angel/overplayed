from core.config import Settings
from typing import AsyncGenerator
from fastapi import Depends
from sqlalchemy.orm import declarative_base
from state import get_app_state, State
from sqlalchemy.ext.asyncio import (
    create_async_engine,
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
)

Base = declarative_base()


def build_engine(settings: Settings) -> AsyncEngine:
    return create_async_engine(settings.db_url, echo=False, future=True)


def build_sessionmaker(engine: AsyncEngine) -> async_sessionmaker[AsyncSession]:
    return async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def init_db(engine: AsyncEngine) -> None:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def get_db(state: State = Depends(get_app_state)) -> AsyncGenerator[AsyncSession]:
    async with state.db_sessionmaker() as session:
        try:
            yield session
        finally:
            await session.close()
