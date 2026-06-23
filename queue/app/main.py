from loguru import logger
from aiohttp import ClientSession, ClientResponseError
from cryptography.fernet import Fernet
from redis.asyncio import Redis, ConnectionPool
from contextlib import asynccontextmanager
from fastapi import FastAPI
from state import State
from settings import APP_STATE_KEY, settings
from spotify.token import seed_refresh_token, TokenManager
from spotify.validate import UserValidator
from spotify.users import UserManager


@asynccontextmanager
async def lifespan(app: FastAPI):
    session = ClientSession()
    redis_pool = ConnectionPool.from_url(
        settings.redis_url, decode_responses=True, max_connections=10
    )

    try:
        redis = Redis(connection_pool=redis_pool)
        fernet = Fernet(settings.redis_key)
        validator = await UserValidator.create(session)
        auth = TokenManager(session, redis, fernet, settings.spotify_auth_client_id)
        users = UserManager(session, redis, auth, settings.spotify_app_client_id)

        # seed and verify credentials
        await seed_refresh_token(redis, fernet, settings.spotify_refresh_token)
        try:
            await auth.get_access_token()
        except ClientResponseError:
            logger.error("Invalid Spotify refresh token or auth client id. Please renew.")  # fmt: skip
            raise

        app.state[APP_STATE_KEY] = State(validator=validator, auth=auth, users=users)
        yield
    finally:
        await session.close()
        await redis_pool.aclose()


app = FastAPI(lifespan=lifespan)


@app.get("/")
def healthcheck():
    return ":o"
