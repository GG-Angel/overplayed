import asyncio
from models import SpotifyCurrentUser
from spotipy import Spotify
from cache.client import RedisClient


class SpotifyClient:
    def __init__(self, spotify: Spotify, user_id: str):
        self.spotify = spotify
        self.user_id = user_id

    async def get_user(self, redis: RedisClient) -> SpotifyCurrentUser:
        if user := await redis.get_user(self.user_id):
            return user

        user = SpotifyCurrentUser.model_validate(
            await asyncio.to_thread(self.spotify.current_user)
        )
        await redis.set_user(user)
        return user
