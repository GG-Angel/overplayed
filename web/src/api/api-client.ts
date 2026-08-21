import { env } from "@/lib/env";
import axios, { type InternalAxiosRequestConfig } from "axios";

export const buildUrl = (url: string, params?: Record<string, string>): string => {
  if (!params) return url;
  const query = new URLSearchParams(params).toString();
  return query ? `${url}?${query}` : url;
};

function authRequestInterceptor(config: InternalAxiosRequestConfig) {
  config.headers.Accept = "application/json";
  config.withCredentials = true;
  return config;
}

function createApiClient(baseUrl: string) {
  const client = axios.create({ baseURL: baseUrl });
  client.interceptors.request.use(authRequestInterceptor);
  client.interceptors.response.use((response) => response.data);
  return client;
}

export const serverApi = createApiClient(env.API_BASE_URL);
export const queueApi = createApiClient(env.QUEUE_BASE_URL);
