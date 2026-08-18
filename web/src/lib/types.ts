import { z } from "zod";

/// Api

export const LIKED_SONGS_ID = "liked-songs";

export const externalUrlsSchema = z.object({
  spotify: z.url(),
});

export const resourceSchema = z.object({
  id: z.string(),
  uri: z.string(),
});

export const imageSchema = z.object({
  url: z.url(),
  width: z.number().int().nullable(),
  height: z.number().int().nullable(),
});

export const userSchema = resourceSchema.extend({
  display_name: z.string().nullable(),
  external_urls: externalUrlsSchema,
});

export const currentUserSchema = userSchema.extend({
  email: z.email(),
  images: z.array(imageSchema),
});

export const artistSchema = resourceSchema.extend({
  name: z.string(),
  external_urls: externalUrlsSchema,
});

export const albumSchema = resourceSchema.extend({
  name: z.string(),
  album_type: z.enum(["album", "single", "compilation"]),
  images: z.array(imageSchema),
  release_date: z.string(),
  artists: z.array(artistSchema),
  total_tracks: z.number().int().nonnegative(),
  external_urls: externalUrlsSchema,
});

export const trackSchema = resourceSchema.extend({
  name: z.string(),
  explicit: z.boolean(),
  is_local: z.boolean(),
  duration_ms: z.number().int().nonnegative(),
  album: albumSchema,
  artists: z.array(artistSchema),
  external_urls: externalUrlsSchema,
  external_ids: z.object({ isrc: z.string() }),
});

export const playlistSchema = resourceSchema.extend({
  name: z.string(),
  description: z.string().nullable(),
  collaborative: z.boolean(),
  public: z.boolean(),
  snapshot_id: z.string(),
  owner: userSchema,
  images: z.array(imageSchema).nullable(),
  tracks: z.object({ total: z.number().int().nonnegative() }),
  external_urls: externalUrlsSchema,
});

export const trackPreviewSchema = z.object({
  isrc: z.string(),
  url: z.url().nullable(),
  expires_in: z.number().int().nonnegative().nullable(),
  expires_at: z.number().int().nonnegative().nullable(),
});

export const userMetricsSchema = z.object({
  num_swipes: z.number().int().nonnegative(),
  num_modified: z.number().int().nonnegative(),
  num_cuts: z.number().int().nonnegative(),
  num_kept: z.number().int().nonnegative(),
  cut_rate: z.number().nonnegative(),
});

export const globalMetricsSchema = z.object({
  total_sessions: z.number().int().nonnegative(),
  total_users: z.number().int().nonnegative(),
  total_swipes: z.number().int().nonnegative(),
  total_cuts: z.number().int().nonnegative(),
  cut_rate: z.number().nonnegative(),
});

export const leaderboardSchema = z.array(
  z.object({
    user: z.object({
      id: z.string(),
      display_name: z.string().nullable(),
      spotify_url: z.string(),
      picture_url: z.string().nullable(),
    }),
    metrics: z.object({
      total_swipes: z.number().int().nonnegative(),
      total_cuts: z.number().int().nonnegative(),
      cut_rate: z.number().nonnegative(),
    }),
  })
);

export const swipesFormOptionsSchema = z.object({
  backup_enabled: z.boolean(),
  remove_from_likes: z.boolean(),
});

export const swipeSubmissionFormSchema = z.object({
  uris: z.array(z.string()),
  tracks_swiped: z.number().int().nonnegative(),
  options: swipesFormOptionsSchema,
});

export const swipeSubmissionResponseSchema = z.object({
  backup_playlist: playlistSchema.nullable(),
});

export type Image = z.infer<typeof imageSchema>;
export type User = z.infer<typeof userSchema>;
export type CurrentUser = z.infer<typeof currentUserSchema>;
export type Artist = z.infer<typeof artistSchema>;
export type Album = z.infer<typeof albumSchema>;
export type Track = z.infer<typeof trackSchema>;
export type TrackPreview = z.infer<typeof trackPreviewSchema>;
export type Playlist = z.infer<typeof playlistSchema>;
export type SwipeSubmissionForm = z.infer<typeof swipeSubmissionFormSchema>;
export type SwipeSubmissionResponse = z.infer<typeof swipeSubmissionResponseSchema>;
export type Metrics = z.infer<typeof globalMetricsSchema>;
export type Leaderboard = z.infer<typeof leaderboardSchema>;

/// Queue

export const accessRequestFormSchema = z.object({
  email: z.email("Enter a valid email").trim(),
});

export const queueOverviewSchema = z.object({
  num_active: z.number().min(0),
  num_queued: z.number().min(0),
  user_limit: z.number().min(0),
  next_available_time: z.iso.datetime().nullable(),
});

const queueUserActiveSchema = z.object({
  status: z.literal("active"),
  email: z.email(),
  estimated_end_time: z.iso.datetime(),
});

const queueUserInQueueSchema = z.object({
  status: z.literal("in_queue"),
  email: z.email(),
  position_in_queue: z.number().int(),
  estimated_start_time: z.iso.datetime(),
});

export const queueUserStatusSchema = z.discriminatedUnion("status", [
  queueUserActiveSchema,
  queueUserInQueueSchema,
]);

export type QueueAccessRequest = z.infer<typeof accessRequestFormSchema>;
export type QueueOverview = z.infer<typeof queueOverviewSchema>;
export type QueueUserStatus = z.infer<typeof queueUserStatusSchema>;
