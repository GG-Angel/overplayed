from fastapi import FastAPI
from starlette.middleware.sessions import SessionMiddleware

from app.routes import auth, playlists
from app.core.config import config
from app.core.logger import setup_logging

setup_logging()

app = FastAPI()

app.add_middleware(SessionMiddleware, secret_key=config.session_secret_key)

app.include_router(auth.router, prefix="/auth", include_in_schema=False)
app.include_router(playlists.router, prefix="/playlists")


@app.get("/")
async def root():
    return "Hello, world!"
