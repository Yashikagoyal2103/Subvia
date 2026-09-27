import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useInfiniteQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Inbox,
  Loader2,
  Receipt,
  XCircle,
} from "lucide-react";

import {
  billingActivityApi,
  type BillingActivity,
} from "@/api/billing-activity";
import { formatMoney } from "@/lib/format";
import { dayGroupLabel, formatDate, groupBy } from "@/lib/customer-utils";

import { CustomerEmptyState } from "@/components/customer/CustomerEmptyState";
import { CustomerErrorState } from "@/components/customer/CustomerErrorState";
import { CustomerPageHeader } from "@/components/customer/CustomerPageHeader";
import { GlassPanel } from "@/components/customer/GlassPanel";
import { PanelHeader } from "@/components/customer/PanelHeader";
import { PageSkeleton } from "@/components/customer/Skeleton";

const PAGE_SIZE = 20;

export function CustomerBillingHistoryPage() {
  const query = useInfiniteQuery({
    queryKey: ["customer-billing-activity-infinite"],
    queryFn: ({ pageParam }) =>
      billingActivityApi.list(pageParam as number, PAGE_SIZE),
    initialPageParam: 1,
    getNextPageParam: (last) => {
      // Guard — react-query calls this even before the first page resolves.
      if (!last || !last.pagination) return undefined;
      return last.pagination.hasNextPage
        ? last.pagination.page + 1
        : undefined;
    },
  });

  const activities = useMemo(
    () => query.data?.pages.flatMap((p) => p.data) ?? [],
    [query.data],
  );

  const invoiceIndex = useMemo(() => {
    const map = new Map<string, { invoiceNumber: string; service: string }>();
    for (const item of activities) {
      if (item.type === "INVOICE") {
        map.set(item.invoiceId, {
          invoiceNumber: item.invoiceNumber,
          service: item.service,
        });
      }
    }
    return map;
  }, [activities]);

  const grouped = useMemo(
    () => groupBy(activities, (i) => dayGroupLabel(i.createdAt)),
    [activities],
  );

  if (query.isPending) return <PageSkeleton />;

  if (query.isError) {
    return (
      <CustomerErrorState
        description="We couldn't load your billing activity."
        retryAction={() => query.refetch()}
      />
    );
  }

    return (
    <div className="space-y-8">
      <CustomerPageHeader
        eyebrow="Activity"
        title="Billing"
        description="Track subscription and invoice activity across your account."
      />

      {activities.length === 0 ? (
        <CustomerEmptyState
          icon={Inbox}
          title="Billing activity will appear here"
          description="Once subscriptions and invoices are created, every event shows up in this timeline."
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
        <div className="space-y-6">
          {grouped.map(([label, items]) => (
            <GlassPanel key={String(label)} className="overflow-hidden">
              <PanelHeader title={String(label)} />
              <ul className="divide-y divide-[rgba(20,22,26,0.06)]">
                {items.map((item) => (
                  <li key={item.id}>
                    <ActivityRow item={item} invoiceIndex={invoiceIndex} />
                  </li>
                ))}
              </ul>
            </GlassPanel>
          ))}

          {query.hasNextPage ? (
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => query.fetchNextPage()}
                disabled={query.isFetchingNextPage}
                className="inline-flex items-center gap-2 rounded-full bg-[var(--color-charcoal)] px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
              >
                {query.isFetchingNextPage ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Loading…
                  </>
                ) : (
                  "Load more"
                )}
              </button>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );

}

/* ────────── Row ────────── */

interface RowProps {
  item: BillingActivity;
  invoiceIndex: Map<string, { invoiceNumber: string; service: string }>;
}

function ActivityRow({ item, invoiceIndex }: RowProps) {
  if (item.type === "INVOICE") {
    const isPaid = item.status === "PAID";
    const isVoid = item.status === "VOID";
    const isDraft = item.status === "DRAFT";

    const title = isPaid
      ? "Invoice paid"
      : isVoid
        ? "Invoice voided"
        : isDraft
          ? "Draft invoice"
          : "Invoice issued";

    const tone = isPaid
      ? "positive"
      : isVoid || isDraft
        ? "grey"
        : "warning";

    const Icon = isPaid ? CheckCircle2 : isVoid || isDraft ? Receipt : Clock;

    return (
      <RowShell to={`/customer/invoices/${item.invoiceId}`}>
        <IconTile tone={tone}>
          <Icon className="h-4 w-4" />
        </IconTile>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-[var(--color-ink)]">
            {title}
          </p>
          <p className="mt-0.5 truncate text-xs text-[var(--color-ink-muted)]">
            {item.invoiceNumber} · {item.service} · {formatDate(item.createdAt)}
          </p>
        </div>
        <AmountAndStatus
          amount={item.amount}
          currency={item.currency}
          status={item.status}
          tone="neutral"
        />
      </RowShell>
    );
  }

  // PAYMENT
  const isSuccess = item.status === "SUCCESS";
  const isPending = item.status === "PENDING";
  const isFailed = item.status === "FAILED";

  const title = isSuccess
    ? "Payment successful"
    : isPending
      ? "Payment pending"
      : "Payment failed";

  const tone = isSuccess ? "positive" : isPending ? "warning" : "negative";

  const Icon = isSuccess ? CheckCircle2 : isPending ? Clock : XCircle;

  const invoiceMeta = invoiceIndex.get(item.invoiceId);
  const subtitle = invoiceMeta
    ? `${invoiceMeta.invoiceNumber} · ${invoiceMeta.service} · ${formatDate(item.createdAt)}`
    : `Invoice payment · ${formatDate(item.createdAt)}`;

  return (
    <RowShell to={`/customer/invoices/${item.invoiceId}`}>
      <IconTile tone={tone}>
        <Icon className="h-4 w-4" />
      </IconTile>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-[var(--color-ink)]">
          {title}
        </p>
        <p className="mt-0.5 truncate text-xs text-[var(--color-ink-muted)]">
          {subtitle}
        </p>
      </div>
      <AmountAndStatus
        amount={item.amount}
        currency={item.currency}
        status={item.status}
        tone={isSuccess ? "positive" : isFailed ? "negative" : "neutral"}
        prefix={isSuccess ? "+" : ""}
      />
    </RowShell>
  );
}

/* ────────── Primitives ────────── */

function RowShell({
  to,
  children,
}: {
  to: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      to={to}
      className="group flex items-center gap-3 px-6 py-4 transition hover:bg-white/50"
    >
      {children}
      <ArrowRight className="hidden h-4 w-4 text-[var(--color-ink-subtle)] transition group-hover:translate-x-0.5 group-hover:text-[var(--color-ink)] sm:block" />
    </Link>
  );
}

function IconTile({
  tone,
  children,
}: {
  tone: "positive" | "warning" | "negative" | "grey";
  children: React.ReactNode;
}) {
  const cls =
    tone === "positive"
      ? "bg-[var(--color-positive-soft)] text-[var(--color-positive)]"
      : tone === "warning"
        ? "bg-[var(--color-warning-soft)] text-[var(--color-warning)]"
        : tone === "negative"
          ? "bg-[var(--color-negative-soft)] text-[var(--color-negative)]"
          : "bg-white/70 text-[var(--color-ink-muted)]";
  return (
    <span
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ring-1 ring-white/60 ${cls}`}
    >
      {children}
    </span>
  );
}

function AmountAndStatus({
  amount,
  currency,
  status,
  tone,
  prefix = "",
}: {
  amount: number;
  currency: string;
  status: string;
  tone: "positive" | "negative" | "neutral";
  prefix?: string;
}) {
  const amountCls =
    tone === "positive"
      ? "text-[var(--color-positive)]"
      : tone === "negative"
        ? "text-[var(--color-negative)]"
        : "text-[var(--color-ink)]";

  const statusLabel = humanize(status);
  const statusCls =
    tone === "positive"
      ? "text-[var(--color-positive)]"
      : tone === "negative"
        ? "text-[var(--color-negative)]"
        : "text-[var(--color-ink-subtle)]";

  return (
    <div className="flex shrink-0 flex-col items-end gap-0.5">
      <span className={`text-sm font-semibold tabular-nums ${amountCls}`}>
        {prefix}
        {formatMoney(amount, currency)}
      </span>
      <span className={`text-[10px] font-semibold uppercase tracking-[0.12em] ${statusCls}`}>
        {statusLabel}
      </span>
    </div>
  );
}

function humanize(s: string) {
  return s
    .toLowerCase()
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
