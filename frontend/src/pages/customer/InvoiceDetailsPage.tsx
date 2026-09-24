import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Receipt } from "lucide-react";

import { invoicesApi } from "@/api/invoices";
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

function fmtDate(iso?: string | null) {
  return iso ? new Date(iso).toLocaleDateString() : "—";
}

export function CustomerInvoiceDetailsPage() {
  const { businessId = "", invoiceId = "" } = useParams();

  const invoiceQuery = useQuery({
    queryKey: ["invoice", businessId, invoiceId],
    queryFn: () => invoicesApi.getById(businessId, invoiceId),
    enabled: !!businessId && !!invoiceId,
  });

  const paymentsQuery = useQuery({
    queryKey: ["payments", businessId],
    queryFn: () => paymentsApi.list(businessId),
    enabled: !!businessId,
  });

  if (!businessId || !invoiceId)
    return <ErrorState description="Context missing." />;
  if (invoiceQuery.isLoading) return <LoadingState message="Loading invoice…" />;
  if (invoiceQuery.isError || !invoiceQuery.data)
    return (
      <ErrorState
        description="Unable to load invoice."
        retryAction={() => invoiceQuery.refetch()}
      />
    );

  const inv = invoiceQuery.data;
  const allPayments = toArray<Payment>(paymentsQuery.data);
  const relatedPayments = allPayments.filter((p) => p.invoiceId === inv.id);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Invoice ${inv.invoiceNumber}`}
        description="Invoice document and payment history."
        action={
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border-soft)] bg-white px-3.5 py-2 text-sm font-semibold text-[var(--color-ink-muted)] transition hover:text-[var(--color-ink)]"
            aria-disabled
            title="Download is not available in this build"
          >
            Download PDF
          </button>
        }
      />

      {/* Dark document header */}
      <section className="overflow-hidden rounded-2xl bg-[var(--color-surface-dark)] p-6 text-white shadow-[var(--shadow-card)]">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-white/50">
              Invoice
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">
              {inv.invoiceNumber}
            </h1>
            <div className="mt-3 flex items-center gap-2">
              <StatusBadge status={inv.status} />
              <span className="text-xs text-white/60">
                Issued {fmtDate(inv.issuedAt)} · Due {fmtDate(inv.dueAt)}
              </span>
            </div>
          </div>

          <div className="text-right">
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-white/50">
              Total
            </p>
            <p className="mt-1 text-3xl font-semibold tabular-nums text-[var(--color-accent)]">
              {formatMoney(inv.total, inv.currency)}
            </p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <HeroStat label="Subtotal" value={formatMoney(inv.subtotal, inv.currency)} />
          <HeroStat
            label={`Tax (${inv.taxRate}%)`}
            value={formatMoney(inv.taxAmount, inv.currency)}
          />
          <HeroStat label="Total" value={formatMoney(inv.total, inv.currency)} />
          <HeroStat label="Paid at" value={fmtDate(inv.paidAt)} />
        </div>
      </section>

      {/* Line items */}
      <section className="overflow-hidden rounded-2xl border border-[var(--color-border-soft)] bg-white shadow-[var(--shadow-soft)]">
        <div className="border-b border-[var(--color-border-soft)] px-5 py-4">
          <h2 className="text-sm font-semibold tracking-tight text-[var(--color-ink)]">
            Line items
          </h2>
        </div>
        <div className="hidden grid-cols-[minmax(0,3fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] gap-4 border-b border-[var(--color-border-soft)] bg-[var(--color-surface)]/60 px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-ink-subtle)] sm:grid">
          <span>Description</span>
          <span className="text-right">Qty</span>
          <span className="text-right">Unit price</span>
          <span className="text-right">Amount</span>
        </div>
        <ul className="divide-y divide-[var(--color-border-soft)]">
          {inv.items?.length ? (
            inv.items.map((it, idx) => (
              <li
                key={idx}
                className="grid grid-cols-1 gap-2 px-5 py-4 sm:grid-cols-[minmax(0,3fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] sm:items-center sm:gap-4"
              >
                <span className="text-sm text-[var(--color-ink)]">
                  {it.description}
                </span>
                <span className="text-sm tabular-nums text-[var(--color-ink-muted)] sm:text-right">
                  {it.quantity}
                </span>
                <span className="text-sm tabular-nums text-[var(--color-ink-muted)] sm:text-right">
                  {formatMoney(it.unitPrice, inv.currency)}
                </span>
                <span className="text-sm font-semibold tabular-nums text-[var(--color-ink)] sm:text-right">
                  {formatMoney(it.amount, inv.currency)}
                </span>
              </li>
            ))
          ) : (
            <li className="px-5 py-10 text-center text-sm text-[var(--color-ink-muted)]">
              No line items.
            </li>
          )}
        </ul>
        <div className="grid grid-cols-1 gap-2 border-t border-[var(--color-border-soft)] bg-[var(--color-surface)]/40 px-5 py-4 sm:grid-cols-3">
          <SummaryRow label="Subtotal" value={formatMoney(inv.subtotal, inv.currency)} />
          <SummaryRow
            label={`Tax (${inv.taxRate}%)`}
            value={formatMoney(inv.taxAmount, inv.currency)}
          />
          <SummaryRow
            label="Total"
            value={formatMoney(inv.total, inv.currency)}
            emphasis
          />
        </div>
      </section>

      {/* Payment activity */}
      <section className="overflow-hidden rounded-2xl border border-[var(--color-border-soft)] bg-white shadow-[var(--shadow-soft)]">
        <div className="border-b border-[var(--color-border-soft)] px-5 py-4">
          <h2 className="text-sm font-semibold tracking-tight text-[var(--color-ink)]">
            Payment activity
          </h2>
        </div>
        {paymentsQuery.isLoading ? (
          <div className="px-5 py-8 text-sm text-[var(--color-ink-muted)]">
            Loading payments…
          </div>
        ) : relatedPayments.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-[var(--color-ink-muted)]">
            No payments recorded against this invoice.
          </div>
        ) : (
          <ul className="divide-y divide-[var(--color-border-soft)]">
            {relatedPayments.map((p) => (
              <li key={p.id} className="flex items-center gap-3 px-5 py-4">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--color-surface)] ring-1 ring-[var(--color-border-soft)]">
                  <Receipt className="h-4 w-4 text-[var(--color-ink-muted)]" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-[var(--color-ink)]">
                    {p.paymentMethod ?? "Payment"}
                  </p>
                  <p className="truncate text-xs text-[var(--color-ink-muted)]">
                    {new Date(p.createdAt).toLocaleString()}
                    {p.transactionId ? ` · ${p.transactionId}` : ""}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="text-sm font-semibold tabular-nums text-[var(--color-ink)]">
                    {formatMoney(p.amount, p.currency)}
                  </span>
                  <StatusBadge status={p.status} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function HeroStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/5 px-3.5 py-2.5 ring-1 ring-white/10">
      <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-white/50">
        {label}
      </p>
      <p className="mt-0.5 text-sm font-medium text-white tabular-nums">{value}</p>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  emphasis = false,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
}) {
  return (
    <div
      className={
        emphasis
          ? "flex items-center justify-between rounded-lg bg-white px-3 py-2 ring-1 ring-[var(--color-border-soft)] sm:justify-start sm:gap-3"
          : "flex items-center justify-between px-3 py-2 sm:justify-start sm:gap-3"
      }
    >
      <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-ink-subtle)]">
        {label}
      </span>
      <span
        className={
          emphasis
            ? "text-sm font-semibold tabular-nums text-[var(--color-ink)]"
            : "text-sm tabular-nums text-[var(--color-ink)]"
        }
      >
        {value}
      </span>
    </div>
  );
}