import { z } from "zod";

export const externalUrlsSchema = z.object({
  spotify: z.url(),
});

export const externalIdsSchema = z.object({
  isrc: z.string(),
});

export const resourceRefSchema = z.object({
  id: z.string(),
  uri: z.string(),
});

export const imageSchema = z.object({
  url: z.url(),
  width: z.number().int().nullable(),
  height: z.number().int().nullable(),
});

export const userSchema = resourceRefSchema.extend({
  display_name: z.string().nullable(),
  external_urls: externalUrlsSchema,
});

export const currentUserSchema = userSchema.extend({
  email: z.email(),
  images: z.array(imageSchema),
});

export const artistSchema = resourceRefSchema.extend({
  name: z.string(),
  external_urls: externalUrlsSchema,
});

export const albumSchema = resourceRefSchema.extend({
  name: z.string(),
  album_type: z.enum(["album", "single", "compilation"]),
  images: z.array(imageSchema),
  release_date: z.string(),
  artists: z.array(artistSchema),
  total_tracks: z.number().int().nonnegative(),
  external_urls: externalUrlsSchema,
});

export const trackSchema = resourceRefSchema.extend({
  name: z.string(),
  explicit: z.boolean(),
  is_local: z.boolean(),
  duration_ms: z.number().int().nonnegative(),
  album: albumSchema,
  artists: z.array(artistSchema),
  external_urls: externalUrlsSchema,
  external_ids: externalIdsSchema,
});

export const playlistTrackCountSchema = z.object({
  total: z.number().int().nonnegative(),
});

export const playlistMetadataSchema = resourceRefSchema.extend({
  name: z.string(),
  description: z.string().nullable(),
  collaborative: z.boolean(),
  public: z.boolean(),
  snapshot_id: z.string(),
  owner: userSchema,
  images: z.array(imageSchema).nullable(),
  tracks: playlistTrackCountSchema,
  external_urls: externalUrlsSchema,
});

export const playlistItemSchema = z.object({
  added_at: z.iso.datetime(),
  track: trackSchema,
});

export const playlistPageMetadataSchema = z.object({
  has_more: z.boolean(),
  next_offset: z.number().int().nonnegative().nullable(),
});

export const playlistPageSchema = z.object({
  metadata: playlistPageMetadataSchema,
  items: z.array(playlistItemSchema),
});

export const trackPreviewSchema = z.object({
  isrc: z.string(),
  url: z.url().nullable(),
  expires_in: z.number().int().nonnegative().nullable(),
  expires_at: z.number().int().nonnegative().nullable(),
});

const swipeMetricsSchema = z.object({
  total_swipes: z.number().int().nonnegative(),
  total_cuts: z.number().int().nonnegative(),
  cut_rate: z.number().nonnegative(),
});

const userResponseSchema = z.object({
  id: z.string(),
  display_name: z.string().nullable(),
  spotify_url: z.string(),
  picture_url: z.string().nullable(),
});

export const globalSwipeMetricsSchema = swipeMetricsSchema.extend({
  total_sessions: z.number().int().nonnegative(),
  total_users: z.number().int().nonnegative(),
});

export const swipeLeaderboardSchema = z.array(
  z.object({
    user: userResponseSchema,
    metrics: swipeMetricsSchema,
  })
);

export const swipesFormOptionsSchema = z.object({
  backup_enabled: z.boolean(),
});

export const swipesFormSchema = z.object({
  uris: z.array(z.string()),
  tracks_swiped: z.number().int().nonnegative(),
  options: swipesFormOptionsSchema,
});

export const swipesResponseSchema = z.object({
  backup_playlist: playlistMetadataSchema.nullable(),
});

export type Image = z.infer<typeof imageSchema>;
export type User = z.infer<typeof userSchema>;
export type CurrentUser = z.infer<typeof currentUserSchema>;
export type Artist = z.infer<typeof artistSchema>;
export type Album = z.infer<typeof albumSchema>;
export type Track = z.infer<typeof trackSchema>;
export type PlaylistMetadata = z.infer<typeof playlistMetadataSchema>;
export type PlaylistTrackCount = z.infer<typeof playlistTrackCountSchema>;
export type PlaylistItem = z.infer<typeof playlistItemSchema>;
export type PlaylistPageMetadata = z.infer<typeof playlistPageMetadataSchema>;
export type PlaylistPage = z.infer<typeof playlistPageSchema>;
export type TrackPreview = z.infer<typeof trackPreviewSchema>;
export type GlobalSwipeMetrics = z.infer<typeof globalSwipeMetricsSchema>;
export type SwipesFormOptions = z.infer<typeof swipesFormOptionsSchema>;
export type SwipesForm = z.infer<typeof swipesFormSchema>;
export type SwipesResponse = z.infer<typeof swipesResponseSchema>;
export type SwipeLeaderboard = z.infer<typeof swipeLeaderboardSchema>;
