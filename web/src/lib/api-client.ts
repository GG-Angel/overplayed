import { env } from "@/lib/env";
import Axios, { type InternalAxiosRequestConfig } from "axios";

function authRequestInterceptor(config: InternalAxiosRequestConfig) {
  config.headers.Accept = "application/json";
  config.withCredentials = true;
  return config;
}

const api = Axios.create({
  baseURL: env.API_URL,
});

api.interceptors.request.use(authRequestInterceptor);
api.interceptors.response.use((response) => response.data);

export default api;
