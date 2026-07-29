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

## Test Notes

- Fix card clipping on narrow screens (min height)
- Error message when song can’t play

- Previews aren’t available for niche songs

- Randomization option would be nice

- Get access status automatically for logged in users
- Display status

- Add more icons to buttons

- Add keyboard shortcuts for swiping and handling previews

  - space for pause/play
  - left/right arrows for swiping

- Save volume to local storage
- Save access creds to local storage
- Revert default view back to cards for playlist selector
