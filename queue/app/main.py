from contextlib import asynccontextmanager
from fastapi import FastAPI
from state import State
from settings import APP_STATE_KEY


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state[APP_STATE_KEY] = State()

    yield app


app = FastAPI(lifespan=lifespan)
