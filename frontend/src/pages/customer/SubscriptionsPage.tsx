import {
  ArrowRight,
  CalendarDays,
  CreditCard,
  Package,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";

import { useSubscriptions } from "../../hooks/useSubscriptions";
import { StatusBadge } from "../../components/status-badge";
import { LoadingState } from "../../components/loading-state";
import { ErrorState } from "../../components/error-state";

const currencySymbol = {
  INR: "₹",
  USD: "$",
};

function formatMoney(
  amount: number,
  currency: "INR" | "USD",
) {
  return `${currencySymbol[currency]}${(
    amount / 100
  ).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    },
  );
}

export function CustomerSubscriptionsPage() {
  const { businessId } =
    useParams<{
      businessId: string;
    }>();

  const query =
    useSubscriptions(
      businessId ?? "",
    );

  if (!businessId) {
    return (
      <ErrorState
        description="A valid business context is required."
      />
    );
  }

  if (query.isLoading) {
    return (
      <LoadingState message="Loading subscriptions..." />
    );
  }

  if (query.isError) {
    return (
      <ErrorState
        description="We couldn't load your subscriptions."
        retryAction={() =>
          query.refetch()
        }
      />
    );
  }

  const subscriptions =
    query.data ?? [];

  const active = subscriptions.filter(
    (item) =>
      item.status === "ACTIVE",
  ).length;

  const pending = subscriptions.filter(
    (item) =>
      item.status === "PENDING",
  ).length;

  const pastDue = subscriptions.filter(
    (item) =>
      item.status === "PAST_DUE",
  ).length;

  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">
          Billing
        </p>

        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-gray-900">
          Your subscriptions
        </h1>

        <p className="mt-2 text-sm text-gray-500">
          Manage your plans, billing periods and
          upcoming changes.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Active
            </p>
            <Package className="h-5 w-5 text-emerald-500" />
          </div>

          <p className="mt-3 text-3xl font-semibold">
            {active}
          </p>

          <p className="mt-1 text-xs text-gray-400">
            Currently running
          </p>
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Pending
            </p>
            <CreditCard className="h-5 w-5 text-amber-500" />
          </div>

          <p className="mt-3 text-3xl font-semibold">
            {pending}
          </p>

          <p className="mt-1 text-xs text-gray-400">
            Awaiting payment
          </p>
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Past due
            </p>
            <CalendarDays className="h-5 w-5 text-red-500" />
          </div>

          <p className="mt-3 text-3xl font-semibold">
            {pastDue}
          </p>

          <p className="mt-1 text-xs text-gray-400">
            Need attention
          </p>
        </div>
      </div>

      {subscriptions.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-white p-12 text-center">
          <Package className="mx-auto h-10 w-10 text-gray-300" />

          <h2 className="mt-4 text-lg font-semibold">
            No subscriptions yet
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            Explore available services and choose
            a plan to get started.
          </p>

          <Link
            to={`/customer/${businessId}/services`}
            className="mt-6 inline-flex rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white"
          >
            Explore services
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {subscriptions.map(
            (subscription) => (
              <div
                key={subscription.id}
                className="rounded-2xl border bg-white p-6 shadow-sm"
              >
                <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-lg font-semibold">
                        {subscription.plan?.name ??
                          "Subscription"}
                      </h2>

                      <StatusBadge
                        status={
                          subscription.status
                        }
                      />

                      {subscription.cancelAtPeriodEnd && (
                        <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700">
                          Cancels at period end
                        </span>
                      )}
                    </div>

                    <p className="mt-2 text-sm text-gray-500">
                      {subscription.plan?.service?.name ??
                        "Service"}
                    </p>
                  </div>

                  <div className="flex items-center gap-8">
                    <div>
                      <p className="text-xs text-gray-400">
                        Billing
                      </p>

                      <p className="mt-1 font-semibold">
                        {formatMoney(
                          subscription.price,
                          subscription.currency,
                        )}

                        <span className="ml-1 text-xs font-normal text-gray-400">
                          /{" "}
                          {subscription.billingInterval.toLowerCase()}
                        </span>
                      </p>
                    </div>

                    <div className="hidden sm:block">
                      <p className="text-xs text-gray-400">
                        Next period
                      </p>

                      <p className="mt-1 text-sm font-medium">
                        {formatDate(
                          subscription.billingPeriodEnd,
                        )}
                      </p>
                    </div>

                    <Link
                      to={`/customer/${businessId}/subscriptions/${subscription.id}`}
                      className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium hover:bg-gray-50"
                    >
                      View
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </div>
            ),
          )}
        </div>
      )}
    </div>
  );
}