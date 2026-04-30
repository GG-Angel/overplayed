from state import State
import uvicorn
from fastapi import FastAPI
from settings import STATE_KEY
from routes import auth


async def start(state: State):
    app = FastAPI()

    app.state[STATE_KEY] = state

    app.include_router(auth.router, prefix="/auth", tags=["spotify", "auth"])

    config = uvicorn.Config(app, host="0.0.0.0", port=8080)
    server = uvicorn.Server(config)
    await server.serve()
