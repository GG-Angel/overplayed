from fastapi import FastAPI

from src.core.logger import setup_logging

setup_logging()

app = FastAPI()


@app.get("/")
async def root():
    return "Hello, world!"
