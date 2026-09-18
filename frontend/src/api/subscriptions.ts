import { apiClient } from "./client";

export type SubscriptionStatus =
  | "PENDING"
  | "ACTIVE"
  | "PAST_DUE"
  | "CANCELLED";

export interface SubscriptionPlan {
  id: string;
  serviceId: string;
  name: string;
  description: string | null;
  price: number;
  currency: "INR" | "USD";
  interval: "MONTHLY" | "YEARLY";
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionService {
  id: string;
  businessId: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Subscription {
  id: string;
  customerProfileId: string;
  planId: string;
  status: SubscriptionStatus;
  currency: "INR" | "USD";
  price: number;
  billingInterval: "MONTHLY" | "YEARLY";
  billingPeriodStart: string;
  billingPeriodEnd: string;
  pendingPlanId?: string | null;
  cancelAtPeriodEnd?: boolean;
  cancelledAt?: string | null;
  createdAt: string;
  updatedAt: string;

  plan?: SubscriptionPlan & {
    service?: SubscriptionService;
  };

  pendingPlan?: SubscriptionPlan | null;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerProfileId: string;
  subscriptionId: string;
  status: "DRAFT" | "OPEN" | "PAID" | "VOID";
  currency: "INR" | "USD";
  subtotal: number;
  total: number;
  issuedAt: string;
  dueAt: string | null;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
  items?: InvoiceItem[];
}

export interface InvoiceItem {
  id: string;
  invoiceId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  createdAt: string;
}

export interface ProrationResult {
  oldPlanCredit: number;
  newPlanCharge: number;
  netAmount: number;
}

export interface CreateSubscriptionInput {
  planId: string;
  currency: "INR" | "USD";
}

export interface CancelSubscriptionInput {
  mode: "PERIOD_END" | "IMMEDIATE";
}

export interface CreateSubscriptionResult {
  subscription: Subscription;
  invoice: Invoice;
}

export interface UpgradeSubscriptionResult {
  subscription: Subscription;
  invoice: Invoice;
  proration: ProrationResult;
}

function createIdempotencyKey() {
  return crypto.randomUUID();
}

export const subscriptionsApi = {
  async list(
    businessId: string,
    page = 1,
    limit = 20,
  ): Promise<Subscription[]> {
    const response = await apiClient.get<{
      success: true;
      data: Subscription[];
      pagination: {
        page: number;
        limit: number;
        hasNextPage: boolean;
      };
    }>(
      `/businesses/${businessId}/subscriptions`,
      {
        params: { page, limit },
      },
    );

    return response.data.data;
  },

  async getById(
    businessId: string,
    subscriptionId: string,
  ): Promise<Subscription> {
    const response = await apiClient.get<{
      success: true;
      data: Subscription;
    }>(
      `/businesses/${businessId}/subscriptions/${subscriptionId}`,
    );

    return response.data.data;
  },

  async create(
    businessId: string,
    input: CreateSubscriptionInput,
  ): Promise<CreateSubscriptionResult> {
    const response = await apiClient.post<{
      success: true;
      data: CreateSubscriptionResult;
    }>(
      `/businesses/${businessId}/subscriptions`,
      input,
      {
        headers: {
          "Idempotency-Key": createIdempotencyKey(),
        },
      },
    );

    return response.data.data;
  },

  async upgrade(
    businessId: string,
    subscriptionId: string,
    planId: string,
  ): Promise<UpgradeSubscriptionResult> {
    const response = await apiClient.post<{
      success: true;
      data: UpgradeSubscriptionResult;
    }>(
      `/businesses/${businessId}/subscriptions/${subscriptionId}/upgrade`,
      { planId },
      {
        headers: {
          "Idempotency-Key": createIdempotencyKey(),
        },
      },
    );

    return response.data.data;
  },

  async downgrade(
    businessId: string,
    subscriptionId: string,
    planId: string,
  ): Promise<Subscription> {
    const response = await apiClient.post<{
      success: true;
      data: Subscription;
    }>(
      `/businesses/${businessId}/subscriptions/${subscriptionId}/downgrade`,
      { planId },
      {
        headers: {
          "Idempotency-Key": createIdempotencyKey(),
        },
      },
    );

    return response.data.data;
  },

  async cancel(
    businessId: string,
    subscriptionId: string,
    input: CancelSubscriptionInput,
  ): Promise<Subscription> {
    const response = await apiClient.post<{
      success: true;
      data: Subscription;
    }>(
      `/businesses/${businessId}/subscriptions/${subscriptionId}/cancel`,
      input,
      {
        headers: {
          "Idempotency-Key": createIdempotencyKey(),
        },
      },
    );

    return response.data.data;
  },
};