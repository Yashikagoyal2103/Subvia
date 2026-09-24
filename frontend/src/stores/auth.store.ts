import { create } from "zustand";

import type { CurrentUser } from "../api/auth";

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: CurrentUser | null;
  isAuthenticated: boolean;
  isInitialized: boolean;

  setTokens: (accessToken: string, refreshToken: string) => void;
  setUser: (user: CurrentUser) => void;
  setInitialized: (value: boolean) => void;
  clearAuth: () => void;
}

const storedAccessToken = localStorage.getItem("accessToken");
const storedRefreshToken = localStorage.getItem("refreshToken");
const storedUser = localStorage.getItem("user");

let parsedUser: CurrentUser | null = null;

try {
  parsedUser = storedUser
    ? (JSON.parse(storedUser) as CurrentUser)
    : null;
} catch {
  parsedUser = null;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: storedAccessToken,
  refreshToken: storedRefreshToken,
  user: parsedUser,

  isAuthenticated: Boolean(storedAccessToken),

  isInitialized: false,

  setTokens: (accessToken, refreshToken) => {
    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("refreshToken", refreshToken);

    set({
      accessToken,
      refreshToken,
      isAuthenticated: true,
    });
  },

  setUser: (user) => {
    localStorage.setItem("user", JSON.stringify(user));

    set({
      user,
    });
  },

  setInitialized: (value) => {
    set({
      isInitialized: value,
    });
  },

  clearAuth: () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");

    set({
      accessToken: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,
      isInitialized: true,
    });
  },
}));