
import axios, {
  type AxiosError,
  type InternalAxiosRequestConfig,
} from "axios";

import { useAuthStore } from "../stores/auth.store";
import { queryClient } from "../lib/query-client";

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

let refreshPromise: Promise<string> | null = null;

const retriedRequests = new WeakSet<object>();

const isAuthEndpoint = (url: string) => {
  return [
    "/auth/login",
    "/auth/register",
    "/auth/refresh",
    "/auth/logout",
  ].some((endpoint) => url.includes(endpoint));
};

const refreshAccessToken = async (): Promise<string> => {
  const refreshToken = useAuthStore.getState().refreshToken;

  if (!refreshToken) {
    throw new Error("NO_REFRESH_TOKEN");
  }

  const response = await axios.post<{
    success: true;
    data: {
      accessToken: string;
      refreshToken: string;
    };
  }>(
    `${import.meta.env.VITE_API_URL}/auth/refresh`,
    {
      refreshToken,
    },
  );

  const { accessToken, refreshToken: newRefreshToken } =
    response.data.data;

  useAuthStore
    .getState()
    .setTokens(accessToken, newRefreshToken);

  return accessToken;
};

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const accessToken = useAuthStore.getState().accessToken;

    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    return config;
  },
);

apiClient.interceptors.response.use(
  (response) => response,

  async (error: AxiosError) => {
    const originalRequest = error.config;

    if (!originalRequest) {
      return Promise.reject(error);
    }

    if (error.response?.status !== 401) {
      return Promise.reject(error);
    }

    const requestUrl = originalRequest.url ?? "";

    if (isAuthEndpoint(requestUrl)) {
      return Promise.reject(error);
    }

    if (retriedRequests.has(originalRequest)) {
      return Promise.reject(error);
    }

    retriedRequests.add(originalRequest);

    try {
      if (!refreshPromise) {
        refreshPromise = refreshAccessToken().finally(() => {
          refreshPromise = null;
        });
      }

      const newAccessToken = await refreshPromise;

      originalRequest.headers.Authorization =
        `Bearer ${newAccessToken}`;

      return apiClient(originalRequest);
    } catch {
      queryClient.clear();
      useAuthStore.getState().clearAuth();

      if (window.location.pathname !== "/login") {
        window.location.assign("/login");
      }

      return Promise.reject(error);
    }
  },
);

export { apiClient };
