import { apiClient } from "./client";

export interface BillingActivity {
  id: string;
  type: string;
  metadata: unknown;
  createdAt: string;
  subscription: {
    id: string;
    status: string;
    plan: {
      id: string;
      name: string;
      service: {
        id: string;
        name: string;
      };
    };
  } | null;
}

export interface BillingActivityResponse {
  data: BillingActivity[];
  pagination: {
    page: number;
    limit: number;
    hasNextPage: boolean;
  };
}

export const billingActivityApi = {
  async list(
    page = 1,
    limit = 20,
  ): Promise<BillingActivityResponse> {
    const response = await apiClient.get<{
      success: true;
      data: BillingActivity[];
      pagination: BillingActivityResponse["pagination"];
    }>("/billing-activity", {
      params: { page, limit },
    });

    return {
      data: response.data.data,
      pagination: response.data.pagination,
    };
  },
};