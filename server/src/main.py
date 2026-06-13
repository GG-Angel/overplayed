import asyncio
import server
from core.config import settings
from state import build_state


async def main():
    await server.start(build_state(settings))


if __name__ == "__main__":
    asyncio.run(main())
