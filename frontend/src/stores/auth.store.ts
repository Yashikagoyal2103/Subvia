import { create } from "zustand";

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  userId: string | null;
  isAuthenticated: boolean;
  isInitialized: boolean;

  setTokens: (accessToken: string, refreshToken: string) => void;
  setUser: (userId: string) => void;
  setInitialized: (value: boolean) => void;
  clearAuth: () => void;
}

const storedAccessToken = localStorage.getItem("accessToken");
const storedRefreshToken = localStorage.getItem("refreshToken");
const storedUserId = localStorage.getItem("userId");

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: storedAccessToken,
  refreshToken: storedRefreshToken,
  userId: storedUserId,

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

  setUser: (userId) => {
    localStorage.setItem("userId", userId);

    set({
      userId,
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
    localStorage.removeItem("userId");

    set({
      accessToken: null,
      refreshToken: null,
      userId: null,
      isAuthenticated: false,
      isInitialized: true,
    });
  },
}));