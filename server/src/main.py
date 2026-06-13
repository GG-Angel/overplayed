import asyncio
import server
from server import build_app
from core.database import init_db
from core.config import settings


async def main():
    await init_db()
    await server.start(build_app(settings))


if __name__ == "__main__":
    asyncio.run(main())
