
import { apiClient } from "./client";

export interface InvoiceItem {
  id: string;
  invoiceId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  createdAt: string;
}

export interface InvoicePayment {
  id: string;
  amount: number;
  currency: "INR" | "USD";
  status: "SUCCESS" | "FAILED" | "PENDING";
  paymentMethod: string;
  failureReason: string | null;
  createdAt: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  status: "DRAFT" | "OPEN" | "PAID" | "VOID";
  currency: "INR" | "USD";
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  issuedAt: string;
  dueAt: string | null;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
  items: InvoiceItem[];
  payments?: InvoicePayment[];
  subscription?: {
    id: string;
    status: "PENDING" | "ACTIVE" | "PAST_DUE" | "CANCELLED";
    currency: "INR" | "USD";
    price: number;
    billingInterval: "MONTHLY" | "YEARLY";
    billingPeriodStart: string;
    billingPeriodEnd: string;
    plan: {
      id: string;
      name: string;
      service: {
        id: string;
        name: string;
        businessId: string;
        business: {
          id: string;
          name: string;
        };
      };
    };
  };
}

export interface InvoiceListResponse {
  data: Invoice[];
  pagination: {
    page: number;
    limit: number;
    hasNextPage: boolean;
  };
}

export const invoicesApi = {
  async list(page = 1, limit = 20): Promise<InvoiceListResponse> {
    const response = await apiClient.get<{
      success: true;
      data: Invoice[];
      pagination: InvoiceListResponse["pagination"];
    }>("/invoices", {
      params: { page, limit },
    });

    return {
      data: response.data.data,
      pagination: response.data.pagination,
    };
  },

  async getById(invoiceId: string): Promise<Invoice> {
    const response = await apiClient.get<{
      success: true;
      data: Invoice;
    }>(`/invoices/${invoiceId}`);

    return response.data.data;
  },
};
