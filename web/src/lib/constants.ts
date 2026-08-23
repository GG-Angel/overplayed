import { env } from "./env";

export const LIKED_SONGS_PLAYLIST_ID = "liked-songs" as const;
export const LOGIN_URL = `${env.API_BASE_URL}/api/auth/login` as const;
export const PLACEHOLDER_IMAGE_URL = "/placeholder.webp" as const;
export const LIKED_SONGS_COVER_URL = "/liked-songs-cover.webp" as const;
export const KAOMOJIS = {
  uncertain: "(￣～￣;)",
  stressed: "(ᵕ ó ᴗ ò)",
  proud: "ദ്ദി(｡•̀ ,<)~✩‧₊",
  working: "ᕙ(  •̀ ᗜ •́  )ᕗ",
} as const;
