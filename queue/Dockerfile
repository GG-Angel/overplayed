FROM python:3.14-slim

COPY --from=ghcr.io/astral-sh/uv:0.12.0 /uv /uvx /bin/

WORKDIR /app

COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-cache --no-dev

COPY app ./app

RUN useradd --system --no-create-home appuser && chown -R appuser /app
USER appuser

EXPOSE 8080 9090
CMD ["uv", "run", "--no-sync", "--no-cache", "python", "app/main.py"]