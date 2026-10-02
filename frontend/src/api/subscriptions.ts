import { apiClient } from "./client";

export type SubscriptionStatus =
  | "PENDING"
  | "ACTIVE"
  | "PAST_DUE"
  | "CANCELLED";

export type SubscriptionEventType =
  | "CREATED"
  | "UPGRADED"
  | "DOWNGRADE_SCHEDULED"
  | "DOWNGRADE_APPLIED"
  | "CANCEL_REQUESTED"
  | "CANCELLED"
  | "RENEWED"
  | "PAYMENT_SUCCEEDED"
  | "PAYMENT_FAILED";

export interface SubscriptionEvent {
  id: string;
  subscriptionId: string;
  type: SubscriptionEventType;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

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
  pendingPlanId: string | null;
  cancelAtPeriodEnd: boolean;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
  plan?: SubscriptionPlan & {
    service?: SubscriptionService;
  };
  pendingPlan?: SubscriptionPlan | null;
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
  invoice: {
    id: string;
    invoiceNumber: string;
    total: number;
    currency: "INR" | "USD";
  };
}

export interface UpgradeSubscriptionResult {
  subscription: Subscription;
  invoice: {
    id: string;
    invoiceNumber: string;
    total: number;
    currency: "INR" | "USD";
  };
  proration: ProrationResult;
}

export const subscriptionsApi = {
  async list(page = 1, limit = 20): Promise<Subscription[]> {
    const response = await apiClient.get<{
      success: true;
      data: Subscription[];
      pagination: {
        page: number;
        limit: number;
        hasNextPage: boolean;
      };
    }>("/subscriptions", {
      params: { page, limit },
    });

    return response.data.data;
  },

  async getById(subscriptionId: string): Promise<Subscription> {
    const response = await apiClient.get<{
      success: true;
      data: Subscription;
    }>(`/subscriptions/${subscriptionId}`);

    return response.data.data;
  },

  async events(subscriptionId: string): Promise<SubscriptionEvent[]> {
    const response = await apiClient.get<{
      success: true;
      data: SubscriptionEvent[];
    }>(`/subscriptions/${subscriptionId}/events`);

    return response.data.data;
  },

  async create(
    input: CreateSubscriptionInput,
    idempotencyKey: string,
  ): Promise<CreateSubscriptionResult> {
    const response = await apiClient.post<{
      success: true;
      data: CreateSubscriptionResult;
    }>("/subscriptions", input, {
      headers: { "Idempotency-Key": idempotencyKey },
    });

    return response.data.data;
  },

  async upgrade(
    subscriptionId: string,
    planId: string,
    idempotencyKey: string,
  ): Promise<UpgradeSubscriptionResult> {
    const response = await apiClient.post<{
      success: true;
      data: UpgradeSubscriptionResult;
    }>(
      `/subscriptions/${subscriptionId}/upgrade`,
      { planId },
      {
        headers: {
          "Idempotency-Key": idempotencyKey,
        },
      },
    );

    return response.data.data;
  },

  async downgrade(
    subscriptionId: string,
    planId: string,
    idempotencyKey: string,
  ): Promise<Subscription> {
    const response = await apiClient.post<{
      success: true;
      data: Subscription;
    }>(
      `/subscriptions/${subscriptionId}/downgrade`,
      { planId },
      {
        headers: {
          "Idempotency-Key": idempotencyKey,
        },
      },
    );

    return response.data.data;
  },

  async cancel(
    subscriptionId: string,
    input: CancelSubscriptionInput,
    idempotencyKey: string,
  ): Promise<Subscription> {
    const response = await apiClient.post<{
      success: true;
      data: Subscription;
    }>(
      `/subscriptions/${subscriptionId}/cancel`,
      input,
      {
        headers: {
          "Idempotency-Key": idempotencyKey,
        },
      },
    );

    return response.data.data;
  },
};
