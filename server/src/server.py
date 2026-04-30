from loguru import logger
import uvicorn
from fastapi import FastAPI
from settings import Settings
from routes import auth

STATE_KEY = "state"


async def start(settings: Settings):
    app = FastAPI()

    app.state[STATE_KEY] = settings

    app.include_router(auth.router)

    config = uvicorn.Config(app, host="0.0.0.0", port=8080)
    server = uvicorn.Server(config)
    await server.serve()

    logger.info(f"Server started at {config.host}:{config.port}")
