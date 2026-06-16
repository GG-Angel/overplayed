import asyncio
import server
from server import build_app
from settings import settings


async def main():
    await server.start(build_app(settings))


if __name__ == "__main__":
    asyncio.run(main())
