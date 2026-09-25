import { CreditCard } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "../../api/admin";
import { LoadingState } from "../../components/loading-state";
import { ErrorState } from "../../components/error-state";
import { StatusBadge } from "../../components/status-badge";
import  { useState } from "react";

const currencySymbol: Record<string, string> = { INR: "₹", USD: "$" };

function money(amount: number, currency: string) {
  return `${currencySymbol[currency] ?? currency}${(amount / 100).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function date(value: string) {
  return new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export function AdminSubscriptionsPage() {
  const { businessId } = useParams<{ businessId: string }>();
  const [page, setPage] = useState(1);

  const query = useQuery({
    queryKey: ["admin-subscriptions", businessId, page],
    queryFn: () => adminApi.subscriptions(businessId!, page),
    enabled: Boolean(businessId),
  });

  if (!businessId) return <ErrorState description="A valid business context is required." />;
  if (query.isLoading) return <LoadingState message="Loading subscriptions..." />;
  if (query.isError) return <ErrorState description="We couldn't load the subscriptions." retryAction={() => query.refetch()} />;

  const subscriptions = query.data?.data ?? [];

  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">Billing</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-gray-900">Subscriptions</h1>
        <p className="mt-2 text-sm text-gray-500">Monitor every customer subscription in this business.</p>
      </header>

      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-6 py-5">
          <h2 className="font-semibold text-gray-900">Subscription portfolio</h2>
          <p className="mt-1 text-sm text-gray-500">{subscriptions.length} subscriptions on this page</p>
        </div>

        {subscriptions.length === 0 ? (
          <div className="py-16 text-center">
            <CreditCard className="mx-auto h-10 w-10 text-gray-300" />
            <p className="mt-4 font-semibold">No subscriptions yet</p>
            <p className="mt-1 text-sm text-gray-500">Customer subscriptions will appear here.</p>
          </div>
        ) : (
          <div className="divide-y">
            {subscriptions.map((subscription) => (
              <Link
                key={subscription.id}
                to={`/admin/${businessId}/subscriptions/${subscription.id}`}
                className="block px-6 py-5 transition hover:bg-gray-50"
              >
                <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <p className="font-semibold text-gray-900">{subscription.plan.name}</p>
                      <StatusBadge status={subscription.status} />
                      {subscription.cancelAtPeriodEnd && (
                        <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs text-amber-700">
                          Cancels at period end
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-gray-500">
                      {subscription.plan.service.name} · {subscription.customerProfile.user.email}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-5 text-sm sm:grid-cols-4">
                    <div>
                      <p className="text-xs text-gray-400">Price</p>
                      <p className="mt-1 font-semibold">{money(subscription.price, subscription.currency)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Interval</p>
                      <p className="mt-1 font-medium">{subscription.billingInterval}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Next period</p>
                      <p className="mt-1 font-medium">{date(subscription.billingPeriodEnd)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Invoices</p>
                      <p className="mt-1 font-medium">{subscription._count.invoices}</p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
            {query.data?.pagination.hasNextPage || page > 1 ? (
              <div className="flex items-center justify-between border-t border-gray-100 px-5 py-4">
                <button
                  type="button"
                  disabled={page === 1}
                  onClick={() => setPage((value) => value - 1)}
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium disabled:opacity-40"
                >
                  Previous
                </button>

                <span className="text-sm text-gray-500">
                  Page {page}
                </span>

                <button
                  type="button"
                  disabled={!query.data?.pagination.hasNextPage}
                  onClick={() => setPage((value) => value + 1)}
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}