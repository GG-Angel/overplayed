from core.database import init_db
from core.config import settings
from state import build_state
import asyncio
import server


async def main():
    await init_db()
    await server.start(build_state(settings))


if __name__ == "__main__":
    asyncio.run(main())
