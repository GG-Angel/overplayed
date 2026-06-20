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

const api = Axios.create({
  baseURL: env.API_BASE_URL,
});

api.interceptors.request.use(authRequestInterceptor);
api.interceptors.response.use((response) => response.data);

export default api;
