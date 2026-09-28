
import { useMemo, useState } from "react";
import {
  Activity,
  CheckCircle2,
  Clock3,
  XCircle,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { adminApi, type AdminBillingEvent } from "../../api/admin";
import { useCurrentBusinessName } from "@/hooks/useCurrentBusinessName";

import { AdminCard } from "@/components/admin/AdminCard";
import { AdminErrorState } from "@/components/admin/AdminErrorState";
import { AdminLoadingState } from "@/components/admin/AdminLoadingState";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminPagination } from "@/components/admin/AdminPagination";

function dayGroupLabel(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const dMid = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const nMid = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  ).getTime();
  const diff = Math.round((nMid - dMid) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function label(type: string) {
  return type
    .toLowerCase()
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function eventIcon(type: string) {
  if (
    [
      "CREATED",
      "UPGRADED",
      "DOWNGRADE_APPLIED",
      "RENEWED",
      "PAYMENT_SUCCEEDED",
    ].includes(type)
  ) {
    return <CheckCircle2 className="h-4 w-4" />;
  }
  if (["PAYMENT_FAILED", "CANCELLED"].includes(type)) {
    return <XCircle className="h-4 w-4" />;
  }
  return <Clock3 className="h-4 w-4" />;
}

function toneFor(type: string): "emerald" | "rose" | "amber" {
  if (
    [
      "CREATED",
      "UPGRADED",
      "DOWNGRADE_APPLIED",
      "RENEWED",
      "PAYMENT_SUCCEEDED",
    ].includes(type)
  ) {
    return "emerald";
  }
  if (["PAYMENT_FAILED", "CANCELLED"].includes(type)) return "rose";
  return "amber";
}

function timeOf(iso: string) {
  return new Date(iso).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function AdminBillingActivityPage() {
  const { businessId } = useParams<{ businessId: string }>();
  const businessName = useCurrentBusinessName();
  const [page, setPage] = useState(1);

  const query = useQuery({
    queryKey: ["admin-billing-activity", businessId, page],
    queryFn: () => adminApi.billingActivity(businessId!, page),
    enabled: Boolean(businessId),
  });

  const events = useMemo(() => query.data?.data ?? [], [query.data]);

  const grouped = useMemo(() => {
    const map = new Map<string, AdminBillingEvent[]>();
    for (const ev of events) {
      const key = dayGroupLabel(ev.createdAt);
      const bucket = map.get(key);
      if (bucket) bucket.push(ev);
      else map.set(key, [ev]);
    }
    return Array.from(map.entries());
  }, [events]);

  if (!businessId) {
    return <AdminErrorState message="A valid business context is required." />;
  }
  if (query.isLoading) return <AdminLoadingState variant="list" rows={6} />;
  if (query.isError) {
    return (
      <AdminErrorState
        message="We couldn't load billing activity."
        onRetry={() => query.refetch()}
      />
    );
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow={
          businessName
            ? `${businessName} / Billing Activity`
            : "Admin / Billing Activity"
        }
        title="Billing Activity"
        description="A business-wide timeline of subscription and payment lifecycle events."
      />

      {events.length === 0 ? (
        <AdminCard>
          <div className="py-14 text-center">
            <Activity className="mx-auto h-8 w-8 text-[var(--a-ink-3)]" />
            <p className="mt-3 text-sm font-semibold text-[var(--a-ink)]">
              No billing activity yet
            </p>
            <p className="mt-1 text-sm text-[var(--a-ink-2)]">
              Subscription events will appear here.
            </p>
          </div>
        </AdminCard>
      ) : (
        <div className="space-y-4">
          {grouped.map(([labelText, items]) => (
            <AdminCard key={labelText} variant="flush">
              <div className="border-b border-[var(--a-border)] px-6 py-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--a-ink-3)]">
                  {labelText}
                </p>
              </div>
              <ul className="divide-y divide-[var(--a-border)]">
                {items.map((event) => {
                  const tone = toneFor(event.type);
                  const toneClass =
                    tone === "emerald"
                      ? "bg-[var(--a-emerald-soft)] text-[var(--a-emerald)]"
                      : tone === "rose"
                        ? "bg-[var(--a-rose-soft)] text-[var(--a-rose)]"
                        : "bg-[var(--a-amber-soft)] text-[var(--a-amber)]";

                  return (
                    <li key={event.id}>
                      <Link
                        to={`/admin/${businessId}/subscriptions/${event.subscription.id}`}
                        className="flex items-center gap-3 px-6 py-4 transition hover:bg-[rgba(15,15,10,0.025)]"
                      >
                        <span
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${toneClass}`}
                        >
                          {eventIcon(event.type)}
                        </span>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-[var(--a-ink)]">
                            {label(event.type)}
                          </p>
                          <p className="mt-0.5 truncate text-xs text-[var(--a-ink-3)]">
                            {event.subscription.plan.service.name} ·{" "}
                            {event.subscription.plan.name} ·{" "}
                            {event.subscription.customerProfile.user.email}
                          </p>
                        </div>

                        <span className="shrink-0 text-xs tabular-nums text-[var(--a-ink-3)]">
                          {timeOf(event.createdAt)}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </AdminCard>
          ))}
        </div>
      )}

      {query.data?.pagination && query.data.pagination.total > 0 ? (
        <AdminCard variant="flush">
          <AdminPagination
            page={page}
            limit={query.data.pagination.limit}
            total={query.data.pagination.total}
            hasNextPage={query.data.pagination.hasNextPage}
            onPageChange={setPage}
          />
        </AdminCard>
      ) : null}
    </div>
  );
}
