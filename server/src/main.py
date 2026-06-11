from core.config import settings
import asyncio
import server


async def main():
    await server.start(settings=settings)


if __name__ == "__main__":
    asyncio.run(main())
