import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowUpCircle,
  ArrowDownCircle,
  Ban,
  CalendarClock,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  XCircle,
} from "lucide-react";

import { subscriptionsApi, type SubscriptionEvent } from "@/api/subscriptions";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { LoadingState } from "@/components/loading-state";
import { ErrorState } from "@/components/error-state";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

type CancelMode = "PERIOD_END" | "IMMEDIATE";

function eventIcon(type: string) {
  const t = type.toUpperCase();
  if (t.includes("UPGRADE")) return ArrowUpCircle;
  if (t.includes("DOWNGRADE")) return ArrowDownCircle;
  if (t.includes("CANCEL")) return Ban;
  if (t.includes("RENEW")) return RefreshCw;
  if (t.includes("SUCCEED")) return CheckCircle2;
  if (t.includes("FAIL")) return XCircle;
  if (t.includes("CREATE")) return Sparkles;
  return CalendarClock;
}

function eventLabel(type: string) {
  return type
    .toLowerCase()
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function fmtDate(iso?: string | null, withTime = false) {
  if (!iso) return "—";
  const d = new Date(iso);
  return withTime ? d.toLocaleString() : d.toLocaleDateString();
}

export function SubscriptionDetailsPage() {
  const { businessId = "", subscriptionId = "" } = useParams();
  const qc = useQueryClient();
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelMode, setCancelMode] = useState<CancelMode>("PERIOD_END");

  const subQ = useQuery({
    queryKey: ["subscription", businessId, subscriptionId],
    queryFn: () => subscriptionsApi.getById(businessId, subscriptionId),
    enabled: !!businessId && !!subscriptionId,
  });

  const eventsQ = useQuery({
    queryKey: ["subscription-events", businessId, subscriptionId],
    queryFn: () => subscriptionsApi.events(businessId, subscriptionId),
    enabled: !!businessId && !!subscriptionId,
  });

  const cancelMutation = useMutation({
    mutationFn: (mode: CancelMode) =>
      subscriptionsApi.cancel(businessId, subscriptionId, { mode }),
    onSuccess: () => {
      toast.success(
        cancelMode === "IMMEDIATE"
          ? "Subscription cancelled immediately"
          : "Cancellation scheduled at period end",
      );
      setCancelOpen(false);
      qc.invalidateQueries({
        queryKey: ["subscription", businessId, subscriptionId],
      });
      qc.invalidateQueries({ queryKey: ["subscription-events", businessId, subscriptionId] });
      qc.invalidateQueries({ queryKey: ["subscriptions", businessId] });
    },
    onError: (err: unknown) => {
      const m = err instanceof Error ? err.message : "Cancellation failed.";
      toast.error(m);
    },
  });

  if (!businessId || !subscriptionId)
    return <ErrorState description="Missing context." />;
  if (subQ.isLoading) return <LoadingState message="Loading subscription…" />;
  if (subQ.isError || !subQ.data)
    return (
      <ErrorState
        description="Failed to load subscription."
        retryAction={() => subQ.refetch()}
      />
    );

  const sub = subQ.data;
  const events = eventsQ.data ?? [];

  const pendingChange = !!sub.pendingPlanId;
  const cancellationScheduled = !!sub.cancelAtPeriodEnd && !sub.cancelledAt;
  const canCancel = !sub.cancelledAt && sub.status !== "CANCELLED";

  return (
    <div className="space-y-8">
      <PageHeader
        title="Subscription"
        description="Manage your plan, review the lifecycle and see the audit trail."
        action={
          <Link
            to={`/customer/${businessId}/subscriptions`}
            className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border-soft)] bg-white px-3.5 py-2 text-sm font-semibold text-[var(--color-ink)] transition hover:border-[var(--color-border-strong)]"
          >
            Back to list
          </Link>
        }
      />

      {/* Dark hero */}
      <section className="overflow-hidden rounded-2xl bg-[var(--color-surface-dark)] p-6 text-white shadow-[var(--shadow-card)]">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-white/50">
              {sub.plan?.service?.name ?? "Service"}
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">
              {sub.plan?.name ?? "Plan"}
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <StatusBadge status={sub.status} />
              <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-semibold text-white/80">
                {sub.billingInterval === "MONTHLY" ? "Monthly" : "Yearly"}
              </span>
            </div>
          </div>

          <div className="text-right">
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-white/50">
              Price
            </p>
            <p className="mt-1 text-3xl font-semibold tabular-nums text-[var(--color-accent)]">
              {formatMoney(sub.price, sub.currency)}
            </p>
            <p className="mt-0.5 text-xs text-white/60">
              per {sub.billingInterval === "MONTHLY" ? "month" : "year"}
            </p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <HeroChip label="Period start" value={fmtDate(sub.billingPeriodStart)} />
          <HeroChip label="Period end" value={fmtDate(sub.billingPeriodEnd)} />
          <HeroChip label="Currency" value={sub.currency} />
        </div>
      </section>

      {/* Pending / cancellation callouts */}
      {(pendingChange || cancellationScheduled) && (
        <section className="space-y-3">
          {pendingChange ? (
            <div className="rounded-xl border-l-4 border-indigo-400 bg-indigo-50/70 px-4 py-3 text-sm text-indigo-900">
              <p className="font-semibold">Scheduled plan change</p>
              <p className="text-xs text-indigo-800/80">
                Downgrade to {sub.pendingPlan?.name ?? "a new plan"} at the next
                billing period.
              </p>
            </div>
          ) : null}
          {cancellationScheduled ? (
            <div className="rounded-xl border-l-4 border-amber-400 bg-amber-50/80 px-4 py-3 text-sm text-amber-900">
              <p className="font-semibold">Cancellation scheduled</p>
              <p className="text-xs text-amber-800/80">
                Access ends {fmtDate(sub.billingPeriodEnd)}.
              </p>
            </div>
          ) : null}
        </section>
      )}

      {/* Manage actions */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Link
          to={`/customer/${businessId}/services/${sub.plan?.serviceId ?? ""}/plans`}
          className="flex items-center justify-between rounded-2xl border border-[var(--color-border-soft)] bg-white p-5 shadow-[var(--shadow-soft)] transition hover:shadow-[var(--shadow-card)]"
        >
          <div>
            <p className="text-sm font-semibold text-[var(--color-ink)]">
              Change plan
            </p>
            <p className="mt-0.5 text-xs text-[var(--color-ink-muted)]">
              Upgrades apply immediately (prorated). Downgrades apply next cycle.
            </p>
          </div>
          <ArrowUpCircle className="h-5 w-5 text-[var(--color-ink-muted)]" />
        </Link>

        <button
          type="button"
          onClick={() => setCancelOpen(true)}
          disabled={!canCancel}
          className={cn(
            "flex items-center justify-between rounded-2xl border border-[var(--color-border-soft)] bg-white p-5 text-left shadow-[var(--shadow-soft)] transition hover:shadow-[var(--shadow-card)]",
            !canCancel && "pointer-events-none opacity-50",
          )}
        >
          <div>
            <p className="text-sm font-semibold text-[var(--color-ink)]">
              Cancel subscription
            </p>
            <p className="mt-0.5 text-xs text-[var(--color-ink-muted)]">
              Choose to cancel at period end, or immediately.
            </p>
          </div>
          <Ban className="h-5 w-5 text-[var(--color-ink-muted)]" />
        </button>
      </section>

      {/* Events timeline */}
      <section className="rounded-2xl border border-[var(--color-border-soft)] bg-white shadow-[var(--shadow-soft)]">
        <div className="border-b border-[var(--color-border-soft)] px-5 py-4">
          <h2 className="text-sm font-semibold tracking-tight text-[var(--color-ink)]">
            Event history
          </h2>
          <p className="text-xs text-[var(--color-ink-muted)]">
            Audit trail of changes to this subscription
          </p>
        </div>

        {eventsQ.isLoading ? (
          <div className="px-5 py-10 text-sm text-[var(--color-ink-muted)]">
            Loading events…
          </div>
        ) : events.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm text-[var(--color-ink-muted)]">
            No events recorded yet.
          </div>
        ) : (
          <ol className="relative space-y-1 px-5 py-5">
            <span
              aria-hidden
              className="absolute left-[2.05rem] top-8 bottom-8 w-px bg-[var(--color-border-soft)]"
            />
            {[...events]
              .sort(
                (a: SubscriptionEvent, b: SubscriptionEvent) =>
                  new Date(b.createdAt).getTime() -
                  new Date(a.createdAt).getTime(),
              )
              .map((e) => {
                const Icon = eventIcon(e.type);
                return (
                  <li
                    key={e.id}
                    className="relative flex items-start gap-3 rounded-xl px-2 py-3"
                  >
                    <span className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-surface)] ring-1 ring-[var(--color-border-soft)]">
                      <Icon className="h-4 w-4 text-[var(--color-ink-muted)]" />
                    </span>
                    <div className="min-w-0 flex-1 pt-0.5">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-[var(--color-ink)]">
                          {eventLabel(e.type)}
                        </p>
                        <span className="text-xs text-[var(--color-ink-subtle)]">
                          {fmtDate(e.createdAt, true)}
                        </span>
                      </div>
                      {e.metadata ? (
                        <p className="mt-1 text-xs text-[var(--color-ink-muted)]">
                          {typeof e.metadata === "string"
                            ? e.metadata
                            : JSON.stringify(e.metadata)}
                        </p>
                      ) : null}
                    </div>
                  </li>
                );
              })}
          </ol>
        )}
      </section>

      {/* Cancel dialog with working radio picker */}
      <ConfirmDialog
        isOpen={cancelOpen}
        title="Cancel subscription"
        description="Choose how this subscription should end."
        confirmLabel={
          cancelMutation.isPending
            ? "Cancelling…"
            : cancelMode === "IMMEDIATE"
              ? "Cancel immediately"
              : "Cancel at period end"
        }
        onConfirm={() => cancelMutation.mutate(cancelMode)}
        onCancel={() => setCancelOpen(false)}
        isLoading={cancelMutation.isPending}
        isDestructive
      >
        <div className="space-y-2">
          <label
            className={cn(
              "flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition",
              cancelMode === "PERIOD_END"
                ? "border-[var(--color-ink)] bg-[var(--color-surface)]"
                : "border-[var(--color-border-soft)] bg-white hover:border-[var(--color-border-strong)]",
            )}
          >
            <input
              type="radio"
              name="cancel-mode"
              value="PERIOD_END"
              checked={cancelMode === "PERIOD_END"}
              onChange={() => setCancelMode("PERIOD_END")}
              className="mt-1"
            />
            <span>
              <span className="block text-sm font-semibold text-[var(--color-ink)]">
                Cancel at period end
              </span>
              <span className="mt-0.5 block text-xs text-[var(--color-ink-muted)]">
                Keep access until the current period ends, then cancel.
              </span>
            </span>
          </label>

          <label
            className={cn(
              "flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition",
              cancelMode === "IMMEDIATE"
                ? "border-rose-500 bg-rose-50/60"
                : "border-[var(--color-border-soft)] bg-white hover:border-[var(--color-border-strong)]",
            )}
          >
            <input
              type="radio"
              name="cancel-mode"
              value="IMMEDIATE"
              checked={cancelMode === "IMMEDIATE"}
              onChange={() => setCancelMode("IMMEDIATE")}
              className="mt-1"
            />
            <span>
              <span className="block text-sm font-semibold text-[var(--color-ink)]">
                Cancel immediately
              </span>
              <span className="mt-0.5 block text-xs text-[var(--color-ink-muted)]">
                Access ends right away. This cannot be undone.
              </span>
            </span>
          </label>
        </div>
      </ConfirmDialog>
    </div>
  );
}

function HeroChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/5 px-3.5 py-2.5 ring-1 ring-white/10">
      <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-white/50">
        {label}
      </p>
      <p className="mt-0.5 text-sm font-medium text-white">{value}</p>
    </div>
  );
}