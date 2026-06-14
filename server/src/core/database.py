import asyncio
from pathlib import Path
from core.config import Settings
from typing import AsyncGenerator
from fastapi import Depends
from alembic import command
from alembic.config import Config
from sqlalchemy.orm import declarative_base
from state import get_app_state, State
from sqlalchemy.ext.asyncio import (
    create_async_engine,
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
)

Base = declarative_base()

# server/alembic.ini, alongside the migrations/ directory.
_ALEMBIC_INI = Path(__file__).resolve().parents[2] / "alembic.ini"


def build_engine(settings: Settings) -> AsyncEngine:
    return create_async_engine(settings.db_url, echo=False, future=True)


def build_sessionmaker(engine: AsyncEngine) -> async_sessionmaker[AsyncSession]:
    return async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def run_migrations() -> None:
    """Apply pending Alembic migrations (equivalent to `alembic upgrade head`)."""
    await asyncio.to_thread(command.upgrade, Config(str(_ALEMBIC_INI)), "head")


async def get_db(state: State = Depends(get_app_state)) -> AsyncGenerator[AsyncSession]:
    async with state.db_sessionmaker() as session:
        try:
            yield session
        finally:
            await session.close()
