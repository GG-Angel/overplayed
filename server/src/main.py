from state import State
import server
import asyncio


async def main():
    state = State()

    await server.start(state)


if __name__ == "__main__":
    asyncio.run(main())
