import asyncio
import server


async def main():
    await server.start()


if __name__ == "__main__":
    asyncio.run(main())
