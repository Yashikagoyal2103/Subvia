import {
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  CreditCard,
  FileText,
  Package,
  Receipt,
  WalletCards,
  XCircle,
} from "lucide-react";
import type {
  ReactNode,
} from "react";
import {
  Link,
  useParams,
} from "react-router-dom";

import {
  useQuery,
} from "@tanstack/react-query";

import {
  invoicesApi,
} from "../../api/invoices";

import {
  paymentsApi,
} from "../../api/payments";

import {
  subscriptionsApi,
} from "../../api/subscriptions";

import {
  creditsApi,
} from "../../api/credits";

import {
  StatusBadge,
} from "../../components/status-badge";

import {
  LoadingState,
} from "../../components/loading-state";

import {
  ErrorState,
} from "../../components/error-state";

const currencySymbol: Record<
  string,
  string
> = {
  INR: "₹",
  USD: "$",
};

function money(
  amount: number,
  currency: string,
) {
  return `${currencySymbol[currency] ?? currency}${(
    amount / 100
  ).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(
  value: string | null | undefined,
) {
  if (!value) {
    return "—";
  }

  return new Date(
    value,
  ).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function CustomerDashboardPage() {
  const { businessId } =
    useParams<{
      businessId: string;
    }>();

  const subscriptionsQuery =
    useQuery({
      queryKey: [
        "subscriptions",
        businessId,
      ],

      queryFn: () =>
        subscriptionsApi.list(
          businessId!,
        ),

      enabled: Boolean(businessId),
    });

  const invoicesQuery =
    useQuery({
      queryKey: [
        "invoices",
        businessId,
      ],

      queryFn: () =>
        invoicesApi.list(
          businessId!,
        ),

      enabled: Boolean(businessId),
    });

  const paymentsQuery =
    useQuery({
      queryKey: [
        "payments",
        businessId,
      ],

      queryFn: () =>
        paymentsApi.list(
          businessId!,
        ),

      enabled: Boolean(businessId),
    });

  const creditsQuery =
    useQuery({
      queryKey: [
        "credit-balance",
        businessId,
      ],

      queryFn: () =>
        creditsApi.getBalance(
          businessId!,
        ),

      enabled: Boolean(businessId),
    });

  if (!businessId) {
    return (
      <ErrorState
        description="A valid business context is required."
      />
    );
  }

  const isLoading =
    subscriptionsQuery.isLoading ||
    invoicesQuery.isLoading ||
    paymentsQuery.isLoading ||
    creditsQuery.isLoading;

  if (isLoading) {
    return (
      <LoadingState
        message="Loading your billing overview..."
      />
    );
  }

  const hasError =
    subscriptionsQuery.isError ||
    invoicesQuery.isError ||
    paymentsQuery.isError ||
    creditsQuery.isError;

  if (hasError) {
    return (
      <ErrorState
        description="We couldn't load your billing overview."
        retryAction={() => {
          void subscriptionsQuery.refetch();
          void invoicesQuery.refetch();
          void paymentsQuery.refetch();
          void creditsQuery.refetch();
        }}
      />
    );
  }

  const subscriptions =
    subscriptionsQuery.data ?? [];

  const invoices =
    invoicesQuery.data?.data ?? [];

  const payments =
    paymentsQuery.data ?? [];

  const activeSubscriptions =
    subscriptions.filter(
      (subscription) =>
        subscription.status ===
        "ACTIVE",
    );

  const paidInvoices =
    invoices.filter(
      (invoice) =>
        invoice.status === "PAID",
    );

  const openInvoices =
    invoices.filter(
      (invoice) =>
        invoice.status === "OPEN",
    );

  const successfulPayments =
    payments.filter(
      (payment) =>
        payment.status === "SUCCESS",
    );

  const outstandingAmount =
    openInvoices.reduce(
      (total, invoice) =>
        total + invoice.total,
      0,
    );

  const recentInvoices =
    [...invoices]
      .sort(
        (a, b) =>
          new Date(
            b.createdAt,
          ).getTime() -
          new Date(
            a.createdAt,
          ).getTime(),
      )
      .slice(0, 5);

  const recentPayments =
    [...payments]
      .sort(
        (a, b) =>
          new Date(
            b.createdAt,
          ).getTime() -
          new Date(
            a.createdAt,
          ).getTime(),
      )
      .slice(0, 5);

  const creditBalance =
    creditsQuery.data ?? {
      INR: 0,
      USD: 0,
    };

  return (
    <div className="space-y-8">
      {/* Header */}
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">
          Overview
        </p>

        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-gray-900">
          Billing dashboard
        </h1>

        <p className="mt-2 text-sm text-gray-500">
          Keep track of subscriptions, invoices, payments and
          account credit.
        </p>
      </header>

      {/* Metrics */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={
            <CreditCard className="h-5 w-5" />
          }
          label="Active subscriptions"
          value={
            activeSubscriptions.length
          }
          helper="Currently active"
        />

        <MetricCard
          icon={
            <FileText className="h-5 w-5" />
          }
          label="Paid invoices"
          value={paidInvoices.length}
          helper="Successfully settled"
        />

        <MetricCard
          icon={
            <CheckCircle2 className="h-5 w-5" />
          }
          label="Successful payments"
          value={
            successfulPayments.length
          }
          helper="Recorded payment attempts"
        />

        <MetricCard
          icon={
            <WalletCards className="h-5 w-5" />
          }
          label="INR credit"
          value={money(
            creditBalance.INR,
            "INR",
          )}
          helper="Available account credit"
          textValue
        />
      </section>

      {/* Subscriptions */}
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-semibold text-gray-900">
              Current subscriptions
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Your active recurring services.
            </p>
          </div>

          <Link
            to={`/customer/${businessId}/subscriptions`}
            className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
          >
            View all
          </Link>
        </div>

        <div className="mt-6 space-y-3">
          {activeSubscriptions.length ===
          0 ? (
            <div className="rounded-xl border border-dashed border-gray-200 p-8 text-center">
              <Package className="mx-auto h-8 w-8 text-gray-300" />

              <p className="mt-3 text-sm font-medium text-gray-700">
                No active subscriptions
              </p>

              <p className="mt-1 text-sm text-gray-500">
                Browse available services to get started.
              </p>

              <Link
                to={`/customer/${businessId}/services`}
                className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-indigo-600"
              >
                Explore services
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            activeSubscriptions
              .slice(0, 4)
              .map(
                (subscription) => (
                  <div
                    key={
                      subscription.id
                    }
                    className="flex flex-col gap-4 rounded-xl border border-gray-100 p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                        <CreditCard className="h-5 w-5" />
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium text-gray-900">
                            {subscription
                              .plan
                              ?.name ??
                              "Subscription"}
                          </p>

                          <StatusBadge
                            status={
                              subscription.status
                            }
                          />
                        </div>

                        <p className="mt-1 text-sm text-gray-500">
                          {subscription
                            .plan
                            ?.service
                            ?.name ??
                            "Service"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-5 sm:justify-end">
                      <div>
                        <p className="text-xs text-gray-400">
                          Billing
                        </p>

                        <p className="mt-1 font-semibold text-gray-900">
                          {money(
                            subscription.price,
                            subscription.currency,
                          )}

                          <span className="ml-1 text-xs font-normal text-gray-400">
                            /{" "}
                            {subscription.billingInterval.toLowerCase()}
                          </span>
                        </p>
                      </div>

                      <Link
                        to={`/customer/${businessId}/subscriptions/${subscription.id}`}
                        className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                      >
                        View
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                ),
              )
          )}
        </div>
      </section>

      {/* Invoice + payment activity */}
      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="font-semibold text-gray-900">
                Recent invoices
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Latest billing records.
              </p>
            </div>

            <Link
              to={`/customer/${businessId}/invoices`}
              className="text-sm font-medium text-indigo-600"
            >
              View all
            </Link>
          </div>

          <div className="mt-6 divide-y">
            {recentInvoices.length ===
            0 ? (
              <div className="py-8 text-center">
                <Receipt className="mx-auto h-8 w-8 text-gray-300" />

                <p className="mt-3 text-sm text-gray-500">
                  No invoices yet.
                </p>
              </div>
            ) : (
              recentInvoices.map(
                (invoice) => (
                  <Link
                    key={invoice.id}
                    to={`/customer/${businessId}/invoices/${invoice.id}`}
                    className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0 hover:bg-gray-50"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-50">
                        <FileText className="h-4 w-4 text-gray-500" />
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-gray-900">
                          {
                            invoice.invoiceNumber
                          }
                        </p>

                        <p className="mt-1 text-xs text-gray-400">
                          {formatDate(
                            invoice.createdAt,
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      <p className="text-sm font-semibold text-gray-900">
                        {money(
                          invoice.total,
                          invoice.currency,
                        )}
                      </p>

                      <div className="mt-1">
                        <StatusBadge
                          status={
                            invoice.status
                          }
                        />
                      </div>
                    </div>
                  </Link>
                ),
              )
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="font-semibold text-gray-900">
                Payment activity
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Latest payment attempts.
              </p>
            </div>

            <Link
              to={`/customer/${businessId}/billing`}
              className="text-sm font-medium text-indigo-600"
            >
              View history
            </Link>
          </div>

          <div className="mt-6 space-y-3">
            {recentPayments.length ===
            0 ? (
              <div className="py-8 text-center">
                <CreditCard className="mx-auto h-8 w-8 text-gray-300" />

                <p className="mt-3 text-sm text-gray-500">
                  No payment activity yet.
                </p>
              </div>
            ) : (
              recentPayments.map(
                (payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between gap-4 rounded-xl border border-gray-100 p-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-50">
                        {payment.status ===
                        "SUCCESS" ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                      </div>

                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          Payment attempt
                        </p>

                        <p className="mt-1 text-xs text-gray-400">
                          {formatDate(
                            payment.createdAt,
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">
                        {money(
                          payment.amount,
                          payment.currency,
                        )}
                      </p>

                      <StatusBadge
                        status={
                          payment.status
                        }
                      />
                    </div>
                  </div>
                ),
              )
            )}
          </div>
        </div>
      </section>

      {/* Outstanding */}
      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-amber-100 bg-amber-50/50 p-5">
          <div className="flex items-center gap-3">
            <CalendarClock className="h-5 w-5 text-amber-600" />

            <div>
              <p className="text-sm font-medium text-gray-700">
                Outstanding invoices
              </p>

              <p className="mt-1 text-2xl font-semibold text-gray-900">
                {openInvoices.length}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-5">
          <div className="flex items-center gap-3">
            <WalletCards className="h-5 w-5 text-indigo-600" />

            <div>
              <p className="text-sm font-medium text-gray-700">
                Outstanding balance
              </p>

              <p className="mt-1 text-2xl font-semibold text-gray-900">
                {openInvoices.length >
                0
                  ? money(
                      outstandingAmount,
                      openInvoices[0]
                        .currency,
                    )
                  : "₹0.00"}
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
  helper,
  textValue = false,
}: {
  icon: ReactNode;
  label: string;
  value: string | number;
  helper: string;
  textValue?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
          {icon}
        </div>

        <span
          className={`font-semibold text-gray-900 ${
            textValue
              ? "text-xl"
              : "text-2xl"
          }`}
        >
          {value}
        </span>
      </div>

      <p className="mt-5 text-sm font-medium text-gray-900">
        {label}
      </p>

      <p className="mt-1 text-xs text-gray-500">
        {helper}
      </p>
    </div>
  );
}