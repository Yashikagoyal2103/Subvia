import { apiClient } from "./client";

export interface AdminPagination {
  page: number;
  limit: number;
  hasNextPage: boolean;
}

export interface AdminCustomer {
  id: string;
  userId: string;
  createdAt: string;
  user: {
    id: string;
    email: string;
    createdAt: string;
  };
  _count: {
    subscriptions: number;
    invoices: number;
    creditLedger: number;
  };
}

export interface AdminSubscription {
  id: string;
  status: "PENDING" | "ACTIVE" | "PAST_DUE" | "CANCELLED";
  currency: "INR" | "USD";
  price: number;
  billingInterval: "MONTHLY" | "YEARLY";
  billingPeriodStart: string;
  billingPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  createdAt: string;

  customerProfile: {
    id: string;
    user: {
      id: string;
      email: string;
    };
  };

  plan: {
    id: string;
    name: string;
    price: number;
    currency: "INR" | "USD";
    interval: "MONTHLY" | "YEARLY";
    service: {
      id: string;
      name: string;
    };
  };

  pendingPlan: {
    id: string;
    name: string;
    price: number;
    currency: "INR" | "USD";
    interval: "MONTHLY" | "YEARLY";
  } | null;

  _count: {
    invoices: number;
    events: number;
  };
}

export interface AdminInvoice {
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

  customerProfile: {
    id: string;
    user: {
      id: string;
      email: string;
    };
  };

  subscription: {
    id: string;
    plan: {
      id: string;
      name: string;
      service: {
        id: string;
        name: string;
      };
    };
  } | null;

  items: {
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
    amount: number;
  }[];

  payments: {
    id: string;
    amount: number;
    currency: "INR" | "USD";
    status: "SUCCESS" | "FAILED";
    paymentMethod: string;
    createdAt: string;
  }[];
}

export interface AdminPayment {
  id: string;
  invoiceId: string;
  amount: number;
  currency: "INR" | "USD";
  status: "SUCCESS" | "FAILED";
  paymentMethod: string;
  createdAt: string;

  invoice: {
    id: string;
    invoiceNumber: string;
    status: string;
    total: number;
    currency: "INR" | "USD";

    customerProfile: {
      id: string;
      user: {
        id: string;
        email: string;
      };
    };

    subscription: {
      id: string;
      plan: {
        id: string;
        name: string;
        service: {
          id: string;
          name: string;
        };
      };
    } | null;
  };
}

export interface AdminBillingEvent {
  id: string;
  type: string;
  metadata: unknown;
  createdAt: string;

  subscription: {
    id: string;
    status: string;

    customerProfile: {
      id: string;
      user: {
        id: string;
        email: string;
      };
    };

    plan: {
      id: string;
      name: string;
      service: {
        id: string;
        name: string;
      };
    };
  };
}

interface ListResponse<T> {
  success: true;
  data: T[];
  pagination: AdminPagination;
}

interface ItemResponse<T> {
  success: true;
  data: T;
}

export const adminApi = {
  async customers(
    businessId: string,
    page = 1,
    limit = 20,
  ) {
    const response = await apiClient.get<
      ListResponse<AdminCustomer>
    >(
      `/businesses/${businessId}/admin/customers`,
      {
        params: {
          page,
          limit,
        },
      },
    );

    return response.data;
  },

  async customer(
    businessId: string,
    customerId: string,
  ) {
    const response = await apiClient.get<
      ItemResponse<AdminCustomer>
    >(
      `/businesses/${businessId}/admin/customers/${customerId}`,
    );

    return response.data.data;
  },

  async addCustomer(
    businessId: string,
    email: string,
  ) {
    const response = await apiClient.post<
      ItemResponse<AdminCustomer>
    >(
      `/businesses/${businessId}/admin/customers`,
      {
        email,
      },
    );

    return response.data.data;
  },

  async subscriptions(
    businessId: string,
    page = 1,
    limit = 20,
  ) {
    const response = await apiClient.get<
      ListResponse<AdminSubscription>
    >(
      `/businesses/${businessId}/admin/subscriptions`,
      {
        params: {
          page,
          limit,
        },
      },
    );

    return response.data;
  },

  async subscription(
    businessId: string,
    subscriptionId: string,
  ) {
    const response = await apiClient.get<
      ItemResponse<AdminSubscription>
    >(
      `/businesses/${businessId}/admin/subscriptions/${subscriptionId}`,
    );

    return response.data.data;
  },

  async invoices(
    businessId: string,
    page = 1,
    limit = 20,
  ) {
    const response = await apiClient.get<
      ListResponse<AdminInvoice>
    >(
      `/businesses/${businessId}/admin/invoices`,
      {
        params: {
          page,
          limit,
        },
      },
    );

    return response.data;
  },

  async invoice(
    businessId: string,
    invoiceId: string,
  ) {
    const response = await apiClient.get<
      ItemResponse<AdminInvoice>
    >(
      `/businesses/${businessId}/admin/invoices/${invoiceId}`,
    );

    return response.data.data;
  },

  async payments(
    businessId: string,
    page = 1,
    limit = 20,
  ) {
    const response = await apiClient.get<
      ListResponse<AdminPayment>
    >(
      `/businesses/${businessId}/admin/payments`,
      {
        params: {
          page,
          limit,
        },
      },
    );

    return response.data;
  },

  async payment(
    businessId: string,
    paymentId: string,
  ) {
    const response = await apiClient.get<
      ItemResponse<AdminPayment>
    >(
      `/businesses/${businessId}/admin/payments/${paymentId}`,
    );

    return response.data.data;
  },

  async billingActivity(
    businessId: string,
    page = 1,
    limit = 20,
  ) {
    const response = await apiClient.get<
      ListResponse<AdminBillingEvent>
    >(
      `/businesses/${businessId}/admin/billing-activity`,
      {
        params: {
          page,
          limit,
        },
      },
    );

    return response.data;
  },
};