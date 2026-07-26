import asyncio
import server
from server import build_app
from settings import settings


async def main():
    app = build_app(settings)
    await server.start(app)


if __name__ == "__main__":
    asyncio.run(main())
