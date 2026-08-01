import axios, { type AxiosError, type AxiosInstance } from "axios";

import { handleUnauthorized } from "@/lib/auth/unauthorized";
import { getAccessToken } from "@/lib/auth/token";

const DEFAULT_API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://192.168.10.54:8081";

/** 브라우저에서는 접속한 호스트(localhost / 192.168.x.x) 기준으로 API 호출 */
export function resolveApiBaseUrl(): string {
  if (typeof window !== "undefined") {
    return `http://${window.location.hostname}:8081`;
  }
  return DEFAULT_API_BASE_URL;
}

export const apiClient: AxiosInstance = axios.create({
  baseURL: DEFAULT_API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: false,
});

apiClient.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    config.baseURL = resolveApiBaseUrl();
  }

  const token = getAccessToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      handleUnauthorized();
    }

    return Promise.reject(error);
  },
);

export default apiClient;
