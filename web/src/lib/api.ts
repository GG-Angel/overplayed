import { env } from "@/lib/env";
import Axios, { type InternalAxiosRequestConfig } from "axios";

export const buildURLWithQueryParams = (
  url: string,
  params: Record<string, string | number>
): string => {
  if (!params) return url;
  const paramsString = new URLSearchParams(params as Record<string, string>).toString();
  return `${url}?${paramsString}`;
};

function authRequestInterceptor(config: InternalAxiosRequestConfig) {
  config.headers.Accept = "application/json";
  config.withCredentials = true;
  return config;
}

function createApiClient(baseURL: string) {
  const client = Axios.create({ baseURL });
  client.interceptors.request.use(authRequestInterceptor);
  client.interceptors.response.use((response) => response.data);
  return client;
}

const api = createApiClient(env.API_BASE_URL);
export const queueApi = createApiClient(env.QUEUE_BASE_URL);

export default api;
