import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronRight,
  FileText,
  Receipt,
  Wallet,
} from "lucide-react";

import { invoicesApi, type Invoice } from "@/api/invoices";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { StatusBadge } from "@/components/status-badge";
import { LoadingState } from "@/components/loading-state";
import { ErrorState } from "@/components/error-state";
import { formatMoney } from "@/lib/format";

export function CustomerInvoicesPage() {
  const query = useQuery({
    queryKey: ["customer-invoices"],
    queryFn: () => invoicesApi.list(),
  });

  if (query.isPending) {
    return <LoadingState message="Loading invoices…" />;
  }

  if (query.isError) {
    return (
      <ErrorState
        description="We couldn't load your invoices."
        retryAction={() => query.refetch()}
      />
    );
  }

  const invoices: Invoice[] = query.data.data;

  const sorted = [...invoices].sort(
    (a, b) =>
      new Date(b.createdAt).getTime() -
      new Date(a.createdAt).getTime(),
  );

  const paidTotal = invoices
    .filter((invoice) => invoice.status === "PAID")
    .reduce((sum, invoice) => sum + invoice.total, 0);

  const openTotal = invoices
    .filter((invoice) => invoice.status === "OPEN")
    .reduce((sum, invoice) => sum + invoice.total, 0);

  const grandTotal = invoices.reduce(
    (sum, invoice) => sum + invoice.total,
    0,
  );

  const currency = invoices[0]?.currency ?? "INR";

  return (
    <div className="space-y-8">
      <PageHeader
        title="Invoices"
        description="Every invoice generated for your subscriptions."
      />

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Total billed"
          value={formatMoney(grandTotal, currency)}
          icon={<Receipt className="h-4 w-4" />}
          description={`${invoices.length} invoices`}
        />

        <StatCard
          label="Paid"
          value={formatMoney(paidTotal, currency)}
          icon={<Wallet className="h-4 w-4" />}
          description="Settled invoices"
        />

        <StatCard
          label="Open"
          value={formatMoney(openTotal, currency)}
          icon={<FileText className="h-4 w-4" />}
          description="Awaiting payment"
        />
      </section>

      {sorted.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--color-border-soft)] bg-white/60 px-6 py-16 text-center">
          <FileText className="mx-auto h-8 w-8 text-[var(--color-ink-subtle)]" />

          <p className="mt-4 text-sm font-medium text-[var(--color-ink)]">
            No invoices yet
          </p>

          <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
            Invoices will appear here once your subscriptions generate them.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-[var(--color-border-soft)] bg-white shadow-[var(--shadow-soft)]">
          <div className="hidden grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto] items-center gap-4 border-b border-[var(--color-border-soft)] bg-[var(--color-surface)]/60 px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-ink-subtle)] md:grid">
            <span>Invoice</span>
            <span>Issued</span>
            <span>Status</span>
            <span className="text-right">Total</span>
            <span />
          </div>

          <ul className="divide-y divide-[var(--color-border-soft)]">
            {sorted.map((invoice) => (
              <li key={invoice.id}>
                <Link
                  to={`/customer/invoices/${invoice.id}`}
                  className="grid grid-cols-1 items-center gap-3 px-5 py-4 transition hover:bg-[var(--color-surface)] md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto]"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--color-surface)] ring-1 ring-[var(--color-border-soft)]">
                      <FileText className="h-4 w-4 text-[var(--color-ink-muted)]" />
                    </span>

                    <span className="text-sm font-semibold text-[var(--color-ink)]">
                      {invoice.invoiceNumber}
                    </span>
                  </div>

                  <span className="text-sm text-[var(--color-ink-muted)]">
                    {new Date(invoice.createdAt).toLocaleDateString()}
                  </span>

                  <span>
                    <StatusBadge status={invoice.status} />
                  </span>

                  <span className="text-sm font-semibold tabular-nums text-[var(--color-ink)] md:text-right">
                    {formatMoney(invoice.total, invoice.currency)}
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