from core.config import settings
from typing import AsyncGenerator
from sqlalchemy.orm import declarative_base
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker

engine = create_async_engine(settings.db_url, echo=False, future=True)

async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

Base = declarative_base()


async def get_db() -> AsyncGenerator[AsyncSession]:
    async with async_session() as session:
        try:
            yield session
        finally:
            await session.close()
