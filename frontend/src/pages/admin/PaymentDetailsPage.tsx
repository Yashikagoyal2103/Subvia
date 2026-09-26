import { CheckCircle2, FileText, XCircle } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { adminApi, type AdminPayment } from "../../api/admin";
import { formatMoney } from "@/lib/format";
import { useCurrentBusinessName } from "@/hooks/useCurrentBusinessName";

import { AdminCard } from "@/components/admin/AdminCard";
import { AdminErrorState } from "@/components/admin/AdminErrorState";
import { AdminLoadingState } from "@/components/admin/AdminLoadingState";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { InsightBanner } from "@/components/admin/InsightBanner";
import { ListRow } from "@/components/admin/ListRow";
import { StatusBadge } from "@/components/status-badge";

function date(value: string) {
  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function AdminPaymentDetailsPage() {
  const { businessId, paymentId } = useParams<{
    businessId: string;
    paymentId: string;
  }>();
  const businessName = useCurrentBusinessName();

  const query = useQuery({
    queryKey: ["admin-payment", businessId, paymentId],
    queryFn: () => adminApi.payment(businessId!, paymentId!),
    enabled: Boolean(businessId && paymentId),
  });

  if (!businessId || !paymentId) {
    return <AdminErrorState message="Payment context is missing." />;
  }
  if (query.isLoading) return <AdminLoadingState variant="detail" />;
  if (query.isError || !query.data) {
    return (
      <AdminErrorState
        message="We couldn't load this payment."
        onRetry={() => query.refetch()}
      />
    );
  }

  const payment: AdminPayment = query.data;
  const success = payment.status === "SUCCESS";
  // Backend returns `failureReason` on failed payments; not in the
  // current frontend type, so we read it defensively.
  const failureReason =
    (payment as unknown as { failureReason?: string | null }).failureReason ??
    null;

  return (
    <div className="space-y-6">
      <Link
        to={`/admin/${businessId}/payments`}
        className="text-xs font-semibold text-[var(--a-ink-2)] transition hover:text-[var(--a-ink)]"
      >
        ← Back to payments
      </Link>

      <AdminPageHeader
        eyebrow={
          businessName
            ? `${businessName} / Payments / ${payment.invoice.invoiceNumber}`
            : `Payments / ${payment.invoice.invoiceNumber}`
        }
        title={formatMoney(payment.amount, payment.currency)}
        description={date(payment.createdAt)}
        actions={<StatusBadge status={payment.status} />}
      />

      {!success && failureReason ? (
        <InsightBanner tone="warning">
          <span className="font-semibold">Payment failed.</span> {failureReason}
        </InsightBanner>
      ) : null}

      <AdminCard>
        <div className="flex items-center gap-4 border-b border-[var(--a-border)] pb-5">
          <span
            className={
              success
                ? "flex h-11 w-11 items-center justify-center rounded-full bg-[var(--a-emerald-soft)] text-[var(--a-emerald)]"
                : "flex h-11 w-11 items-center justify-center rounded-full bg-[var(--a-rose-soft)] text-[var(--a-rose)]"
            }
          >
            {success ? (
              <CheckCircle2 className="h-5 w-5" />
            ) : (
              <XCircle className="h-5 w-5" />
            )}
          </span>
          <div>
            <p className="text-sm font-semibold text-[var(--a-ink)]">
              {success ? "Payment succeeded" : "Payment failed"}
            </p>
            <p className="mt-0.5 text-xs text-[var(--a-ink-2)]">
              {payment.paymentMethod} · {date(payment.createdAt)}
            </p>
          </div>
        </div>

        <dl className="grid gap-5 pt-5 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Payment ID" value={payment.id} mono />
          <Field label="Invoice" value={payment.invoice.invoiceNumber} />
          <Field label="Method" value={payment.paymentMethod} />
          <Field label="Currency" value={payment.currency} />
          <Field
            label="Customer"
            value={payment.invoice.customerProfile.user.email}
          />
          <Field label="Created" value={date(payment.createdAt)} />
        </dl>
      </AdminCard>

      <AdminCard variant="flush">
        <div className="border-b border-[var(--a-border)] px-6 py-5">
          <h2 className="text-sm font-semibold text-[var(--a-ink)]">
            Related invoice
          </h2>
        </div>
        <ul className="px-4 py-2">
          <li>
            <ListRow
              icon={<FileText className="h-4 w-4" />}
              leadingBadgeTone="indigo"
              title={payment.invoice.invoiceNumber}
              subtitle={`${payment.invoice.customerProfile.user.email} · ${formatMoney(
                payment.invoice.total,
                payment.invoice.currency,
              )}`}
              trailing={<StatusBadge status={payment.invoice.status} />}
              href={`/admin/${businessId}/invoices/${payment.invoice.id}`}
            />
          </li>
        </ul>
      </AdminCard>
    </div>
  );
}

function Field({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--a-ink-3)]">
        {label}
      </dt>
      <dd
        className={
          mono
            ? "mt-1 truncate font-mono text-xs text-[var(--a-ink-2)]"
            : "mt-1 truncate text-sm text-[var(--a-ink)]"
        }
      >
        {value}
      </dd>
    </div>
  );
}