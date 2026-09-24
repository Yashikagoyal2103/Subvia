import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowDownCircle,
  ArrowLeft,
  ArrowUpCircle,
  Ban,
  CalendarClock,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  XCircle,
} from "lucide-react";

import {
  subscriptionsApi,
  type SubscriptionEvent,
} from "@/api/subscriptions";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { LoadingState } from "@/components/loading-state";
import { ErrorState } from "@/components/error-state";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { formatMoney } from "@/lib/format";

type CancelMode = "PERIOD_END" | "IMMEDIATE";

function eventIcon(type: string) {
  const normalized = type.toUpperCase();

  if (normalized.includes("UPGRADE")) return ArrowUpCircle;
  if (normalized.includes("DOWNGRADE")) return ArrowDownCircle;
  if (normalized.includes("CANCEL")) return Ban;
  if (normalized.includes("RENEW")) return RefreshCw;
  if (normalized.includes("SUCCEED")) return CheckCircle2;
  if (normalized.includes("FAIL")) return XCircle;
  if (normalized.includes("CREATE")) return Sparkles;

  return CalendarClock;
}

function eventLabel(type: string) {
  return type
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatDate(value?: string | null, withTime = false) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return withTime
    ? date.toLocaleString()
    : date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
}

function eventMetadata(event: SubscriptionEvent) {
  if (!event.metadata || typeof event.metadata !== "object") {
    return null;
  }

  return event.metadata as Record<string, unknown>;
}

export function SubscriptionDetailsPage() {
  const { subscriptionId = "" } = useParams();
  const queryClient = useQueryClient();

  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelMode, setCancelMode] =
    useState<CancelMode>("PERIOD_END");

  const subscriptionQuery = useQuery({
    queryKey: ["customer-subscription", subscriptionId],
    queryFn: () => subscriptionsApi.getById(subscriptionId),
    enabled: Boolean(subscriptionId),
  });

  const eventsQuery = useQuery({
    queryKey: ["customer-subscription-events", subscriptionId],
    queryFn: () => subscriptionsApi.events(subscriptionId),
    enabled: Boolean(subscriptionId),
  });

  const cancelMutation = useMutation({
    mutationFn: (mode: CancelMode) =>
      subscriptionsApi.cancel(subscriptionId, { mode }),

    onSuccess: () => {
      toast.success(
        cancelMode === "IMMEDIATE"
          ? "Subscription cancelled."
          : "Subscription cancellation scheduled.",
      );

      setCancelOpen(false);

      queryClient.invalidateQueries({
        queryKey: ["customer-subscription", subscriptionId],
      });

      queryClient.invalidateQueries({
        queryKey: ["customer-subscription-events", subscriptionId],
      });

      queryClient.invalidateQueries({
        queryKey: ["customer-subscriptions"],
      });

      queryClient.invalidateQueries({
        queryKey: ["subscriptions"],
      });
    },

    onError: () => {
      toast.error("We couldn't cancel this subscription.");
    },
  });

  if (!subscriptionId) {
    return (
      <ErrorState description="Subscription context is missing." />
    );
  }

  if (subscriptionQuery.isPending) {
    return <LoadingState message="Loading subscription…" />;
  }

  if (subscriptionQuery.isError || !subscriptionQuery.data) {
    return (
      <ErrorState
        description="We couldn't load this subscription."
        retryAction={() => subscriptionQuery.refetch()}
      />
    );
  }

  const subscription = subscriptionQuery.data;
  const events = eventsQuery.data ?? [];

  const canCancel =
    subscription.status === "ACTIVE" ||
    subscription.status === "PAST_DUE";

  const hasPendingPlan = Boolean(subscription.pendingPlan);

  return (
    <div className="space-y-8">
      <Link
        to="/customer/subscriptions"
        className="inline-flex items-center gap-2 text-sm font-medium text-[var(--color-ink-muted)] transition hover:text-[var(--color-ink)]"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to subscriptions
      </Link>

      <PageHeader
        title={subscription.plan?.name ?? "Subscription"}
        description="View your subscription, billing period, changes, and history."
      />

      <section className="rounded-3xl border border-[var(--color-border-soft)] bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-ink-subtle)]">
              Current subscription
            </p>

            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--color-ink)]">
              {subscription.plan?.name ?? "Plan"}
            </h2>

            {subscription.plan?.description && (
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--color-ink-muted)]">
                {subscription.plan.description}
              </p>
            )}
          </div>

          <StatusBadge status={subscription.status} />
        </div>

        <div className="mt-8 grid gap-5 border-t border-[var(--color-border-soft)] pt-6 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-xs font-medium text-[var(--color-ink-subtle)]">
              Price
            </p>

            <p className="mt-1 text-lg font-semibold text-[var(--color-ink)]">
              {formatMoney(
                subscription.price,
                subscription.currency,
              )}
              <span className="ml-1 text-sm font-normal text-[var(--color-ink-muted)]">
                /{subscription.billingInterval === "MONTHLY" ? "mo" : "yr"}
              </span>
            </p>
          </div>

          <div>
            <p className="text-xs font-medium text-[var(--color-ink-subtle)]">
              Billing period
            </p>

            <p className="mt-1 text-sm font-medium text-[var(--color-ink)]">
              {formatDate(subscription.billingPeriodStart)}
              {" — "}
              {formatDate(subscription.billingPeriodEnd)}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium text-[var(--color-ink-subtle)]">
              Created
            </p>

            <p className="mt-1 text-sm font-medium text-[var(--color-ink)]">
              {formatDate(subscription.createdAt)}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium text-[var(--color-ink-subtle)]">
              Cancellation
            </p>

            <p className="mt-1 text-sm font-medium text-[var(--color-ink)]">
              {subscription.cancelAtPeriodEnd
                ? `Ends ${formatDate(subscription.billingPeriodEnd)}`
                : subscription.cancelledAt
                  ? `Cancelled ${formatDate(subscription.cancelledAt)}`
                  : "Not scheduled"}
            </p>
          </div>
        </div>

        {hasPendingPlan && subscription.pendingPlan && (
          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-semibold text-amber-950">
              Plan change scheduled
            </p>

            <p className="mt-1 text-sm leading-6 text-amber-900">
              Your subscription is scheduled to move to{" "}
              <span className="font-semibold">
                {subscription.pendingPlan.name}
              </span>{" "}
              at the next billing period.
            </p>
          </div>
        )}

        {subscription.cancelAtPeriodEnd && (
          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-semibold text-amber-950">
              Cancellation scheduled
            </p>

            <p className="mt-1 text-sm leading-6 text-amber-900">
              Your subscription remains active until{" "}
              <span className="font-semibold">
                {formatDate(subscription.billingPeriodEnd)}
              </span>
              .
            </p>
          </div>
        )}

        {canCancel && !subscription.cancelAtPeriodEnd && (
          <div className="mt-8 flex flex-col gap-3 border-t border-[var(--color-border-soft)] pt-6 sm:flex-row">
            <button
              type="button"
              onClick={() => {
                setCancelMode("PERIOD_END");
                setCancelOpen(true);
              }}
              className="rounded-xl border border-[var(--color-border-soft)] px-4 py-2.5 text-sm font-medium text-[var(--color-ink)] transition hover:bg-[var(--color-surface-muted)]"
            >
              Cancel at period end
            </button>

            <button
              type="button"
              onClick={() => {
                setCancelMode("IMMEDIATE");
                setCancelOpen(true);
              }}
              className="rounded-xl border border-red-200 px-4 py-2.5 text-sm font-medium text-red-700 transition hover:bg-red-50"
            >
              Cancel immediately
            </button>
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-[var(--color-border-soft)] bg-white p-6 shadow-sm">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-ink-subtle)]">
            History
          </p>

          <h2 className="mt-1 text-xl font-semibold text-[var(--color-ink)]">
            Subscription activity
          </h2>

          <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
            A timeline of changes and billing events for this subscription.
          </p>
        </div>

        {eventsQuery.isPending ? (
          <div className="py-10">
            <LoadingState message="Loading activity…" />
          </div>
        ) : eventsQuery.isError ? (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5">
            <p className="text-sm font-medium text-red-900">
              We couldn't load subscription activity.
            </p>

            <button
              type="button"
              onClick={() => eventsQuery.refetch()}
              className="mt-2 text-sm font-medium text-red-700 underline underline-offset-4"
            >
              Try again
            </button>
          </div>
        ) : events.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-[var(--color-border-soft)] px-6 py-12 text-center">
            <p className="text-sm font-medium text-[var(--color-ink)]">
              No activity yet
            </p>

            <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
              Subscription events will appear here as changes occur.
            </p>
          </div>
        ) : (
          <div className="mt-6 divide-y divide-[var(--color-border-soft)]">
            {events.map((event) => {
              const Icon = eventIcon(event.type);
              const metadata = eventMetadata(event);

              return (
                <div
                  key={event.id}
                  className="flex gap-4 py-5 first:pt-0 last:pb-0"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--color-surface-muted)]">
                    <Icon className="h-4 w-4 text-[var(--color-ink-muted)]" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-sm font-semibold text-[var(--color-ink)]">
                        {eventLabel(event.type)}
                      </p>

                      <p className="text-xs text-[var(--color-ink-subtle)]">
                        {formatDate(event.createdAt, true)}
                      </p>
                    </div>

                    {metadata && Object.keys(metadata).length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {Object.entries(metadata).map(
                          ([key, value]) => (
                            <span
                              key={key}
                              className="rounded-lg bg-[var(--color-surface-muted)] px-2.5 py-1 text-xs text-[var(--color-ink-muted)]"
                            >
                              {key}:{" "}
                              {typeof value === "object"
                                ? JSON.stringify(value)
                                : String(value)}
                            </span>
                          ),
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <ConfirmDialog
        isOpen={cancelOpen}
        title={
          cancelMode === "IMMEDIATE"
            ? "Cancel subscription immediately?"
            : "Cancel subscription at period end?"
        }
        description={
          cancelMode === "IMMEDIATE"
            ? "Your subscription will be cancelled immediately. This action cannot be undone."
            : "Your subscription will remain active until the current billing period ends."
        }
        confirmLabel={
          cancelMode === "IMMEDIATE"
            ? "Cancel immediately"
            : "Schedule cancellation"
        }
        cancelLabel="Keep subscription"
        onConfirm={() => cancelMutation.mutate(cancelMode)}
        onCancel={() => setCancelOpen(false)}
        isLoading={cancelMutation.isPending}
        isDestructive
      />
    </div>
  );
}