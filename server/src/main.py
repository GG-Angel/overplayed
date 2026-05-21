import server
import asyncio
from settings import Settings
from state import build_state


async def main():
    async with build_state(Settings()) as state:
        await server.start(state)


if __name__ == "__main__":
    asyncio.run(main())
