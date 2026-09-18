import { apiClient } from "./client";

export type PaymentStatus =
  | "SUCCESS"
  | "FAILED"
  | "PENDING";

export interface Payment {
  id: string;
  invoiceId: string;
  amount: number;
  currency: "INR" | "USD";
  status: PaymentStatus;
  paymentMethod: string;
  transactionId: string | null;
  failureReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePaymentInput {
  invoiceId: string;
  paymentMethod: "DEMO";
  result: "SUCCESS" | "FAILED";
}

export interface CreatePaymentResult {
  payment: Payment;
  success: boolean;
}

function createIdempotencyKey() {
  return crypto.randomUUID();
}

export const paymentsApi = {
  async create(
    businessId: string,
    input: CreatePaymentInput,
  ): Promise<CreatePaymentResult> {
    const response = await apiClient.post<{
      success: true;
      data: CreatePaymentResult;
    }>(
      `/businesses/${businessId}/payments`,
      input,
      {
        headers: {
          "Idempotency-Key": createIdempotencyKey(),
        },
      },
    );

    return response.data.data;
  },

  async list(
    businessId: string,
    page = 1,
    limit = 20,
  ): Promise<Payment[]> {
    const response = await apiClient.get<{
      success: true;
      data: Payment[];
    }>(
      `/businesses/${businessId}/payments`,
      {
        params: { page, limit },
      },
    );

    return response.data.data;
  },

  async getById(
    businessId: string,
    paymentId: string,
  ): Promise<Payment> {
    const response = await apiClient.get<{
      success: true;
      data: Payment;
    }>(
      `/businesses/${businessId}/payments/${paymentId}`,
    );

    return response.data.data;
  },
};