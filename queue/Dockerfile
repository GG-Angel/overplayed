FROM python:3.13-slim

COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

WORKDIR /app

COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-cache

COPY . .

# Run as an unprivileged user
RUN useradd --system --no-create-home appuser && chown -R appuser /app
USER appuser

EXPOSE 8000

CMD ["uv", "run", "--no-cache", "fastapi", "run", "app/main.py", "--port", "8000", "--proxy-headers", "--forwarded-allow-ips", "*"]