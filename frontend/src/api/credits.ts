import { apiClient } from "./client";

export interface CreditBalance {
  INR: number;
  USD: number;
}

export const creditsApi = {
  async getBalance(
    businessId: string,
  ): Promise<CreditBalance> {
    const response = await apiClient.get<{
      success: true;
      data: CreditBalance;
    }>(
      `/businesses/${businessId}/credits`,
    );

    return response.data.data;
  },
};