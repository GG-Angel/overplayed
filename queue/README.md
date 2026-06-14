# User Management Service

This queue service aims to automatically manage the User Management table for Spotify apps in Development Mode.

However, due to significant hurdles from Spotify in maintaining this service (harsh rate limits, lack of API support, and only allowing 5 new users every 24 hours), I've decided to discontinue it for the time being.

The future goal will be to allow users to submit a form that will automatically insert their information into the User Management table. Existing users would be evicted after 24 hours. This will help streamline auth so I don't have to maintain it myself.
