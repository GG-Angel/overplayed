from settings import Settings
import server
import asyncio


async def main():
    settings = Settings()

    await server.start(settings)


if __name__ == "__main__":
    asyncio.run(main())
