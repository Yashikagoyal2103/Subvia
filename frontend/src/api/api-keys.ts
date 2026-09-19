import { apiClient } from "./client";

export interface ApiKey {
  id: string;
  name: string;
  lastUsedAt: string | null;
  expiresAt: string | null;
  revokedAt: string | null;
  createdAt: string;
}

export interface CreatedApiKey extends ApiKey {
  key: string;
}

export const apiKeysApi = {
  async list(
    businessId: string,
  ): Promise<ApiKey[]> {
    const response = await apiClient.get<{
      success: true;
      data: ApiKey[];
    }>(
      `/businesses/${businessId}/api-keys`,
    );

    return response.data.data;
  },

  async create(
    businessId: string,
    input: {
      name: string;
      expiresAt?: string;
    },
  ): Promise<CreatedApiKey> {
    const response = await apiClient.post<{
      success: true;
      data: CreatedApiKey;
    }>(
      `/businesses/${businessId}/api-keys`,
      input,
    );

    return response.data.data;
  },

  async revoke(
    businessId: string,
    apiKeyId: string,
  ): Promise<void> {
    await apiClient.delete(
      `/businesses/${businessId}/api-keys/${apiKeyId}`,
    );
  },
};