import z from "zod";

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

export const trackPreviewSchema = z.object({
  isrc: z.string(),
  url: z.url().nullable(),
  expires_in: z.number().int().nonnegative().nullable(),
  expires_at: z.number().int().nonnegative().nullable(),
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

export type Image = z.infer<typeof imageSchema>;
export type User = z.infer<typeof userSchema>;
export type CurrentUser = z.infer<typeof currentUserSchema>;
export type Artist = z.infer<typeof artistSchema>;
export type Album = z.infer<typeof albumSchema>;
export type Track = z.infer<typeof trackSchema>;
export type TrackPreview = z.infer<typeof trackPreviewSchema>;
export type Playlist = z.infer<typeof playlistSchema>;
