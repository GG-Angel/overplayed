CREATE TABLE IF NOT EXISTS track_deletions (
    id SERIAL PRIMARY KEY,
    user_id CHAR(22) NOT NULL,
    tracks_deleted INT NOT NULL CHECK (tracks_deleted > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
