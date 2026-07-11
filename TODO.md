# TODO List

## Needs

- Add queue rate limits.
- Test website on mobile devices.

## CI/CD Notes

- Run alembic inside server container with 'uv run --no-cache alembic upgrade head'.

## Nice to Haves

- Pile in the background on completion of deleted tracks.
- Cache leaderboard response.
- Save request access credentials to local storage and fill them automatically on page visit?
- Add ability to check the user's current queue status.
- Show how long until the next spot is open if a user were to request access rn.

## Queue System Breakthrough Oh My Goodness

- Block duplicate emails from the queue or for already existing users (unique).
- To check if a user actually exists, hit Spotify's signup endpoint with their email. Will receive a 400 if already exists: { already_exists: {} }
  - POST https://spclient.wg.spotify.com/signup/public/v2/account/validate
  - Get "signupServiceAppKey":"a1e486e2729f46d6bb368d6b2bcda326" from page source of signup page.
  - If we get "invalid_argument" back, refresh the app key.
  - If user does not exist after user sends request 3 times, ban IP for like 1 week to annoy them.
