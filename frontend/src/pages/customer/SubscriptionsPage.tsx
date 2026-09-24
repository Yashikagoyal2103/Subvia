import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, CreditCard } from "lucide-react";

import { subscriptionsApi, type Subscription } from "@/api/subscriptions";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { LoadingState } from "@/components/loading-state";
import { ErrorState } from "@/components/error-state";
import { formatMoney } from "@/lib/format";

export function CustomerSubscriptionsPage() {
  const query = useQuery({
    queryKey: ["customer-subscriptions"],
    queryFn: () => subscriptionsApi.list(),
  });

  if (query.isPending) {
    return <LoadingState message="Loading subscriptions…" />;
  }

  if (query.isError) {
    return (
      <ErrorState
        description="We couldn't load your subscriptions."
        retryAction={() => query.refetch()}
      />
    );
  }

  const subscriptions: Subscription[] = query.data;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Subscriptions"
        description="Manage your current and historical subscriptions."
      />

      {subscriptions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--color-border-soft)] bg-white/60 px-6 py-16 text-center">
          <CreditCard className="mx-auto h-8 w-8 text-[var(--color-ink-subtle)]" />

          <p className="mt-4 text-sm font-medium text-[var(--color-ink)]">
            No subscriptions yet
          </p>

          <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
            Browse available services to get started.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-[var(--color-border-soft)] bg-white shadow-[var(--shadow-soft)]">
          <ul className="divide-y divide-[var(--color-border-soft)]">
            {subscriptions.map((subscription) => (
              <li key={subscription.id}>
                <Link
                  to={`/customer/subscriptions/${subscription.id}`}
                  className="flex flex-col gap-4 px-5 py-5 transition hover:bg-[var(--color-surface)] sm:flex-row sm:items-center"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--color-surface)]">
                    <CreditCard className="h-4 w-4 text-[var(--color-ink-muted)]" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-[var(--color-ink)]">
                      {subscription.plan?.service?.name ?? "Service"} ·{" "}
                      {subscription.plan?.name ?? "Plan"}
                    </p>

                    <p className="mt-1 text-xs text-[var(--color-ink-muted)]">
                      {formatMoney(
                        subscription.price,
                        subscription.currency,
                      )}{" "}
                      /{" "}
                      {subscription.billingInterval === "MONTHLY"
                        ? "month"
                        : "year"}
                    </p>
                  </div>

                  <StatusBadge status={subscription.status} />

                  <ChevronRight className="hidden h-4 w-4 text-[var(--color-ink-subtle)] sm:block" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}