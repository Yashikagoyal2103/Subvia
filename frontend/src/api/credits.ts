import { apiClient } from "./client";

export interface CreditBalance {
  INR: number;
  USD: number;
}

export const creditsApi = {
  async getBalance(): Promise<CreditBalance> {
    const response = await apiClient.get<{
      success: true;
      data: CreditBalance;
    }>("/credits");

    return response.data.data;
  },
};

