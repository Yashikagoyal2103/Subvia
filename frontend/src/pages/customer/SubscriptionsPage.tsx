import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, Clock, CreditCard, Sparkles } from "lucide-react";

import { subscriptionsApi, type Subscription } from "@/api/subscriptions";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { LoadingState } from "@/components/loading-state";
import { ErrorState } from "@/components/error-state";
import { formatMoney } from "@/lib/format";
import { toArray } from "@/lib/api-shape";

function fmtDate(iso?: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function CustomerSubscriptionsPage() {
  const { businessId = "" } = useParams();
  const hasBusiness = !!businessId;

  const q = useQuery({
    queryKey: ["subscriptions", businessId],
    queryFn: () => subscriptionsApi.list(businessId),
    enabled: hasBusiness,
  });

  if (!hasBusiness)
    return <ErrorState description="A valid business context is required." />;
  if (q.isPending) return <LoadingState message="Loading subscriptions…" />;
  if (q.isError)
    return (
      <ErrorState
        description="We couldn't load your subscriptions."
        retryAction={() => q.refetch()}
      />
    );

  const subs = toArray<Subscription>(q.data);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Subscriptions"
        description="Every active and historical subscription for this workspace."
      />

      {subs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--color-border-soft)] bg-white/60 px-6 py-16 text-center">
          <p className="text-sm font-medium text-[var(--color-ink)]">
            No subscriptions yet
          </p>
          <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
            Head over to Services to start one.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-[var(--color-border-soft)] bg-white shadow-[var(--shadow-soft)]">
          <div className="hidden grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_auto_auto] items-center gap-4 border-b border-[var(--color-border-soft)] bg-[var(--color-surface)]/60 px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-ink-subtle)] md:grid">
            <span>Plan</span>
            <span>Price</span>
            <span>Billing period</span>
            <span>Status</span>
            <span className="w-6" />
          </div>

          <ul className="divide-y divide-[var(--color-border-soft)]">
            {subs.map((s) => {
              const scheduledDowngrade = !!s.pendingPlanId;
              const cancellationScheduled =
                !!s.cancelAtPeriodEnd && !s.cancelledAt;
              return (
                <li key={s.id}>
                  <Link
                    to={`/customer/${businessId}/subscriptions/${s.id}`}
                    className="block px-5 py-4 transition hover:bg-[var(--color-surface)]"
                  >
                    <div className="grid grid-cols-1 items-center gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_auto_auto]">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--color-accent-soft)] text-[var(--color-ink)]">
                          <Sparkles className="h-4 w-4" />
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-[var(--color-ink)]">
                            {s.plan?.name ?? "Plan"}
                          </p>
                          <p className="truncate text-xs text-[var(--color-ink-muted)]">
                            {s.plan?.service?.name ?? "Service"}
                          </p>
                        </div>
                      </div>

                      <div>
                        <p className="text-sm font-semibold tabular-nums text-[var(--color-ink)]">
                          {formatMoney(s.price, s.currency)}
                        </p>
                        <p className="text-xs text-[var(--color-ink-muted)]">
                          {s.billingInterval === "MONTHLY" ? "Monthly" : "Yearly"}
                        </p>
                      </div>

                      <div className="text-xs text-[var(--color-ink-muted)]">
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3 w-3" />
                          <span>
                            {fmtDate(s.billingPeriodStart)} →{" "}
                            {fmtDate(s.billingPeriodEnd)}
                          </span>
                        </div>
                      </div>

                      <div>
                        <StatusBadge status={s.status} />
                      </div>

                      <ChevronRight className="hidden h-4 w-4 text-[var(--color-ink-subtle)] md:block" />
                    </div>

                    {(scheduledDowngrade || cancellationScheduled) && (
                      <div className="mt-3 flex flex-col gap-2 md:pl-12">
                        {scheduledDowngrade ? (
                          <div className="flex items-center gap-2 rounded-lg border-l-2 border-indigo-400 bg-indigo-50/60 px-3 py-2 text-xs text-indigo-800">
                            <CreditCard className="h-3.5 w-3.5" />
                            Scheduled change to{" "}
                            <span className="font-semibold">
                              {s.pendingPlan?.name ?? "a new plan"}
                            </span>{" "}
                            at the next billing period.
                          </div>
                        ) : null}
                        {cancellationScheduled ? (
                          <div className="flex items-center gap-2 rounded-lg border-l-2 border-amber-400 bg-amber-50/70 px-3 py-2 text-xs text-amber-900">
                            <Clock className="h-3.5 w-3.5" />
                            Cancellation scheduled at period end (
                            {fmtDate(s.billingPeriodEnd)}).
                          </div>
                        ) : null}
                      </div>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}