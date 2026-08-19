import asyncio

import uvicorn
from fastapi import FastAPI
from prometheus_fastapi_instrumentator import Instrumentator


async def serve(configs: list[uvicorn.Config]) -> None:
    servers = [uvicorn.Server(config) for config in configs]
    tasks = [asyncio.create_task(server.serve()) for server in servers]

    try:
        await asyncio.wait(tasks, return_when=asyncio.FIRST_COMPLETED)
    finally:
        for server in servers:
            server.should_exit = True
        await asyncio.gather(*tasks)


async def main():
    from server import build_app

    app = build_app()
    metrics_app = FastAPI()

    Instrumentator().instrument(app).expose(metrics_app)

    configs = [
        uvicorn.Config(
            app,
            host="0.0.0.0",
            port=8080,
            proxy_headers=True,
            forwarded_allow_ips="*",
        ),
        uvicorn.Config(
            metrics_app,
            host="0.0.0.0",
            port=9090,
            log_level="warning",
        ),
    ]

    await serve(configs)


if __name__ == "__main__":
    asyncio.run(main())
