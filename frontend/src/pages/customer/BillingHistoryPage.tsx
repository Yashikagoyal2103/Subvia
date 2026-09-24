import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  CheckCircle2,
  Clock,
  FileText,
  Receipt,
  RefreshCw,
  XCircle,
} from "lucide-react";

import { billingActivityApi } from "@/api/billing-activity";
import { PageHeader } from "@/components/page-header";
import { LoadingState } from "@/components/loading-state";
import { ErrorState } from "@/components/error-state";
import { StatusBadge } from "@/components/status-badge";

function iconFor(type: string) {
  const value = type.toUpperCase();

  if (value.includes("UPGRADE")) return ArrowUpCircle;
  if (value.includes("DOWNGRADE")) return ArrowDownCircle;
  if (value.includes("RENEW")) return RefreshCw;
  if (value.includes("FAIL")) return XCircle;
  if (value.includes("SUCCEED")) return CheckCircle2;
  if (value.includes("INVOICE")) return Receipt;

  return Clock;
}

function labelFor(type: string) {
  return type
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function CustomerBillingHistoryPage() {
  const query = useQuery({
    queryKey: ["customer-billing-activity"],
    queryFn: () => billingActivityApi.list(),
  });

  if (query.isPending) {
    return <LoadingState message="Loading billing activity…" />;
  }

  if (query.isError) {
    return (
      <ErrorState
        description="We couldn't load your billing activity."
        retryAction={() => query.refetch()}
      />
    );
  }

  const activities = query.data.data;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Billing"
        description="A chronological view of your billing activity."
      />

      {activities.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--color-border-soft)] bg-white/60 px-6 py-16 text-center">
          <FileText className="mx-auto h-8 w-8 text-[var(--color-ink-subtle)]" />

          <p className="mt-4 text-sm font-medium text-[var(--color-ink)]">
            No billing activity yet
          </p>

          <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
            Your invoices and subscription activity will appear here.
          </p>
        </div>
      ) : (
        <ol className="relative space-y-3">
          <span
            aria-hidden
            className="absolute bottom-4 left-5 top-4 w-px bg-[var(--color-border-soft)]"
          />

          {activities.map((activity) => {
            const Icon = iconFor(activity.type);

            return (
              <li key={activity.id} className="relative">
                <div className="flex items-start gap-3">
                  <span className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--color-border-soft)] bg-white">
                    <Icon className="h-4 w-4 text-[var(--color-ink-muted)]" />
                  </span>

                  <div className="min-w-0 flex-1 rounded-2xl border border-[var(--color-border-soft)] bg-white p-4 shadow-[var(--shadow-soft)]">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-[var(--color-ink)]">
                          {labelFor(activity.type)}
                        </p>

                        {activity.subscription?.status ? (
                          <StatusBadge
                            status={activity.subscription.status}
                          />
                        ) : null}
                      </div>

                      <span className="text-xs text-[var(--color-ink-muted)]">
                        {new Date(activity.createdAt).toLocaleString()}
                      </span>
                    </div>

                    {activity.subscription ? (
                      <p className="mt-2 text-sm text-[var(--color-ink-muted)]">
                        {activity.subscription.plan.service.name} ·{" "}
                        {activity.subscription.plan.name}
                      </p>
                    ) : null}

                    {activity.type.toUpperCase().includes("INVOICE") &&
                    activity.metadata &&
                    typeof activity.metadata === "object" &&
                    "invoiceId" in activity.metadata ? (
                      <Link
                        to={`/customer/invoices/${String(
                          activity.metadata.invoiceId,
                        )}`}
                        className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--color-ink)] underline underline-offset-2"
                      >
                        <Receipt className="h-3.5 w-3.5" />
                        View invoice
                      </Link>
                    ) : null}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}