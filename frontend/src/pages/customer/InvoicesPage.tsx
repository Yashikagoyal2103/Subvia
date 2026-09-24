import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, FileText, Receipt, Wallet } from "lucide-react";

import { invoicesApi, type Invoice } from "@/api/invoices";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { StatusBadge } from "@/components/status-badge";
import { LoadingState } from "@/components/loading-state";
import { ErrorState } from "@/components/error-state";
import { formatMoney } from "@/lib/format";

function toArray<T>(d: unknown): T[] {
  if (!d) return [];
  if (Array.isArray(d)) return d as T[];
  if (typeof d === "object") {
    const o = d as Record<string, unknown>;
    for (const k of ["items", "data", "results", "invoices", "rows"]) {
      if (Array.isArray(o[k])) return o[k] as T[];
    }
  }
  return [];
}

export function CustomerInvoicesPage() {
  const { businessId = "" } = useParams();
  const hasBusiness = !!businessId;

  const q = useQuery({
    queryKey: ["invoices", businessId],
    queryFn: () => invoicesApi.list(businessId),
    enabled: hasBusiness,
  });

  if (!hasBusiness)
    return <ErrorState description="A valid business context is required." />;
  if (q.isLoading) return <LoadingState message="Loading invoices…" />;
  if (q.isError)
    return (
      <ErrorState
        description="We couldn't load your invoices."
        retryAction={() => q.refetch()}
      />
    );

  const invoices = toArray<Invoice>(q.data);
  const sorted = [...invoices].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  const paidTotal = invoices
    .filter((i) => i.status === "PAID")
    .reduce((s, i) => s + i.total, 0);
  const openTotal = invoices
    .filter((i) => i.status === "OPEN")
    .reduce((s, i) => s + i.total, 0);
  const grandTotal = invoices.reduce((s, i) => s + i.total, 0);
  const currency = invoices[0]?.currency ?? "INR";

  return (
    <div className="space-y-8">
      <PageHeader
        title="Invoices"
        description="Every invoice issued for this workspace."
      />

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Total billed"
          value={formatMoney(grandTotal, currency)}
          icon={Receipt}
          description={`${invoices.length} invoices`}
        />
        <StatCard
          label="Paid"
          value={formatMoney(paidTotal, currency)}
          icon={Wallet}
          description="Settled invoices"
        />
        <StatCard
          label="Open"
          value={formatMoney(openTotal, currency)}
          icon={FileText}
          description="Awaiting payment"
        />
      </section>

      {sorted.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--color-border-soft)] bg-white/60 px-6 py-16 text-center">
          <p className="text-sm font-medium text-[var(--color-ink)]">
            No invoices yet
          </p>
          <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
            Invoices appear here once a subscription generates one.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-[var(--color-border-soft)] bg-white shadow-[var(--shadow-soft)]">
          <div className="hidden grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto] items-center gap-4 border-b border-[var(--color-border-soft)] bg-[var(--color-surface)]/60 px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-ink-subtle)] md:grid">
            <span>Invoice</span>
            <span>Issued</span>
            <span>Status</span>
            <span className="text-right">Total</span>
            <span className="w-6" />
          </div>
          <ul className="divide-y divide-[var(--color-border-soft)]">
            {sorted.map((i) => (
              <li key={i.id}>
                <Link
                  to={`/customer/${businessId}/invoices/${i.id}`}
                  className="grid grid-cols-1 items-center gap-3 px-5 py-4 transition hover:bg-[var(--color-surface)] md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto]"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--color-surface)] ring-1 ring-[var(--color-border-soft)]">
                      <FileText className="h-4 w-4 text-[var(--color-ink-muted)]" />
                    </span>
                    <span className="text-sm font-semibold text-[var(--color-ink)]">
                      {i.invoiceNumber}
                    </span>
                  </div>
                  <span className="text-sm text-[var(--color-ink-muted)]">
                    {new Date(i.createdAt).toLocaleDateString()}
                  </span>
                  <span>
                    <StatusBadge status={i.status} />
                  </span>
                  <span className="text-sm font-semibold tabular-nums text-[var(--color-ink)] md:text-right">
                    {formatMoney(i.total, i.currency)}
                  </span>
                  <ChevronRight className="hidden h-4 w-4 text-[var(--color-ink-subtle)] md:block" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}