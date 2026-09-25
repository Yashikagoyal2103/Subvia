import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, CreditCard } from "lucide-react";

import { subscriptionsApi, type Subscription } from "@/api/subscriptions";
import { formatMoney } from "@/lib/format";
import { formatDate } from "@/lib/customer-utils";

import { CustomerPageHeader } from "@/components/customer/CustomerPageHeader";
import { GlassPanel } from "@/components/customer/GlassPanel";
import { MoneyText } from "@/components/customer/MoneyText";
import { SegmentedControl, type SegmentedOption } from "@/components/customer/SegmentedControl";
import { ServiceAvatar } from "@/components/customer/ServiceAvatar";
import { StatusPill } from "@/components/customer/StatusPill";
import { PageSkeleton } from "@/components/customer/Skeleton";
import { CustomerErrorState } from "@/components/customer/CustomerErrorState";
import { CustomerEmptyState } from "@/components/customer/CustomerEmptyState";

type FilterKey = "ALL" | "ACTIVE" | "PENDING" | "PAST_DUE" | "CANCELLED";

export function CustomerSubscriptionsPage() {
  const [filter, setFilter] = useState<FilterKey>("ALL");

  const query = useQuery({
    queryKey: ["customer-subscriptions"],
    queryFn: () => subscriptionsApi.list(1, 50),
  });

  const subs = useMemo(() => query.data ?? [], [query.data]);

  const counts = useMemo(() => {
    const c = { ALL: subs.length, ACTIVE: 0, PENDING: 0, PAST_DUE: 0, CANCELLED: 0 };
    for (const s of subs) {
      if (s.status === "ACTIVE") c.ACTIVE++;
      else if (s.status === "PENDING") c.PENDING++;
      else if (s.status === "PAST_DUE") c.PAST_DUE++;
      else if (s.status === "CANCELLED") c.CANCELLED++;
    }
    return c;
  }, [subs]);

  if (query.isPending) return <PageSkeleton />;

  if (query.isError) {
    return (
      <CustomerErrorState
        description="We couldn't load your subscriptions."
        retryAction={() => query.refetch()}
      />
    );
  }

  const subline =
    counts.ACTIVE > 0 && counts.PAST_DUE + counts.PENDING > 0
      ? `${counts.ACTIVE} active · ${counts.PAST_DUE + counts.PENDING} needs attention`
      : counts.ACTIVE > 0
        ? `${counts.ACTIVE} active`
        : counts.PAST_DUE + counts.PENDING > 0
          ? `${counts.PAST_DUE + counts.PENDING} needs attention`
          : "No active subscriptions";

  const options: SegmentedOption<FilterKey>[] = [
    { value: "ALL", label: "All", count: counts.ALL },
    { value: "ACTIVE", label: "Active", count: counts.ACTIVE },
    { value: "PENDING", label: "Pending", count: counts.PENDING },
    { value: "PAST_DUE", label: "Past due", count: counts.PAST_DUE },
    { value: "CANCELLED", label: "Cancelled", count: counts.CANCELLED },
  ].filter((o) => o.value === "ALL" || (o.count ?? 0) > 0) as SegmentedOption<FilterKey>[];

  const visible = subs.filter((s) => filter === "ALL" || s.status === filter);

  return (
    <div className="space-y-8">
      <CustomerPageHeader
        eyebrow="Billing"
        title="Subscriptions"
        description={subline}
      />

      {subs.length === 0 ? (
        <CustomerEmptyState
          icon={CreditCard}
          title="No subscriptions yet"
          description="Browse available services and pick a plan to start your first subscription."
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
        <>
          <SegmentedControl value={filter} onChange={setFilter} options={options} />

          {visible.length === 0 ? (
            <GlassPanel className="px-6 py-12 text-center">
              <p className="text-sm text-[var(--color-ink-muted)]">
                No subscriptions in this category.
              </p>
            </GlassPanel>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {visible.map((sub) => (
                <SubscriptionCard key={sub.id} sub={sub} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ────────── Card ────────── */

function SubscriptionCard({ sub }: { sub: Subscription }) {
  const serviceName = sub.plan?.service?.name ?? "Service";
  const planName = sub.plan?.name ?? "Plan";
  const hasPending = Boolean(sub.pendingPlanId);

  const endDate = formatDate(sub.billingPeriodEnd);

  let statusLine: string;
  if (sub.status === "CANCELLED") {
    statusLine = sub.cancelledAt
      ? `Cancelled ${formatDate(sub.cancelledAt)}`
      : "Cancelled";
  } else if (sub.status === "PAST_DUE") {
    statusLine = "Payment overdue";
  } else if (sub.status === "PENDING") {
    statusLine = "Awaiting payment";
  } else if (sub.cancelAtPeriodEnd) {
    statusLine = `Ends ${endDate}`;
  } else {
    statusLine = `Next billing · ${endDate}`;
  }

  return (
    <Link
      to={`/customer/subscriptions/${sub.id}`}
      className="glass group flex flex-col rounded-3xl p-5 transition hover:-translate-y-0.5"
    >
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

      {hasPending ? (
        <div className="mt-3 inline-flex w-fit items-center gap-2 rounded-full bg-[var(--color-warning-soft)] px-3 py-1 text-[11px] font-semibold text-[#7c540f]">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-warning)]" />
          Plan change scheduled
        </div>
      ) : null}

      <div className="mt-6 flex items-center justify-between border-t border-[rgba(20,22,26,0.06)] pt-4">
        <span className="text-xs text-[var(--color-ink-muted)]">{statusLine}</span>
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--color-ink-muted)] transition group-hover:text-[var(--color-ink)]">
          View
          <ArrowRight className="h-3 w-3 transition group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}

// re-export the legacy alias so any leftover imports still resolve
export { CustomerSubscriptionsPage as SubscriptionsPage };
export const __formatMoneyGuard = formatMoney;