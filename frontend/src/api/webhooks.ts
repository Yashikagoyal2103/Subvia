import { apiClient } from "./client";

export type WebhookEndpointStatus =
  | "ACTIVE"
  | "DISABLED";

export interface WebhookEndpoint {
  id: string;
  url: string;
  status: WebhookEndpointStatus;
  createdAt: string;
  updatedAt?: string;
}

export interface CreatedWebhookEndpoint
  extends WebhookEndpoint {
  secret: string;
}

export const webhooksApi = {
  async list(
    businessId: string,
  ): Promise<WebhookEndpoint[]> {
    const response = await apiClient.get<{
      success: true;
      data: WebhookEndpoint[];
    }>(
      `/businesses/${businessId}/webhooks`,
    );

    return response.data.data;
  },

  async create(
    businessId: string,
    input: { url: string },
  ): Promise<CreatedWebhookEndpoint> {
    const response = await apiClient.post<{
      success: true;
      data: CreatedWebhookEndpoint;
    }>(
      `/businesses/${businessId}/webhooks`,
      input,
    );

    return response.data.data;
  },

  async update(
    businessId: string,
    endpointId: string,
    input: {
      url?: string;
      status?: WebhookEndpointStatus;
    },
  ): Promise<WebhookEndpoint> {
    const response = await apiClient.patch<{
      success: true;
      data: WebhookEndpoint;
    }>(
      `/businesses/${businessId}/webhooks/${endpointId}`,
      input,
    );

    return response.data.data;
  },

  async remove(
    businessId: string,
    endpointId: string,
  ): Promise<void> {
    await apiClient.delete(
      `/businesses/${businessId}/webhooks/${endpointId}`,
    );
  },
};