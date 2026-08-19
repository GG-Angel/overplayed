import asyncio

import main
import pytest


@pytest.mark.asyncio
async def test_serve_gracefully_stops_remaining_servers(monkeypatch):
    servers = []

    class FakeServer:
        def __init__(self, config):
            self.index = len(servers)
            self.should_exit = False
            self.cancelled = False
            self.stopped = False
            servers.append(self)

        async def serve(self):
            try:
                if self.index == 0:
                    return
                while not self.should_exit:
                    await asyncio.sleep(0)
                self.stopped = True
            except asyncio.CancelledError:
                self.cancelled = True
                raise

    monkeypatch.setattr(main.uvicorn, "Server", FakeServer)

    configs = [
        main.uvicorn.Config("example:app"),
        main.uvicorn.Config("example:app"),
    ]
    await main.serve(configs)

    assert all(server.should_exit for server in servers)
    assert servers[1].stopped
    assert not servers[1].cancelled
