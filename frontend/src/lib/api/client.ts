import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import { STORAGE_KEYS } from "@/lib/constants";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 120_000, // 2 min for AI generation
  headers: { "Content-Type": "application/json" },
});

// ── Request interceptor: attach JWT ──────────────────────────────────────
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// ── Response interceptor: handle 401 ─────────────────────────────────────
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const requestUrl = error.config?.url ?? "";
    const currentPath = typeof window !== "undefined" ? window.location.pathname : "";
    const isAuthEndpoint =
      requestUrl.includes("/api/auth/login") ||
      requestUrl.includes("/api/auth/register") ||
      requestUrl.includes("/api/auth/logout");

    if (
      error.response?.status === 401 &&
      typeof window !== "undefined" &&
      !isAuthEndpoint &&
      currentPath !== "/login" &&
      currentPath !== "/register"
    ) {
      localStorage.removeItem(STORAGE_KEYS.TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER);
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { detail?: string } | undefined;
    return data?.detail ?? error.message ?? "An error occurred";
  }
  if (error instanceof Error) return error.message;
  return "An unexpected error occurred";
}

export default apiClient;
