import asyncio
from aiohttp import ClientSession
from core.settings import settings

# removing users:
# DELETE https://developer.spotify.com/api/ws4d/warp/clients/<client_id>/users/id/<id>
# no body

# adding users:
# POST https://developer.spotify.com/api/ws4d/warp/clients/<client_id>/users
# body params (JSON):
# clientId	"app client id"
# email	"user email"
# name	"full name"


async def get_users(session: ClientSession):
    async with session.get(
        f"/api/s4d/warp/clients/{settings.spotify_client_id}/users"
    ) as response:
        response.raise_for_status()
        print(await response.json())


async def main():
    async with ClientSession(
        base_url="https://developer.spotify.com",
        headers={"Authorization": f"Bearer {settings.spotify_bearer_token}"},
    ) as session:
        await get_users(session)


if __name__ == "__main__":
    asyncio.run(main())
