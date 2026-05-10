import { env } from "@/lib/env";
import Axios, { type InternalAxiosRequestConfig } from "axios";

export const routes = {
  auth: {
    login: (redirectTo?: string | null | undefined) =>
      `${env.API_URL}/auth/login${
        redirectTo ? `?redirect_to=${encodeURIComponent(redirectTo)}` : ""
      }`,
    logout: () => "/auth/logout",
  },
  profile: () => "/users/me",
  previews: (isrc: string) => `/previews/${isrc}`,
  playlists: {
    all: () => "/playlists",
    one: (id: string) => `/playlists/${id}`,
    tracks: (id: string, offset?: number, limit?: number) => {
      const params = new URLSearchParams();
      if (offset !== undefined) params.append("offset", offset.toString());
      if (limit !== undefined) params.append("limit", limit.toString());
      const queryString = params.toString();
      return `/playlists/${id}/tracks${queryString ? `?${queryString}` : ""}`;
    },
  },
} as const;

function authRequestInterceptor(config: InternalAxiosRequestConfig) {
  config.headers.Accept = "application/json";
  config.withCredentials = true;
  return config;
}

export const api = Axios.create({
  baseURL: env.API_URL,
});

api.interceptors.request.use(authRequestInterceptor);
api.interceptors.response.use(
  (response) => response.data,
  (error) => Promise.reject(error)
);
