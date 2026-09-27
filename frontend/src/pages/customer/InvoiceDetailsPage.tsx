
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

import { invoicesApi } from "@/api/invoices";
import { paymentsApi } from "@/api/payments";
import { useAuthStore } from "@/stores/auth.store";
import { formatMoney } from "@/lib/format";
import { formatDate } from "@/lib/customer-utils";

import { CustomerErrorState } from "@/components/customer/CustomerErrorState";
import { CustomerLoadingState } from "@/components/customer/CustomerLoadingState";
import { GlassPanel } from "@/components/customer/GlassPanel";
import { MoneyText } from "@/components/customer/MoneyText";
import { StatusPill } from "@/components/customer/StatusPill";

export function CustomerInvoiceDetailsPage() {
  const { invoiceId = "" } = useParams();
  const user = useAuthStore((s) => s.user);
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["customer-invoice", invoiceId],
    queryFn: () => invoicesApi.getById(invoiceId),
    enabled: Boolean(invoiceId),
  });

  const paymentMutation = useMutation({
    mutationFn: (result: "SUCCESS" | "FAILED") => {
      return paymentsApi.createForCustomer(
        invoiceId,
        {
          paymentMethod: "DEMO",
          result,
        },
      );
    },
    onSuccess: (result) => {
      if (result.success) {
        toast.success("Payment successful. Subscription updated.");
      } else {
        toast.error("Payment failed. You can try again.");
      }
      qc.invalidateQueries({ queryKey: ["customer-invoice", invoiceId] });
      qc.invalidateQueries({ queryKey: ["customer-invoices"] });
      qc.invalidateQueries({ queryKey: ["customer-subscriptions"] });
      qc.invalidateQueries({ queryKey: ["customer-subscription"] });
      qc.invalidateQueries({ queryKey: ["customer-billing-activity"] });
      qc.invalidateQueries({ queryKey: ["customer-billing-activity-infinite"] });
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Payment failed."),
  });

  if (!invoiceId) {
    return <CustomerErrorState description="Invoice context is missing." />;
  }
  if (query.isPending) return <CustomerLoadingState message="Loading invoice…" />;
  if (query.isError || !query.data) {
    return (
      <CustomerErrorState
        description="We couldn't load this invoice."
        retryAction={() => query.refetch()}
      />
    );
  }

  const inv = query.data;
  const creditApplied = inv.subtotal + inv.taxAmount - inv.total;
  const showCreditApplied = creditApplied > 0;
  const provider = inv.subscription?.plan.service.business?.name ?? null;

  return (
    <div className="space-y-6">
      <Link
        to="/customer/invoices"
        className="inline-flex items-center gap-2 text-sm font-medium text-[var(--color-ink-muted)] transition hover:text-[var(--color-ink)]"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to invoices
      </Link>

      {inv.subscription ? (
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to={`/customer/subscriptions/${inv.subscription.id}`}
            className="glass inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold text-[var(--color-ink)] transition hover:-translate-y-0.5"
          >
            View subscription
          </Link>
        </div>
      ) : null}

      {inv.status === "OPEN" && inv.subscription ? (
        <GlassPanel className="flex flex-col gap-4 border border-[var(--color-warning)]/20 bg-[var(--color-warning-soft)] p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-[var(--color-ink)]">Payment required</p>
            <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
              This invoice is still open. Use the demo payment simulator to complete it.
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              disabled={paymentMutation.isPending}
              onClick={() => paymentMutation.mutate("FAILED")}
              className="rounded-xl border border-[rgba(20,22,26,0.1)] bg-white/70 px-4 py-2.5 text-xs font-semibold text-[var(--color-ink-muted)] disabled:opacity-50"
            >
              Simulate failure
            </button>
            <button
              type="button"
              disabled={paymentMutation.isPending}
              onClick={() => paymentMutation.mutate("SUCCESS")}
              className="rounded-xl bg-[var(--color-charcoal)] px-4 py-2.5 text-xs font-semibold text-white disabled:opacity-50"
            >
              {paymentMutation.isPending ? "Processing…" : "Pay invoice"}
            </button>
          </div>
        </GlassPanel>
      ) : null}

      {/* Document sheet */}
      <GlassPanel strong className="overflow-hidden">
        {/* Header band */}
        <div className="relative border-b border-[rgba(20,22,26,0.06)] bg-gradient-to-br from-[#fbf3e7] via-[#f3ecf6] to-[#f7ecec] px-6 py-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--color-charcoal)] text-[11px] font-bold text-[var(--color-accent)]">
                  B
                </span>
                <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-ink-subtle)]">
                  Invoice
                </span>
              </div>
              <h1 className="font-display mt-4 text-3xl font-semibold tracking-tight text-[var(--color-ink)]">
                {inv.invoiceNumber}
              </h1>
            </div>
            <div className="flex flex-col items-start gap-3 sm:items-end">
              <StatusPill status={inv.status} />
              <MoneyText amount={inv.total} currency={inv.currency} size="hero" />
            </div>
          </div>
        </div>

        {/* Billed by / to */}
        <div className="grid gap-6 border-b border-[rgba(20,22,26,0.06)] px-6 py-6 sm:grid-cols-2">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--color-ink-subtle)]">
              Billed by
            </p>
            <p className="mt-1 text-sm font-medium text-[var(--color-ink)]">
              {provider ?? "—"}
            </p>
            {inv.subscription ? (
              <p className="mt-0.5 text-xs text-[var(--color-ink-muted)]">
                {inv.subscription.plan.service.name}
              </p>
            ) : null}
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--color-ink-subtle)]">
              Billed to
            </p>
            {user ? (
              <>
                <p className="mt-1 text-sm font-medium text-[var(--color-ink)]">
                  {user.firstName} {user.lastName}
                </p>
                <p className="mt-0.5 text-xs text-[var(--color-ink-muted)]">
                  {user.email}
                </p>
              </>
            ) : (
              <p className="mt-1 text-sm text-[var(--color-ink-muted)]">—</p>
            )}
          </div>
        </div>

        {/* Meta grid */}
        <div className="grid grid-cols-2 gap-6 border-b border-[rgba(20,22,26,0.06)] px-6 py-5 sm:grid-cols-4">
          <Meta label="Issued" value={formatDate(inv.issuedAt)} />
          <Meta label="Due" value={formatDate(inv.dueAt)} />
          <Meta label="Paid" value={inv.paidAt ? formatDate(inv.paidAt) : "—"} />
          <Meta label="Currency" value={inv.currency} />
        </div>

        {/* Subscription context */}
        {inv.subscription ? (
          <div className="border-b border-[rgba(20,22,26,0.06)] px-6 py-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--color-ink-subtle)]">
              Subscription
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-x-6 gap-y-1 text-sm text-[var(--color-ink)]">
              <span className="font-medium">
                {inv.subscription.plan.service.name} · {inv.subscription.plan.name}
              </span>
              <span className="text-[var(--color-ink-muted)]">
                {formatDate(inv.subscription.billingPeriodStart)} →{" "}
                {formatDate(inv.subscription.billingPeriodEnd)}
              </span>
            </div>
          </div>
        ) : null}

        {/* Line items */}
        <div className="px-6 py-6">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--color-ink-subtle)]">
            Line items
          </p>

          <div className="mt-3 hidden grid-cols-[minmax(0,3fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] gap-4 border-b border-[rgba(20,22,26,0.06)] pb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-ink-subtle)] sm:grid">
            <span>Description</span>
            <span className="text-right">Qty</span>
            <span className="text-right">Unit price</span>
            <span className="text-right">Amount</span>
          </div>

          <ul className="divide-y divide-[rgba(20,22,26,0.06)]">
            {inv.items.map((it) => {
              const negative = it.amount < 0;
              return (
                <li
                  key={it.id}
                  className="grid grid-cols-1 gap-2 py-3 sm:grid-cols-[minmax(0,3fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] sm:items-center sm:gap-4"
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
                  <span
                    className={
                      negative
                        ? "text-sm font-semibold tabular-nums text-[var(--color-positive)] sm:text-right"
                        : "text-sm font-semibold tabular-nums text-[var(--color-ink)] sm:text-right"
                    }
                  >
                    {formatMoney(it.amount, inv.currency)}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Totals */}
        <div className="border-t border-[rgba(20,22,26,0.06)] bg-white/40 px-6 py-6">
          <div className="ml-auto max-w-[320px] space-y-2 text-sm">
            <TotalRow label="Subtotal" value={formatMoney(inv.subtotal, inv.currency)} />
            <TotalRow
              label={`Tax (${inv.taxRate}%)`}
              value={formatMoney(inv.taxAmount, inv.currency)}
            />
            {showCreditApplied ? (
              <TotalRow
                label="Credit applied"
                value={`-${formatMoney(creditApplied, inv.currency)}`}
                positive
              />
            ) : null}
            <div className="mt-3 flex items-center justify-between border-t border-[rgba(20,22,26,0.08)] pt-3">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-ink-subtle)]">
                Total
              </span>
              <MoneyText amount={inv.total} currency={inv.currency} size="lg" />
            </div>
          </div>
        </div>

        {/* Footer status */}
        <div className="border-t border-[rgba(20,22,26,0.06)] px-6 py-4 text-xs text-[var(--color-ink-muted)]">
          {inv.status === "PAID" && inv.paidAt ? (
            <>Paid on {formatDate(inv.paidAt)}.</>
          ) : inv.status === "OPEN" ? (
            <>
              Payment due {formatDate(inv.dueAt)}. This is a demo billing
              environment — no real payments are processed.
            </>
          ) : inv.status === "VOID" ? (
            <>This invoice was voided.</>
          ) : inv.status === "DRAFT" ? (
            <>This invoice is a draft and has not been issued.</>
          ) : null}
        </div>
      </GlassPanel>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--color-ink-subtle)]">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium text-[var(--color-ink)]">{value}</p>
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

