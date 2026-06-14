import asyncio
from datetime import datetime
from pydantic import BaseModel
from aiohttp import ClientSession
from core.settings import settings


class NewUser(BaseModel):
    name: str
    email: str


class User(BaseModel):
    id: str
    name: str
    email: str
    clientId: str
    createdAt: datetime
    needsAnonymization: bool


class GetUsersResponse(BaseModel):
    users: list[User]


class UserManager:
    def __init__(self, session: ClientSession, client_id: str):
        self._session = session
        self._client_id = client_id

    async def get_users(self) -> list[User]:
        async with self._session.get(
            f"/api/s4d/warp/clients/{self._client_id}/users"
        ) as response:
            return GetUsersResponse.model_validate(await response.json()).users

    async def add_user(self, user: NewUser) -> User:
        async with self._session.post(
            f"/api/ws4d/warp/clients/{self._client_id}/users",
            json=user.model_dump(),
        ) as response:
            return User.model_validate(await response.json())

    async def remove_user(self, user_id: str):
        await self._session.delete(
            f"/api/ws4d/warp/clients/{self._client_id}/users/id/{user_id}"
        )


async def main():
    async with ClientSession(
        base_url="https://developer.spotify.com",
        headers={"Authorization": f"Bearer {settings.spotify_bearer_token}"},
        raise_for_status=True,
    ) as session:
        manager = UserManager(client_id=settings.spotify_client_id, session=session)

        print("adding user")
        new_user = NewUser(name="Joe Mama", email="idontexist@gmail.com")
        print(await manager.add_user(new_user))

        print("getting users")
        print(await manager.get_users())


if __name__ == "__main__":
    asyncio.run(main())
