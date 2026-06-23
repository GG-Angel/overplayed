import json
import asyncio
from bs4 import BeautifulSoup
from aiohttp import ClientSession


class UserValidator:
    @classmethod
    async def create(cls, session: ClientSession) -> "UserValidator":
        return cls(session, await cls._get_signup_key(session))

    @staticmethod
    async def _get_signup_key(session: ClientSession) -> str:
        async with session.get("https://www.spotify.com/us/signup") as response:
            soup = BeautifulSoup(await response.text(), "html.parser")
            script_tag = soup.find("script", id="__NEXT_DATA__")
            if not script_tag:
                raise RuntimeError("Signup page missing __NEXT_DATA__ script tag.")
            data = json.loads(script_tag.text)
            try:
                return data["props"]["pageProps"]["keys"]["signupServiceAppKey"]
            except KeyError as e:
                raise RuntimeError(
                    f"Signup key not found in page JSON: missing {e}."
                ) from e

    def __init__(self, session: ClientSession, signup_key: str):
        self.session = session
        self.signup_key = signup_key

    async def does_user_exist(self, email: str, _retried: bool = False) -> bool:
        async with self.session.post(
            "https://spclient.wg.spotify.com/signup/public/v2/account/validate",
            json={
                "fields": [{"field": "FIELD_EMAIL", "value": email}],
                "client_info": {"api_key": self.signup_key},
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

            self.signup_key = await self._get_signup_key(self.session)
            return await self.does_user_exist(email, _retried=True)


async def main():
    async with ClientSession() as session:
        validator = await UserValidator.create(session)
        print(await validator.does_user_exist("example@gmail.com"))
        print(await validator.does_user_exist("iudawyudg56d67t12byd1@doesnotexist.com"))


if __name__ == "__main__":
    asyncio.run(main())
