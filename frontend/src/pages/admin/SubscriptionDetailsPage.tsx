import { useMemo } from "react";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Ban,
  CalendarClock,
  CheckCircle2,
  CreditCard,
  FileText,
  RefreshCw,
  Sparkles,
  XCircle,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { adminApi, type AdminSubscription } from "../../api/admin";
import { formatMoney } from "@/lib/format";
import { useCurrentBusinessName } from "@/hooks/useCurrentBusinessName";

import { AdminCard } from "@/components/admin/AdminCard";
import { AdminErrorState } from "@/components/admin/AdminErrorState";
import { AdminLoadingState } from "@/components/admin/AdminLoadingState";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { InsightBanner } from "@/components/admin/InsightBanner";
import { ListRow } from "@/components/admin/ListRow";
import { StatusBadge } from "@/components/status-badge";

interface TimelineEvent {
  id: string;
  type: string;
  createdAt: string;
  metadata?: Record<string, unknown> | null;
}

function date(value: string | null | undefined) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function dateTime(value: string) {
  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function eventIcon(type: string) {
  if (type === "CREATED") return <Sparkles className="h-4 w-4" />;
  if (type === "UPGRADED") return <ArrowUpCircle className="h-4 w-4" />;
  if (type === "DOWNGRADE_SCHEDULED" || type === "DOWNGRADE_APPLIED")
    return <ArrowDownCircle className="h-4 w-4" />;
  if (type === "CANCEL_REQUESTED" || type === "CANCELLED")
    return <Ban className="h-4 w-4" />;
  if (type === "RENEWED") return <RefreshCw className="h-4 w-4" />;
  if (type === "PAYMENT_SUCCEEDED") return <CheckCircle2 className="h-4 w-4" />;
  if (type === "PAYMENT_FAILED") return <XCircle className="h-4 w-4" />;
  return <CalendarClock className="h-4 w-4" />;
}

function eventLabel(type: string) {
  return type
    .toLowerCase()
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function eventSentence(type: string, metadata: unknown): string | null {
  if (!metadata || typeof metadata !== "object") return null;
  const m = metadata as Record<string, unknown>;
  const s = (k: string) => (typeof m[k] === "string" ? (m[k] as string) : null);

  switch (type) {
    case "CREATED": {
      const plan = s("planName");
      return plan ? `Subscribed to ${plan}` : null;
    }
    case "UPGRADED": {
      const from = s("fromPlanName");
      const to = s("toPlanName");
      if (from && to) return `Upgraded from ${from} to ${to}`;
      return null;
    }
    case "DOWNGRADE_SCHEDULED": {
      const from = s("fromPlanName");
      const to = s("toPlanName");
      const eff = s("effectiveAt");
      if (from && to && eff)
        return `Downgrade from ${from} to ${to} scheduled for ${date(eff)}`;
      return null;
    }
    case "DOWNGRADE_APPLIED": {
      const from = s("fromPlanName");
      const to = s("toPlanName");
      if (from && to) return `Downgraded from ${from} to ${to}`;
      return null;
    }
    case "CANCEL_REQUESTED": {
      const eff = s("effectiveAt");
      return eff ? `Cancellation requested · effective ${date(eff)}` : null;
    }
    case "CANCELLED": {
      const mode = s("mode");
      const credit = typeof m.creditCreated === "number" ? m.creditCreated : 0;
      if (mode === "IMMEDIATE" && credit > 0)
        return `Cancelled immediately · ${formatMoney(credit, "INR")} credited`;
      return mode === "IMMEDIATE" ? "Cancelled immediately" : null;
    }
    default:
      return null;
  }
}

export function AdminSubscriptionDetailsPage() {
  const { businessId, subscriptionId } = useParams<{
    businessId: string;
    subscriptionId: string;
  }>();
  const businessName = useCurrentBusinessName();

  const query = useQuery({
    queryKey: ["admin-subscription", businessId, subscriptionId],
    queryFn: () => adminApi.subscription(businessId!, subscriptionId!),
    enabled: Boolean(businessId && subscriptionId),
  });

  // Events may or may not be included in the response.
  const rawEvents = (query.data as unknown as { events?: TimelineEvent[] })
    ?.events;
  const events = useMemo<TimelineEvent[]>(() => rawEvents ?? [], [rawEvents]);

  if (!businessId || !subscriptionId) {
    return <AdminErrorState message="Subscription context is missing." />;
  }
  if (query.isLoading) return <AdminLoadingState variant="detail" />;
  if (query.isError || !query.data) {
    return (
      <AdminErrorState
        message="We couldn't load this subscription."
        onRetry={() => query.refetch()}
      />
    );
  }

  const sub: AdminSubscription = query.data;

  return (
    <div className="space-y-6">
      <Link
        to={`/admin/${businessId}/subscriptions`}
        className="text-xs font-semibold text-[var(--a-ink-2)] transition hover:text-[var(--a-ink)]"
      >
        ← Back to subscriptions
      </Link>

      <AdminPageHeader
        eyebrow={
          businessName
            ? `${businessName} / Subscriptions / ${sub.plan.name}`
            : `Subscriptions / ${sub.plan.name}`
        }
        title={sub.plan.name}
        description={`${sub.plan.service.name} · ${sub.customerProfile.user.email}`}
        actions={<StatusBadge status={sub.status} />}
      />

      {sub.pendingPlan ? (
        <InsightBanner tone="neutral">
          <span className="font-semibold">Plan change scheduled.</span>{" "}
          Moving to <span className="font-semibold">{sub.pendingPlan.name}</span>{" "}
          at the end of the current period ({date(sub.billingPeriodEnd)}).
        </InsightBanner>
      ) : null}

      {sub.cancelAtPeriodEnd ? (
        <InsightBanner tone="warning">
          <span className="font-semibold">Cancellation scheduled.</span> Access
          ends {date(sub.billingPeriodEnd)}.
        </InsightBanner>
      ) : null}

      {sub.status === "PAST_DUE" ? (
        <InsightBanner tone="warning">
          <span className="font-semibold">Payment overdue.</span> Review the
          related invoices to recover this subscription.
        </InsightBanner>
      ) : null}

      <AdminCard>
        <h2 className="text-sm font-semibold text-[var(--a-ink)]">
          Subscription details
        </h2>
        <dl className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Customer" value={sub.customerProfile.user.email} />
          <Field label="Service" value={sub.plan.service.name} />
          <Field label="Plan" value={sub.plan.name} />
          <Field
            label="Billing interval"
            value={sub.billingInterval === "MONTHLY" ? "Monthly" : "Yearly"}
          />
          <Field
            label="Price"
            value={`${formatMoney(sub.price, sub.currency)} / ${
              sub.billingInterval === "MONTHLY" ? "mo" : "yr"
            }`}
          />
          <Field label="Status" value={sub.status} />
          <Field
            label="Current period start"
            value={date(sub.billingPeriodStart)}
          />
          <Field
            label="Current period end"
            value={date(sub.billingPeriodEnd)}
          />
          <Field label="Created" value={date(sub.createdAt)} />
        </dl>
      </AdminCard>

      <AdminCard variant="flush">
        <div className="border-b border-[var(--a-border)] px-6 py-5">
          <h2 className="text-sm font-semibold text-[var(--a-ink)]">
            Billing information
          </h2>
          <p className="mt-0.5 text-xs text-[var(--a-ink-3)]">
            Invoices related to this subscription.
          </p>
        </div>
        <ul className="px-4 py-2">
          <li>
            <ListRow
              icon={<FileText className="h-4 w-4" />}
              leadingBadgeTone="indigo"
              title="View invoices for this subscription"
              subtitle={`${sub._count.invoices} invoice${
                sub._count.invoices === 1 ? "" : "s"
              } recorded`}
              href={`/admin/${businessId}/invoices`}
            />
          </li>
          <li>
            <ListRow
              icon={<CreditCard className="h-4 w-4" />}
              leadingBadgeTone="emerald"
              title="Inspect payments for this business"
              subtitle="Cross-reference settlement activity"
              href={`/admin/${businessId}/payments`}
            />
          </li>
        </ul>
      </AdminCard>

      <AdminCard variant="flush">
        <div className="border-b border-[var(--a-border)] px-6 py-5">
          <h2 className="text-sm font-semibold text-[var(--a-ink)]">
            Event history
          </h2>
          <p className="mt-0.5 text-xs text-[var(--a-ink-3)]">
            {sub._count.events} lifecycle event
            {sub._count.events === 1 ? "" : "s"} recorded.
          </p>
        </div>

        {events.length === 0 ? (
          <p className="px-6 py-10 text-center text-sm text-[var(--a-ink-2)]">
            No events available in this response.
          </p>
        ) : (
          <ol className="relative px-6 py-5">
            <span
              aria-hidden
              className="absolute bottom-6 left-[2.05rem] top-6 w-px bg-[var(--a-border)]"
            />
            {events.map((ev) => {
              const sentence = eventSentence(ev.type, ev.metadata);
              return (
                <li key={ev.id} className="relative flex items-start gap-3 py-3">
                  <span className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white ring-1 ring-[var(--a-border)] text-[var(--a-ink-2)]">
                    {eventIcon(ev.type)}
                  </span>
                  <div className="min-w-0 flex-1 pt-0.5">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-semibold text-[var(--a-ink)]">
                        {eventLabel(ev.type)}
                      </p>
                      <span className="shrink-0 text-[11px] text-[var(--a-ink-3)]">
                        {dateTime(ev.createdAt)}
                      </span>
                    </div>
                    {sentence ? (
                      <p className="mt-0.5 text-xs text-[var(--a-ink-2)]">
                        {sentence}
                      </p>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </AdminCard>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--a-ink-3)]">
        {label}
      </dt>
      <dd className="mt-1 truncate text-sm text-[var(--a-ink)]">{value}</dd>
    </div>
  );
}