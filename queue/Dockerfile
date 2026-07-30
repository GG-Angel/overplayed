FROM python:3.13-slim

COPY --from=ghcr.io/astral-sh/uv:0.12.0 /uv /uvx /bin/

WORKDIR /app

COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-cache --no-dev

COPY . .

# Run as an unprivileged user
RUN useradd --system --no-create-home appuser && chown -R appuser /app
USER appuser

EXPOSE 8000

CMD ["uv", "run", "--no-cache", "--no-dev", "fastapi", "run", "app/main.py", "--port", "8000", "--proxy-headers", "--forwarded-allow-ips", "*"]