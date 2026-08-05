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

/** Streams NDJSON, yielding one batch per read rather than one item per line. */
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
  const parseLines = (lines: string[]) =>
    lines.filter((line) => line.trim()).map((line) => schema.parse(JSON.parse(line)));

  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const lines = (buffer + value).split("\n");
      buffer = lines.pop() ?? ""; // the last entry is an incomplete line

      const batch = parseLines(lines);
      if (batch.length) yield batch;
    }

    const trailing = parseLines([buffer]);
    if (trailing.length) yield trailing;
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
