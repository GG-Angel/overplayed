export const paths = {
  home: {
    path: "/",
    getHref: () => "/",
  },

  auth: {
    login: {
      path: "/auth/login",
      getHref: (redirectTo?: string | null | undefined) =>
        `/auth/login${redirectTo ? `?redirect_to=${encodeURIComponent(redirectTo)}` : ""}`,
    },
    logout: {
      path: "/auth/logout",
      getHref: () => "/auth/logout",
    },
  },

  app: {
    profile: {
      path: "/users/me",
      getHref: () => "/users/me",
    },
    previews: {
      path: "/previews/:isrc",
      getHref: (isrc: string) => `/previews/${isrc}`,
    },
    playlists: {
      path: "/playlists",
      getHref: () => "/playlists",
    },
    playlist: {
      path: "/playlists/:playlistId",
      getHref: (playlistId: string) => `/playlists/${playlistId}`,
    },
    tracks: {
      path: "/playlists/:playlistId/tracks",
      getHref: (playlistId: string) => `/playlists/${playlistId}/tracks`,
    },
  },
} as const;
