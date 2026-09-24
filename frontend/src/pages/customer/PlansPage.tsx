import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, CreditCard } from "lucide-react";

import { subscriptionsApi } from "@/api/subscriptions";
import { PageHeader } from "@/components/page-header";
import { LoadingState } from "@/components/loading-state";
import { ErrorState } from "@/components/error-state";
import { StatusBadge } from "@/components/status-badge";
import { formatMoney } from "@/lib/format";

export function CustomerPlansPage() {
  const query = useQuery({
    queryKey: ["customer-plans"],
    queryFn: () => subscriptionsApi.list(),
  });

  if (query.isPending) {
    return <LoadingState message="Loading your plans…" />;
  }

  if (query.isError) {
    return (
      <ErrorState
        description="We couldn't load your current plans."
        retryAction={() => query.refetch()}
      />
    );
  }

  const plans = query.data.filter(
    (subscription) =>
      subscription.status === "ACTIVE" ||
      subscription.status === "PAST_DUE" ||
      subscription.status === "PENDING",
  );

  return (
    <div className="space-y-8">
      <PageHeader
        title="Plans"
        description="The plans you're currently subscribed to."
      />

      {plans.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--color-border-soft)] bg-white/60 px-6 py-16 text-center">
          <CreditCard className="mx-auto h-8 w-8 text-[var(--color-ink-subtle)]" />

          <p className="mt-4 text-sm font-medium text-[var(--color-ink)]">
            No current plans
          </p>

          <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
            Explore available services to choose your first plan.
          </p>

          <Link
            to="/customer/explore"
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-[var(--color-ink)] px-4 py-2.5 text-sm font-semibold text-white"
          >
            Explore services
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {plans.map((subscription) => (
            <Link
              key={subscription.id}
              to={`/customer/subscriptions/${subscription.id}`}
              className="group rounded-2xl border border-[var(--color-border-soft)] bg-white p-5 shadow-[var(--shadow-soft)] transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-card)]"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--color-ink-subtle)]">
                    {subscription.plan?.service?.name ?? "Service"}
                  </p>

                  <h2 className="mt-1 text-lg font-semibold text-[var(--color-ink)]">
                    {subscription.plan?.name ?? "Plan"}
                  </h2>
                </div>

                <StatusBadge status={subscription.status} />
              </div>

              <div className="mt-6 flex items-baseline gap-1.5">
                <span className="text-2xl font-semibold tabular-nums text-[var(--color-ink)]">
                  {formatMoney(
                    subscription.price,
                    subscription.currency,
                  )}
                </span>

                <span className="text-sm text-[var(--color-ink-muted)]">
                  /{subscription.billingInterval === "MONTHLY" ? "mo" : "yr"}
                </span>
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-[var(--color-border-soft)] pt-4">
                <span className="text-xs text-[var(--color-ink-muted)]">
                  Next period ends{" "}
                  {new Date(
                    subscription.billingPeriodEnd,
                  ).toLocaleDateString()}
                </span>

                <ArrowRight className="h-4 w-4 text-[var(--color-ink-subtle)] transition group-hover:translate-x-0.5" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}