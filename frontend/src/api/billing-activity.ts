import { apiClient } from "./client";

export interface BillingActivityInvoice {
  id: string;
  type: "INVOICE";
  createdAt: string;
  invoiceId: string;
  invoiceNumber: string;
  status: string;
  amount: number;
  currency: "INR" | "USD";
  service: string;
}

export interface BillingActivityPayment {
  id: string;
  type: "PAYMENT";
  createdAt: string;
  invoiceId: string;
  status: string;
  amount: number;
  currency: "INR" | "USD";
  paymentMethod: string;
}

export type BillingActivity = BillingActivityInvoice | BillingActivityPayment;

export interface BillingActivityResponse {
  data: BillingActivity[];
  pagination: {
    page: number;
    limit: number;
    hasNextPage: boolean;
  };
}

export const billingActivityApi = {
  async list(page = 1, limit = 20): Promise<BillingActivityResponse> {
    const response = await apiClient.get<{
      success: true;
      data: BillingActivity[];
      pagination: BillingActivityResponse["pagination"];
    }>("/billing-activity", { params: { page, limit } });

    return {
      data: response.data.data,
      pagination: response.data.pagination,
    };
  },
};