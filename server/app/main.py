from fastapi import FastAPI
from starlette.middleware.sessions import SessionMiddleware

from app.api import auth
from app.core.config import config
from app.core.logger import setup_logging

setup_logging()

app = FastAPI()

app.add_middleware(SessionMiddleware, secret_key=config.session_secret_key)

app.include_router(auth.router, prefix="/auth")


@app.get("/")
async def root():
    return "Hello, world!"
