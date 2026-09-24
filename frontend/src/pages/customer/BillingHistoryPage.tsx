import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Clock, Receipt, XCircle } from "lucide-react";

import { paymentsApi, type Payment } from "@/api/payments";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { LoadingState } from "@/components/loading-state";
import { ErrorState } from "@/components/error-state";
import { formatMoney } from "@/lib/format";

function toArray<T>(d: unknown): T[] {
  if (!d) return [];
  if (Array.isArray(d)) return d as T[];
  if (typeof d === "object") {
    const o = d as Record<string, unknown>;
    for (const k of ["items", "data", "results", "payments", "rows"]) {
      if (Array.isArray(o[k])) return o[k] as T[];
    }
  }
  return [];
}

export function CustomerBillingHistoryPage() {
  const { businessId = "" } = useParams();
  const hasBusiness = !!businessId;

  const q = useQuery({
    queryKey: ["payments", businessId],
    queryFn: () => paymentsApi.list(businessId),
    enabled: hasBusiness,
  });

  const payments = useMemo(() => toArray<Payment>(q.data), [q.data]);
  const sorted = useMemo(
    () =>
      [...payments].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [payments],
  );

  if (!hasBusiness)
    return <ErrorState description="A valid business context is required." />;
  if (q.isLoading) return <LoadingState message="Loading billing activity…" />;
  if (q.isError)
    return (
      <ErrorState
        description="We couldn't load your billing activity."
        retryAction={() => q.refetch()}
      />
    );

  return (
    <div className="space-y-8">
      <PageHeader
        title="Billing history"
        description="Chronological payment activity for this workspace."
      />

      {sorted.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--color-border-soft)] bg-white/60 px-6 py-16 text-center">
          <p className="text-sm font-medium text-[var(--color-ink)]">
            No billing activity yet
          </p>
          <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
            Payment attempts will show up here as they happen.
          </p>
        </div>
      ) : (
        <ol className="relative space-y-3">
          <span
            aria-hidden
            className="absolute left-[1.65rem] top-4 bottom-4 w-px bg-[var(--color-border-soft)]"
          />
          {sorted.map((p) => {
            const ok = p.status === "SUCCESS";
            const Icon = ok ? CheckCircle2 : p.status === "PENDING" ? Clock : XCircle;
            return (
              <li key={p.id} className="relative">
                <div className="flex items-start gap-3">
                  <span className="relative z-10 mt-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white ring-1 ring-[var(--color-border-soft)]">
                    <Icon
                      className={
                        ok
                          ? "h-4 w-4 text-emerald-600"
                          : p.status === "PENDING"
                            ? "h-4 w-4 text-amber-600"
                            : "h-4 w-4 text-rose-600"
                      }
                    />
                  </span>
                  <div className="flex-1 rounded-2xl border border-[var(--color-border-soft)] bg-white p-4 shadow-[var(--shadow-soft)]">
                    <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-[var(--color-ink)]">
                          {p.paymentMethod ?? "Payment"}
                        </p>
                        <StatusBadge status={p.status} />
                      </div>
                      <span className="text-sm font-semibold tabular-nums text-[var(--color-ink)]">
                        {formatMoney(p.amount, p.currency)}
                      </span>
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[var(--color-ink-muted)]">
                      <span>{new Date(p.createdAt).toLocaleString()}</span>
                      {p.transactionId ? (
                        <span className="font-mono">{p.transactionId}</span>
                      ) : null}
                      {p.invoiceId ? (
                        <Link
                          to={`/customer/${businessId}/invoices/${p.invoiceId}`}
                          className="inline-flex items-center gap-1 font-medium text-[var(--color-ink)] underline decoration-[var(--color-border-strong)] underline-offset-2 hover:decoration-[var(--color-ink)]"
                        >
                          <Receipt className="h-3 w-3" />
                          View invoice
                        </Link>
                      ) : null}
                    </div>

                    {p.failureReason ? (
                      <p className="mt-2 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-800">
                        {p.failureReason}
                      </p>
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