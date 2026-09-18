import { apiClient } from "./client";

export type Currency = "INR" | "USD";
export type BillingInterval = "MONTHLY" | "YEARLY";

export interface Plan {
  id: string;
  serviceId: string;
  name: string;
  description: string | null;
  price: number;
  currency: Currency;
  interval: BillingInterval;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface PlansResponse {
  success: true;
  data: Plan[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface PlanResponse {
  success: true;
  data: Plan;
}

export const plansApi = {
  async list(
    businessId: string,
    serviceId: string,
  ): Promise<Plan[]> {
    const response = await apiClient.get<PlansResponse>(
      `/businesses/${businessId}/services/${serviceId}/plans`,
    );

    return response.data.data;
  },

  async getById(
    businessId: string,
    serviceId: string,
    planId: string,
  ): Promise<Plan> {
    const response = await apiClient.get<PlanResponse>(
      `/businesses/${businessId}/services/${serviceId}/plans/${planId}`,
    );

    return response.data.data;
  },
};