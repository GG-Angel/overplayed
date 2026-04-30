from contextlib import asynccontextmanager
import uvicorn
from fastapi import FastAPI
from settings import STATE_KEY
from routes import auth, root
from state import State


async def start(state: State):
    @asynccontextmanager
    async def lifespan(app: FastAPI):
        async with state:
            yield  # glues enter/exit signals to fastapi

    app = FastAPI(lifespan=lifespan)

    app.state[STATE_KEY] = state

    app.include_router(root.router)
    app.include_router(auth.router, prefix="/auth", tags=["spotify", "auth"])

    config = uvicorn.Config(app, host="0.0.0.0", port=8080)
    server = uvicorn.Server(config)
    await server.serve()
