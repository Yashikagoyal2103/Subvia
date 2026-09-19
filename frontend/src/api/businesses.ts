import { apiClient } from "./client";

export interface Business {
  id: string;
  name: string;
  taxRate: number;
  createdAt: string;
  updatedAt: string;
}

export interface MyBusiness extends Business {
  role: "BUSINESS_ADMIN";
  customerProfileId: string | null;
}

export const businessesApi = {
  async getMine(): Promise<MyBusiness[]> {
    const response = await apiClient.get<{ success: true; data: MyBusiness[] }>("/businesses/my");
    return response.data.data;
  },

  async getById(businessId: string): Promise<Business> {
    const response = await apiClient.get<{ success: true; data: Business }>(`/businesses/${businessId}`);
    return response.data.data;
  },

  async update(businessId: string, input: { name?: string; taxRate?: number }): Promise<Business> {
    const response = await apiClient.patch<{ success: true; data: Business }>(`/businesses/${businessId}`, input);
    return response.data.data;
  },
};