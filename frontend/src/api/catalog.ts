
import { apiClient } from "./client";
import type { Currency, BillingInterval } from "./plans";

export interface CatalogPlan {
  id: string;
  name: string;
  description: string | null;
  price: number;
  currency: Currency;
  interval: BillingInterval;
  isActive: boolean;
}

export interface CatalogService {
  id: string;
  name: string;
  description: string | null;
  plans: CatalogPlan[];
}

export interface CatalogBusiness {
  id: string;
  name: string;
  taxRate: number;
  services: CatalogService[];
}

export interface CatalogQuery {
  search?: string;
  currency?: Currency;
  interval?: BillingInterval;
  businessId?: string;
}

export const catalogApi = {
  async list(query?: CatalogQuery): Promise<CatalogBusiness[]> {
    const response = await apiClient.get<{
      success: true;
      data: CatalogBusiness[];
    }>("/catalog", {
      params: query,
    });

    return response.data.data;
  },
};
