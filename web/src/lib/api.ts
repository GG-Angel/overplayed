import { env } from "@/lib/env";
import Axios, { type InternalAxiosRequestConfig } from "axios";
import type { ZodType } from "zod";

export type ApiError = {
  detail: string;
};

export const buildURLWithQueryParams = (
  url: string,
  params: Record<string, string | number>
): string => {
  if (!params) return url;
  const paramsString = new URLSearchParams(params as Record<string, string>).toString();
  return `${url}?${paramsString}`;
};

export async function* fetchStreamedJson<T>(url: string, schema: ZodType<T>, signal?: AbortSignal) {
  const response = await fetch(`${env.API_BASE_URL}${url}`, {
    headers: { Accept: "application/x-ndjson" },
    credentials: "include",
    signal,
  });

  if (!response.ok || !response.body) {
    throw new Error(`Failed to fetch stream: ${response.statusText}`);
  }

  const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += value;

      let newLineIndex = buffer.indexOf("\n");
      while (newLineIndex !== -1) {
        const line = buffer.slice(0, newLineIndex).trim();
        buffer = buffer.slice(newLineIndex + 1);
        if (line) yield schema.parse(JSON.parse(line));
        newLineIndex = buffer.indexOf("\n");
      }
    }

    const trailing = buffer.trim();
    if (trailing) yield schema.parse(JSON.parse(trailing));
  } finally {
    await reader.cancel();
  }
}

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
