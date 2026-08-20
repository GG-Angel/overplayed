import os

TEST_SETTINGS = {
    "APP_FRONTEND_URL": "https://app.example.com",
    "APP_QUEUE_URL": "https://queue.example.com",
    "SPOTIFY_CLIENT_ID": "spotify-client",
    "SPOTIFY_AUTH_CLIENT_ID": "spotify-auth-client",
    "SPOTIFY_REFRESH_TOKEN": "spotify-refresh-token",
    "REDIS_USER": "redis-user",
    "REDIS_HOST": "localhost",
    "REDIS_PORT": "6379",
    "REDIS_PASSWORD": "redis-password",
    "REDIS_KEY": "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
    "CLOUDFLARE_TURNSTILE_SECRET": "turnstile-secret",
    "RESEND_API_KEY": "resend-key",
}

for name, value in TEST_SETTINGS.items():
    os.environ.setdefault(name, value)
