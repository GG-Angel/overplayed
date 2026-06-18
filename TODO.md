# TODO List

## Needs

- Add liked songs as a playlist option.
- Use available-media option for getting playlist items to avoid manual track filtering.
- Cache leaderboard response.
- Add a modal warning when leaving the swipe page with unsaved changes.
- Test website on mobile devices.

## Nice to Haves

- Add a page to show the user's history and personal stats.
- Pile in the background on completion of deleted tracks.

## Queue System Breakthrough Oh My Goodness

- Block duplicate emails from the queue or for already existing users (unique).
- To check if a user actually exists, hit Spotify's signup endpoint with their email. Will receive a 400 if already exists: { already_exists: {} }
  - POST https://spclient.wg.spotify.com/signup/public/v2/account/validate
  - Get "signupServiceAppKey":"a1e486e2729f46d6bb368d6b2bcda326" from page source of signup page.
  - If we get "invalid_argument" back, refresh the app key.
  - If user does not exist after user sends request 3 times, ban IP for like 1 week to annoy them.
