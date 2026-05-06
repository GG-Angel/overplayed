import { env } from "@/config/env";
import Axios, { type InternalAxiosRequestConfig } from "axios";

export const routes = {
  auth: {
    login: (redirectTo?: string | null | undefined) =>
      `/auth/login${redirectTo ? `?redirect_to=${encodeURIComponent(redirectTo)}` : ""}`,
    logout: () => "/auth/logout",
  },
  profile: () => "/users/me",
  previews: (isrc: string) => `/previews/${isrc}`,
  playlists: {
    all: () => "/playlists",
    one: (playlistId: string) => `/playlists/${playlistId}`,
    tracks: (playlistId: string) => `/playlists/${playlistId}/tracks`,
  },
} as const;

function authRequestInterceptor(config: InternalAxiosRequestConfig) {
  if (config.headers) {
    config.headers.Accept = "application/json";
  }

  config.withCredentials = true;
  return config;
}

export const api = Axios.create({
  baseURL: env.API_URL,
});

api.interceptors.request.use(authRequestInterceptor);
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    if (error.response?.status === 401) {
      const searchParams = new URLSearchParams();
      const redirectTo = searchParams.get("redirect_to") || window.location.pathname;
      window.location.href = routes.auth.login(redirectTo);
    }
    return Promise.reject(error);
  }
);
