import json
import asyncio
from bs4 import BeautifulSoup
from aiohttp import ClientSession


class UserValidator:
    def __init__(self, session: ClientSession, api_key: str):
        self.session = session
        self.api_key = api_key

    @classmethod
    async def create(cls, session: ClientSession) -> "UserValidator":
        return cls(session, await cls._fetch_api_key(session))

    async def does_user_exist(self, email: str, _retried: bool = False) -> bool:
        async with self.session.post(
            "https://spclient.wg.spotify.com/signup/public/v2/account/validate",
            json={
                "fields": [{"field": "FIELD_EMAIL", "value": email}],
                "client_info": {"api_key": self.api_key},
            },
        ) as response:
            data = await response.json()
            if "error" not in data:
                return False

            error = data["error"]
            if "already_exists" in error:
                return True

            if "field_errors" in error.get("invalid_argument", {}):
                raise ValueError("Invalid email.")

            if _retried:
                raise RuntimeError("API key refresh failed.")

            self.api_key = await self._fetch_api_key(self.session)
            return await self.does_user_exist(email, _retried=True)

    @staticmethod
    async def _fetch_api_key(session: ClientSession) -> str:
        async with session.get("https://www.spotify.com/us/signup") as response:
            soup = BeautifulSoup(await response.text(), "html.parser")
            script_tag = soup.find("script", id="__NEXT_DATA__")
            if not script_tag:
                raise RuntimeError("No script tag found with id __NEXT_DATA__")
            data = json.loads(script_tag.text)
            return data["props"]["pageProps"]["keys"]["signupServiceAppKey"]


async def main():
    async with ClientSession() as session:
        validator = await UserValidator.create(session)
        print(await validator.does_user_exist("example@gmail.com"))


if __name__ == "__main__":
    asyncio.run(main())
