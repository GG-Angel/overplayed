import { z } from "zod";

export const externalUrlsSchema = z.object({
  spotify: z.url(),
});

export const externalIdsSchema = z.object({
  isrc: z.string(),
});

export const resourceRefSchema = z.object({
  href: z.url(),
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

export const playlistSchema = resourceRefSchema.extend({
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
  added_by: resourceRefSchema,
  is_local: z.boolean(),
  track: trackSchema,
});

export const playlistItemsPageSchema = z.object({
  total: z.number().int().nonnegative(),
  has_more: z.boolean(),
  items: z.array(playlistItemSchema),
});

export const trackPreviewSchema = z.object({
  preview_url: z.url(),
});

export type Image = z.infer<typeof imageSchema>;
export type User = z.infer<typeof userSchema>;
export type CurrentUser = z.infer<typeof currentUserSchema>;
export type Artist = z.infer<typeof artistSchema>;
export type Album = z.infer<typeof albumSchema>;
export type Track = z.infer<typeof trackSchema>;
export type Playlist = z.infer<typeof playlistSchema>;
export type PlaylistTrackCount = z.infer<typeof playlistTrackCountSchema>;
export type PlaylistItem = z.infer<typeof playlistItemSchema>;
export type PlaylistItemsPage = z.infer<typeof playlistItemsPageSchema>;
export type TrackPreview = z.infer<typeof trackPreviewSchema>;
