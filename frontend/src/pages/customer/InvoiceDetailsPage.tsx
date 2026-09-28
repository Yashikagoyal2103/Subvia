import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Download, ExternalLink } from "lucide-react";
import { Link, useParams } from "react-router-dom";

import { invoicesApi } from "@/api/invoices";
import { useAuthStore } from "@/stores/auth.store";
import { formatMoney } from "@/lib/format";
import {
  formatDateTime,
  formatInvoiceDate,
} from "@/lib/customer-utils";

import { CustomerErrorState } from "@/components/customer/CustomerErrorState";
import { CustomerLoadingState } from "@/components/customer/CustomerLoadingState";
import { GlassPanel } from "@/components/customer/GlassPanel";
import { MoneyText } from "@/components/customer/MoneyText";
import { StatusPill } from "@/components/customer/StatusPill";

export function CustomerInvoiceDetailsPage() {
  const { invoiceId = "" } = useParams();
  const user = useAuthStore((s) => s.user);

  const query = useQuery({
    queryKey: ["customer-invoice", invoiceId],
    queryFn: () => invoicesApi.getById(invoiceId),
    enabled: Boolean(invoiceId),
  });

  if (!invoiceId) {
    return <CustomerErrorState description="Invoice context is missing." />;
  }

  if (query.isPending) {
    return <CustomerLoadingState message="Loading invoice…" />;
  }

  if (query.isError || !query.data) {
    return (
      <CustomerErrorState
        description="We couldn't load this invoice."
        retryAction={() => query.refetch()}
      />
    );
  }

  const inv = query.data;
  const creditApplied = Math.max(
    inv.subtotal + inv.taxAmount - inv.total,
    0,
  );
  const provider = inv.subscription?.plan.service.business?.name ?? null;
  const lastPayment = inv.payments?.[0];
  const canPay =
    inv.status === "OPEN" &&
    inv.total > 0 &&
    Boolean(inv.subscription);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          to="/customer/invoices"
          className="inline-flex items-center gap-2 text-sm font-medium text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to invoices
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          {canPay ? (
            <Link
              to={`/customer/payment/${invoiceId}`}
              className="inline-flex items-center rounded-full bg-[var(--color-charcoal)] px-4 py-2 text-xs font-semibold text-white transition hover:-translate-y-0.5 hover:opacity-95"
            >
              {lastPayment?.status === "FAILED"
                ? "Retry payment"
                : "Pay invoice"}
            </Link>
          ) : null}

          {inv.subscription ? (
            <Link
              to={`/customer/subscriptions/${inv.subscription.id}`}
              className="inline-flex items-center gap-2 rounded-full border border-[rgba(20,22,26,0.08)] bg-white/60 px-4 py-2 text-xs font-semibold text-[var(--color-ink)]"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Subscription
            </Link>
          ) : null}

          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-full border border-[rgba(20,22,26,0.08)] bg-white/60 px-4 py-2 text-xs font-semibold text-[var(--color-ink)]"
          >
            <Download className="h-3.5 w-3.5" />
            Download PDF
          </button>
        </div>
      </div>

      {inv.status === "OPEN" && inv.total === 0 ? (
        <GlassPanel className="border border-[var(--color-positive)]/20 bg-[var(--color-positive-soft)] p-5">
          <p className="text-sm font-semibold text-[var(--color-positive)]">
            Invoice fully covered by account credit
          </p>
          <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
            No payment is required for this invoice.
          </p>
        </GlassPanel>
      ) : null}

      <div className="invoice-print-root">
        <GlassPanel
          strong
          className="invoice-print-sheet mx-auto max-w-4xl overflow-hidden bg-white shadow-[0_24px_70px_-35px_rgba(20,22,26,0.32)]"
        >
          <div className="border-b border-[rgba(20,22,26,0.07)] bg-gradient-to-br from-[#fbf3e7] via-[#f3ecf6] to-[#f7ecec] px-8 py-7 sm:px-10">
            <div className="flex items-start justify-between gap-6">
              <div>
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--color-charcoal)] text-[11px] font-bold text-[var(--color-accent)]">
                    S
                  </span>
                  <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-ink-subtle)]">
                    Subvia Invoice
                  </span>
                </div>

                <h1 className="font-display mt-4 text-3xl font-semibold tracking-tight text-[var(--color-ink)]">
                  {inv.invoiceNumber}
                </h1>
              </div>

              <div className="text-right">
                <StatusPill status={inv.status} />
                <div className="mt-3">
                  <MoneyText
                    amount={inv.total}
                    currency={inv.currency}
                    size="hero"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-7 border-b border-[rgba(20,22,26,0.07)] px-8 py-7 sm:grid-cols-2 sm:px-10">
            <AddressBlock
              label="Billed by"
              name={provider ?? "—"}
              secondary={inv.subscription?.plan.service.name}
            />

            <AddressBlock
              label="Billed to"
              name={
                user ? `${user.firstName} ${user.lastName}` : "—"
              }
              secondary={user?.email}
            />
          </div>

          <div className="grid grid-cols-2 gap-6 border-b border-[rgba(20,22,26,0.07)] px-8 py-6 sm:grid-cols-4 sm:px-10">
            <Meta
              label="Issued"
              value={formatInvoiceDate(inv.issuedAt)}
            />
            <Meta
              label="Due"
              value={formatInvoiceDate(inv.dueAt)}
            />
            <Meta
              label="Paid"
              value={formatInvoiceDate(inv.paidAt)}
            />
            <Meta label="Currency" value={inv.currency} />
          </div>

          {inv.subscription ? (
            <div className="border-b border-[rgba(20,22,26,0.07)] px-8 py-6 sm:px-10">
              <Meta
                label="Subscription"
                value={`${inv.subscription.plan.service.name} · ${inv.subscription.plan.name}`}
              />
              <p className="mt-1 text-xs text-[var(--color-ink-muted)]">
                {formatInvoiceDate(inv.subscription.billingPeriodStart)}
                {" → "}
                {formatInvoiceDate(inv.subscription.billingPeriodEnd)}
              </p>
            </div>
          ) : null}

          <div className="px-8 py-7 sm:px-10">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--color-ink-subtle)]">
              Invoice items
            </p>

            <div className="mt-4 overflow-hidden rounded-2xl border border-[rgba(20,22,26,0.07)]">
              <div className="hidden grid-cols-[minmax(0,1fr)_80px_120px_120px] gap-4 bg-[rgba(20,22,26,0.03)] px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-ink-subtle)] sm:grid">
                <span>Description</span>
                <span className="text-right">Qty</span>
                <span className="text-right">Unit price</span>
                <span className="text-right">Amount</span>
              </div>

              <ul className="divide-y divide-[rgba(20,22,26,0.06)]">
                {inv.items.map((item) => (
                  <li
                    key={item.id}
                    className="grid grid-cols-1 gap-2 px-4 py-4 sm:grid-cols-[minmax(0,1fr)_80px_120px_120px] sm:items-center sm:gap-4"
                  >
                    <span className="text-sm text-[var(--color-ink)]">
                      {item.description}
                    </span>

                    <span className="text-xs text-[var(--color-ink-muted)] sm:text-right">
                      {item.quantity}
                    </span>

                    <span className="text-xs text-[var(--color-ink-muted)] sm:text-right">
                      {formatMoney(item.unitPrice, inv.currency)}
                    </span>

                    <span className="text-sm font-semibold tabular-nums text-[var(--color-ink)] sm:text-right">
                      {formatMoney(item.amount, inv.currency)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-7 ml-auto max-w-xs space-y-2.5 text-sm">
              <TotalRow
                label="Subtotal"
                value={formatMoney(inv.subtotal, inv.currency)}
              />

              <TotalRow
                label={`Tax (${inv.taxRate}%)`}
                value={formatMoney(inv.taxAmount, inv.currency)}
              />

              {creditApplied > 0 ? (
                <TotalRow
                  label="Account credit"
                  value={`-${formatMoney(creditApplied, inv.currency)}`}
                  positive
                />
              ) : null}

              <div className="mt-3 flex items-center justify-between border-t border-[rgba(20,22,26,0.08)] pt-4">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-ink-subtle)]">
                  Total
                </span>

                <MoneyText
                  amount={inv.total}
                  currency={inv.currency}
                  size="lg"
                />
              </div>
            </div>
          </div>

          {inv.payments?.length ? (
            <div className="border-t border-[rgba(20,22,26,0.07)] px-8 py-6 sm:px-10">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--color-ink-subtle)]">
                Payment attempts
              </p>

              <div className="mt-3 space-y-2">
                {inv.payments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between gap-4 rounded-xl bg-[rgba(20,22,26,0.03)] px-4 py-3 text-xs"
                  >
                    <span className="font-medium text-[var(--color-ink)]">
                      {payment.status === "SUCCESS"
                        ? "Payment successful"
                        : payment.status === "FAILED"
                          ? "Payment failed"
                          : "Payment pending"}
                    </span>

                    <span className="text-[var(--color-ink-muted)]">
                      {formatMoney(payment.amount, payment.currency)}
                      {" · "}
                      {formatDateTime(payment.createdAt)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div className="border-t border-[rgba(20,22,26,0.07)] px-8 py-5 text-xs text-[var(--color-ink-muted)] sm:px-10">
            {inv.status === "PAID" && inv.paidAt
              ? `Paid on ${formatInvoiceDate(inv.paidAt)}.`
              : inv.status === "OPEN"
                ? "This invoice is open. Payment can be completed through the payment page."
                : inv.status === "VOID"
                  ? "This invoice was voided."
                  : "This invoice is a draft and has not been issued."}
          </div>
        </GlassPanel>
      </div>
    </div>
  );
}

function AddressBlock({
  label,
  name,
  secondary,
}: {
  label: string;
  name: string;
  secondary?: string | null;
}) {
  return (
    <div>
      <Meta label={label} value={name} />
      {secondary ? (
        <p className="mt-1 text-xs text-[var(--color-ink-muted)]">
          {secondary}
        </p>
      ) : null}
    </div>
  );
}

function Meta({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--color-ink-subtle)]">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium text-[var(--color-ink)]">
        {value}
      </p>
    </div>
  );
}

function TotalRow({
  label,
  value,
  positive = false,
}: {
  label: string;
  value: string;
  positive?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[var(--color-ink-muted)]">{label}</span>
      <span
        className={
          positive
            ? "font-medium tabular-nums text-[var(--color-positive)]"
            : "font-medium tabular-nums text-[var(--color-ink)]"
        }
      >
        {value}
      </span>
    </div>
  );
}