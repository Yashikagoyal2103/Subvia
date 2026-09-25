import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, CreditCard } from "lucide-react";

import { subscriptionsApi } from "@/api/subscriptions";
import { formatDate } from "@/lib/customer-utils";

import { CustomerPageHeader } from "@/components/customer/CustomerPageHeader";
import { MoneyText } from "@/components/customer/MoneyText";
import { StatusPill } from "@/components/customer/StatusPill";
import { ServiceAvatar } from "@/components/customer/ServiceAvatar";
import { CustomerErrorState } from "@/components/customer/CustomerErrorState";
import { CustomerEmptyState } from "@/components/customer/CustomerEmptyState";
import { PageSkeleton } from "@/components/customer/Skeleton";

export function CustomerPlansPage() {
  const query = useQuery({
    queryKey: ["customer-plans"],
    queryFn: () => subscriptionsApi.list(),
  });

  if (query.isPending) return <PageSkeleton />;

  if (query.isError) {
    return (
      <CustomerErrorState
        description="We couldn't load your current plans."
        retryAction={() => query.refetch()}
      />
    );
  }

  const plans = query.data.filter(
    (s) =>
      s.status === "ACTIVE" || s.status === "PAST_DUE" || s.status === "PENDING",
  );

  return (
    <div className="space-y-8">
      <CustomerPageHeader
        eyebrow="Subscriptions"
        title="My current plans"
        description="The plans you're currently subscribed to."
      />

      {plans.length === 0 ? (
        <CustomerEmptyState
          icon={CreditCard}
          title="No current plans"
          description="Explore available services to choose your first plan."
          action={
            <Link
              to="/customer/explore"
              className="inline-flex items-center gap-2 rounded-full bg-[var(--color-charcoal)] px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
            >
              Explore services
              <ArrowRight className="h-4 w-4" />
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {plans.map((sub) => {
            const serviceName = sub.plan?.service?.name ?? "Service";
            const planName = sub.plan?.name ?? "Plan";
            const hasPendingChange = Boolean(sub.pendingPlanId);

            return (
              <Link
                key={sub.id}
                to={`/customer/subscriptions/${sub.id}`}
                className="glass group relative flex flex-col justify-between overflow-hidden rounded-3xl p-6 transition hover:-translate-y-0.5"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <ServiceAvatar name={serviceName} size="md" />
                    <StatusPill status={sub.status} />
                  </div>

                  <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-ink-subtle)]">
                    {serviceName}
                  </p>
                  <h2 className="font-display mt-1 text-lg font-semibold tracking-tight text-[var(--color-ink)]">
                    {planName}
                  </h2>

                  <div className="mt-4 flex items-baseline gap-1.5">
                    <MoneyText amount={sub.price} currency={sub.currency} size="xl" />
                    <span className="text-sm text-[var(--color-ink-muted)]">
                      /{sub.billingInterval === "MONTHLY" ? "mo" : "yr"}
                    </span>
                  </div>

                  {hasPendingChange ? (
                    <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-[var(--color-warning-soft)] px-3 py-1 text-[11px] font-semibold text-[#7c540f]">
                      <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-warning)]" />
                      Plan change scheduled
                    </div>
                  ) : null}
                </div>

                <div className="mt-6 flex items-center justify-between border-t border-[rgba(20,22,26,0.06)] pt-4">
                  <span className="text-xs text-[var(--color-ink-muted)]">
                    {sub.cancelAtPeriodEnd
                      ? `Ends ${formatDate(sub.billingPeriodEnd)}`
                      : `Renews ${formatDate(sub.billingPeriodEnd)}`}
                  </span>
                  <ArrowRight className="h-4 w-4 text-[var(--color-ink-subtle)] transition group-hover:translate-x-0.5 group-hover:text-[var(--color-ink)]" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}