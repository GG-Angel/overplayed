CREATE TABLE IF NOT EXISTS swipes (
    id SERIAL PRIMARY KEY,
    user_id CHAR(22) NOT NULL,
    playlist_id CHAR(22) NOT NULL,
    total_tracks INT NOT NULL CHECK (total_tracks > 0),
    tracks_cut INT NOT NULL CHECK (tracks_cut > 0 AND tracks_cut <= total_tracks),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
