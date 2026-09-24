import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Receipt } from "lucide-react";
import { Link } from "react-router-dom";

import { invoicesApi } from "@/api/invoices";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { LoadingState } from "@/components/loading-state";
import { ErrorState } from "@/components/error-state";
import { formatMoney } from "@/lib/format";

function formatDate(value: string | null | undefined) {
  if (!value) return "—";

  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function CustomerInvoiceDetailsPage() {
  const { invoiceId = "" } = useParams();

  const query = useQuery({
    queryKey: ["customer-invoice", invoiceId],
    queryFn: () => invoicesApi.getById(invoiceId),
    enabled: Boolean(invoiceId),
  });

  if (!invoiceId) {
    return <ErrorState description="Invoice context is missing." />;
  }

  if (query.isPending) {
    return <LoadingState message="Loading invoice…" />;
  }

  if (query.isError || !query.data) {
    return (
      <ErrorState
        description="We couldn't load this invoice."
        retryAction={() => query.refetch()}
      />
    );
  }

  const invoice = query.data;

  return (
    <div className="space-y-6">
      <Link
        to="/customer/invoices"
        className="inline-flex items-center gap-2 text-sm font-medium text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to invoices
      </Link>

      <PageHeader
        title={`Invoice ${invoice.invoiceNumber}`}
        description="Invoice details and billing information."
      />

      <section className="overflow-hidden rounded-2xl border border-[var(--color-border-soft)] bg-white shadow-[var(--shadow-card)]">
        <div className="bg-[var(--color-surface-dark)] p-6 text-white">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-white/50">
                Invoice
              </p>

              <h1 className="mt-1 text-2xl font-semibold tracking-tight">
                {invoice.invoiceNumber}
              </h1>

              <p className="mt-2 text-sm text-white/60">
                Issued {formatDate(invoice.issuedAt)}
              </p>
            </div>

            <StatusBadge status={invoice.status} />
          </div>
        </div>

        <div className="grid gap-6 border-b border-[var(--color-border-soft)] p-6 sm:grid-cols-3">
          <InfoItem
            label="Subtotal"
            value={formatMoney(invoice.subtotal, invoice.currency)}
          />

          <InfoItem
            label="Tax"
            value={formatMoney(invoice.taxAmount, invoice.currency)}
          />

          <InfoItem
            label="Total"
            value={formatMoney(invoice.total, invoice.currency)}
            strong
          />
        </div>

        <div className="border-b border-[var(--color-border-soft)] p-6">
          <h2 className="text-sm font-semibold text-[var(--color-ink)]">
            Invoice items
          </h2>

          <div className="mt-4 overflow-hidden rounded-xl border border-[var(--color-border-soft)]">
            <div className="grid grid-cols-[1fr_auto] gap-4 border-b border-[var(--color-border-soft)] bg-[var(--color-surface)] px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-subtle)]">
              <span>Description</span>
              <span>Amount</span>
            </div>

            <div className="divide-y divide-[var(--color-border-soft)]">
              {invoice.items.map((item) => (
                <div
                  key={item.id}
                  className="grid grid-cols-[1fr_auto] gap-4 px-4 py-4"
                >
                  <div>
                    <p className="text-sm font-medium text-[var(--color-ink)]">
                      {item.description}
                    </p>

                    <p className="mt-1 text-xs text-[var(--color-ink-muted)]">
                      {item.quantity} ×{" "}
                      {formatMoney(item.unitPrice, invoice.currency)}
                    </p>
                  </div>

                  <p className="text-sm font-semibold tabular-nums text-[var(--color-ink)]">
                    {formatMoney(item.amount, invoice.currency)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-6 p-6 sm:grid-cols-3">
          <InfoItem
            label="Issued"
            value={formatDate(invoice.issuedAt)}
          />

          <InfoItem
            label="Due"
            value={formatDate(invoice.dueAt)}
          />

          <InfoItem
            label="Paid"
            value={formatDate(invoice.paidAt)}
          />
        </div>
      </section>

      {invoice.subscription ? (
        <section className="rounded-2xl border border-[var(--color-border-soft)] bg-white p-6 shadow-[var(--shadow-soft)]">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--color-surface)]">
              <Receipt className="h-4 w-4 text-[var(--color-ink-muted)]" />
            </span>

            <div>
              <h2 className="text-sm font-semibold text-[var(--color-ink)]">
                Related subscription
              </h2>

              <p className="text-xs text-[var(--color-ink-muted)]">
                {invoice.subscription.plan.service.name} ·{" "}
                {invoice.subscription.plan.name}
              </p>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}

function InfoItem({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-subtle)]">
        {label}
      </p>

      <p
        className={
          strong
            ? "mt-1 text-lg font-semibold tabular-nums text-[var(--color-ink)]"
            : "mt-1 text-sm font-medium tabular-nums text-[var(--color-ink)]"
        }
      >
        {value}
      </p>
    </div>
  );
}