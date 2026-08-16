When a user requests access:

1. Check if the user is already in the queue or app.
   If yes, return status. If no, start background task and return message:
   "An email will be sent if the account exists".

Background task:

1. If a task already exists for this email, abort (concurrency).
2. If a token already exists for this email, abort (early dedup).
3. Validate that the Spotify account exists. If no, stop task.
4. Generate a single-use token. 15 minute expiration. Store in Redis with TTL.
   - Use SETNX: sets only if the token doesn't exist atomically
   - The token must be URL safe.
5. If a token was set, send an email to the user under the gaelangel.com domain.

Email flow:

1. User clicks the link: GET /verify?token=a1b2c3d4-e5f6-7890-abcd-ef1234567890
   - Emails can only trigger GETs.
2. Fetch and delete token from Redis atomically: GETDEL.
   - If null, reject (already used or invalid token).
3. If valid, add user to queue and process. Redirect to frontend with status code displayed.
