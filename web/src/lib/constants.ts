import { env } from "./env";

export const LIKED_SONGS_PLAYLIST_ID = "liked-songs" as const;
export const LOGIN_URL = `${env.API_BASE_URL}/auth/login` as const;
export const KAOMOJIS = {
  uncertain: "(￣～￣;)",
  stressed: "(ᵕ ó ᴗ ò)",
  proud: "ദ്ദി(｡•̀ ,<)~✩‧₊",
  working: "ᕙ(  •̀ ᗜ •́  )ᕗ",
} as const;
