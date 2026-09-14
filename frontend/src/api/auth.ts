import { apiClient } from "./client";

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface CurrentUser {
  userId: string;
}

export const authApi = {
  async login(input: LoginInput): Promise<AuthTokens> {
    const response = await apiClient.post<{
      success: true;
      data: AuthTokens;
    }>("/auth/login", input);

    return response.data.data;
  },

  async register(input: RegisterInput): Promise<{
    id: string;
    email: string;
  }> {
    const response = await apiClient.post<{
      success: true;
      data: {
        id: string;
        email: string;
      };
    }>("/auth/register", input);

    return response.data.data;
  },

  async me(): Promise<CurrentUser> {
    const response = await apiClient.get<{
      success: true;
      data: CurrentUser;
    }>("/auth/me");

    return response.data.data;
  },

  async refresh(refreshToken: string): Promise<AuthTokens> {
    const response = await apiClient.post<{
      success: true;
      data: AuthTokens;
    }>("/auth/refresh", {
      refreshToken,
    });

    return response.data.data;
  },

  async logout(refreshToken: string): Promise<void> {
    await apiClient.post("/auth/logout", {
      refreshToken,
    });
  },
};