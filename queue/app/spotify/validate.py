import json
from bs4 import BeautifulSoup
import asyncio
from loguru import logger
from aiohttp import ClientSession


class UserValidator:
    def __init__(self, session: ClientSession):
        self.session = session

    async def does_user_exist(self, email: str) -> bool:
        async with self.session.get(
            "https://spclient.wg.spotify.com/signup/public/v2/account/validate",
            json={
                "fields": [{"field": "FIELD_EMAIL", "value": email}],
                "client_info": {"api_key": "..."},
            },
        ) as response:
            data = await response.json()
            if "success" in data:
                return True

            if "error" not in data:
                logger.warning("Bad response did not contain an error block.")
                return False

            return True  # TODO: fix later

    async def _fetch_api_key(self) -> str:
        async with self.session.get("https://www.spotify.com/us/signup") as response:
            soup = BeautifulSoup(await response.text(), "html.parser")

            script_tag = soup.find("script", id="__NEXT_DATA__")
            if not script_tag:
                raise RuntimeError("No tag found with id __NEXT_DATA__")

            data = json.loads(script_tag.text)
            return data["props"]["pageProps"]["keys"]["signupServiceAppKey"]


async def main():
    async with ClientSession() as session:
        validator = UserValidator(session)
        key = await validator._fetch_api_key()
        print(key)


if __name__ == "__main__":
    asyncio.run(main())
