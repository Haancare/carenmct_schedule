import axios, { type AxiosError, type AxiosInstance } from "axios";

import { resolveApiBaseUrl } from "@/lib/api/client";
import { handleAdminUnauthorized } from "@/lib/auth/admin-unauthorized";
import { getAdminAccessToken } from "@/lib/auth/admin-token";

const DEFAULT_API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://192.168.10.54:8081";

/** 관리자 API 전용 — 기관 SSO 토큰과 분리 */
export const adminApiClient: AxiosInstance = axios.create({
  baseURL: DEFAULT_API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: false,
});

adminApiClient.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    config.baseURL = resolveApiBaseUrl();
  }

  const token = getAdminAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

adminApiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      handleAdminUnauthorized();
    }
    return Promise.reject(error);
  },
);
