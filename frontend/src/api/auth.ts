import { apiClient } from "./client";

export type AccountType = "ADMIN" | "CUSTOMER";
export type RegistrationIntent = "ADMIN" | "CUSTOMER";

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  intent: RegistrationIntent;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface CurrentUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  accountType: AccountType;
}

export const authApi = {
  async login(input: LoginInput): Promise<AuthTokens> {
    const response = await apiClient.post<{
      success: true;
      data: AuthTokens;
    }>("/auth/login", input);

    return response.data.data;
  },

  async register(input: RegisterInput): Promise<CurrentUser> {
    const response = await apiClient.post<{
      success: true;
      data: CurrentUser;
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