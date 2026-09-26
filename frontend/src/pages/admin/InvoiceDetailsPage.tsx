import { CalendarDays, CreditCard, FileText } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { adminApi } from "../../api/admin";
import { formatMoney } from "@/lib/format";
import { useCurrentBusinessName } from "@/hooks/useCurrentBusinessName";

import { AdminCard } from "@/components/admin/AdminCard";
import { AdminErrorState } from "@/components/admin/AdminErrorState";
import { AdminLoadingState } from "@/components/admin/AdminLoadingState";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { ListRow } from "@/components/admin/ListRow";
import { MetricCard } from "@/components/admin/MetricCard";
import { StatusBadge } from "@/components/status-badge";

function date(value: string | null | undefined) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function AdminInvoiceDetailsPage() {
  const { businessId, invoiceId } = useParams<{
    businessId: string;
    invoiceId: string;
  }>();
  const businessName = useCurrentBusinessName();

  const query = useQuery({
    queryKey: ["admin-invoice", businessId, invoiceId],
    queryFn: () => adminApi.invoice(businessId!, invoiceId!),
    enabled: Boolean(businessId && invoiceId),
  });

  if (!businessId || !invoiceId) {
    return <AdminErrorState message="Invoice context is missing." />;
  }
  if (query.isLoading) return <AdminLoadingState variant="detail" />;
  if (query.isError || !query.data) {
    return (
      <AdminErrorState
        message="We couldn't load this invoice."
        onRetry={() => query.refetch()}
      />
    );
  }

  const invoice = query.data;

  return (
    <div className="space-y-6">
      <Link
        to={`/admin/${businessId}/invoices`}
        className="text-xs font-semibold text-[var(--a-ink-2)] transition hover:text-[var(--a-ink)]"
      >
        ← Back to invoices
      </Link>

      <AdminPageHeader
        eyebrow={
          businessName
            ? `${businessName} / Invoices / ${invoice.invoiceNumber}`
            : `Invoices / ${invoice.invoiceNumber}`
        }
        title={invoice.invoiceNumber}
        description={invoice.customerProfile.user.email}
        actions={<StatusBadge status={invoice.status} />}
      />

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          icon={<FileText className="h-4 w-4" />}
          tone="indigo"
          label="Subtotal"
          value={formatMoney(invoice.subtotal, invoice.currency)}
        />
        <MetricCard
          icon={<CalendarDays className="h-4 w-4" />}
          tone="violet"
          label={`Tax (${invoice.taxRate}%)`}
          value={formatMoney(invoice.taxAmount, invoice.currency)}
        />
        <MetricCard
          icon={<CreditCard className="h-4 w-4" />}
          tone="emerald"
          label="Total"
          value={formatMoney(invoice.total, invoice.currency)}
        />
        <MetricCard
          icon={<CalendarDays className="h-4 w-4" />}
          tone="amber"
          label="Issued"
          value={date(invoice.issuedAt)}
        />
      </section>

      <AdminCard variant="flush">
        <div className="border-b border-[var(--a-border)] px-6 py-5">
          <h2 className="text-sm font-semibold text-[var(--a-ink)]">
            Line items
          </h2>
          <p className="mt-0.5 text-xs text-[var(--a-ink-3)]">
            Immutable billing lines recorded for this invoice.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-left text-sm">
            <thead className="bg-[var(--a-canvas-2)] text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--a-ink-3)]">
              <tr>
                <th className="px-6 py-3">Description</th>
                <th className="px-6 py-3 text-right">Qty</th>
                <th className="px-6 py-3 text-right">Unit price</th>
                <th className="px-6 py-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--a-border)]">
              {invoice.items.map((item) => (
                <tr key={item.id}>
                  <td className="px-6 py-4 text-[var(--a-ink)]">
                    {item.description}
                  </td>
                  <td className="px-6 py-4 text-right tabular-nums text-[var(--a-ink-2)]">
                    {item.quantity}
                  </td>
                  <td className="px-6 py-4 text-right tabular-nums text-[var(--a-ink-2)]">
                    {formatMoney(item.unitPrice, invoice.currency)}
                  </td>
                  <td className="px-6 py-4 text-right font-semibold tabular-nums text-[var(--a-ink)]">
                    {formatMoney(item.amount, invoice.currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="border-t border-[var(--a-border)] bg-[var(--a-canvas-2)] px-6 py-5">
          <div className="ml-auto max-w-xs space-y-2 text-sm">
            <TotalRow
              label="Subtotal"
              value={formatMoney(invoice.subtotal, invoice.currency)}
            />
            <TotalRow
              label={`Tax (${invoice.taxRate}%)`}
              value={formatMoney(invoice.taxAmount, invoice.currency)}
            />
            <div className="flex items-center justify-between border-t border-[var(--a-border)] pt-3 text-base font-semibold text-[var(--a-ink)]">
              <span>Total</span>
              <span className="tabular-nums">
                {formatMoney(invoice.total, invoice.currency)}
              </span>
            </div>
          </div>
        </div>
      </AdminCard>

      <AdminCard variant="flush">
        <div className="border-b border-[var(--a-border)] px-6 py-5">
          <h2 className="text-sm font-semibold text-[var(--a-ink)]">
            Payment attempts
          </h2>
          <p className="mt-0.5 text-xs text-[var(--a-ink-3)]">
            {invoice.payments.length} attempt
            {invoice.payments.length === 1 ? "" : "s"}
          </p>
        </div>

        {invoice.payments.length === 0 ? (
          <p className="px-6 py-10 text-center text-sm text-[var(--a-ink-2)]">
            No payment attempts recorded.
          </p>
        ) : (
          <ul className="divide-y divide-[var(--a-border)] px-4 py-2">
            {invoice.payments.map((payment) => (
              <li key={payment.id}>
                <ListRow
                  icon={<CreditCard className="h-4 w-4" />}
                  leadingBadgeTone={
                    payment.status === "SUCCESS" ? "emerald" : "rose"
                  }
                  title={payment.paymentMethod}
                  subtitle={date(payment.createdAt)}
                  trailing={
                    <>
                      <span className="text-sm font-semibold tabular-nums text-[var(--a-ink)]">
                        {formatMoney(payment.amount, payment.currency)}
                      </span>
                      <StatusBadge status={payment.status} />
                    </>
                  }
                />
              </li>
            ))}
          </ul>
        )}
      </AdminCard>

      {invoice.subscription ? (
        <AdminCard>
          <h2 className="text-sm font-semibold text-[var(--a-ink)]">
            Related subscription
          </h2>
          <p className="mt-1 text-sm text-[var(--a-ink-2)]">
            {invoice.subscription.plan.service.name} ·{" "}
            {invoice.subscription.plan.name}
          </p>
          <Link
            to={`/admin/${businessId}/subscriptions/${invoice.subscription.id}`}
            className="mt-4 inline-flex items-center gap-2 rounded-full border border-[var(--a-border)] bg-white px-4 py-2 text-xs font-semibold text-[var(--a-ink)] transition hover:border-[var(--a-border-strong)]"
          >
            View subscription
          </Link>
        </AdminCard>
      ) : null}
    </div>
  );
}

function TotalRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-[var(--a-ink-2)]">
      <span>{label}</span>
      <span className="font-medium tabular-nums text-[var(--a-ink)]">
        {value}
      </span>
    </div>
  );
}