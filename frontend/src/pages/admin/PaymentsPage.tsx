import { CheckCircle2, CreditCard, XCircle } from "lucide-react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { adminApi } from "../../api/admin";
import { formatMoney } from "@/lib/format";
import { useCurrentBusinessName } from "@/hooks/useCurrentBusinessName";

import { AdminCard } from "@/components/admin/AdminCard";
import { AdminErrorState } from "@/components/admin/AdminErrorState";
import { AdminLoadingState } from "@/components/admin/AdminLoadingState";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { ListRow } from "@/components/admin/ListRow";
import { StatusBadge } from "@/components/status-badge";

function date(value: string) {
  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function AdminPaymentsPage() {
  const { businessId } = useParams<{ businessId: string }>();
  const businessName = useCurrentBusinessName();

  const query = useQuery({
    queryKey: ["admin-payments", businessId],
    queryFn: () => adminApi.payments(businessId!),
    enabled: Boolean(businessId),
  });

  if (!businessId) {
    return <AdminErrorState message="A valid business context is required." />;
  }
  if (query.isLoading) return <AdminLoadingState variant="list" rows={6} />;
  if (query.isError) {
    return (
      <AdminErrorState
        message="We couldn't load the payments."
        onRetry={() => query.refetch()}
      />
    );
  }

  const payments = query.data?.data ?? [];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow={businessName ? `${businessName} / Payments` : "Admin / Payments"}
        title="Payment activity"
        description="Successful and failed payment attempts across the business."
      />

      <AdminCard variant="flush">
        <div className="border-b border-[var(--a-border)] px-6 py-5">
          <h2 className="text-sm font-semibold text-[var(--a-ink)]">
            Payment attempts
          </h2>
          <p className="mt-0.5 text-xs text-[var(--a-ink-3)]">
            {payments.length} payment{payments.length === 1 ? "" : "s"} on this
            page
          </p>
        </div>

        {payments.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <CreditCard className="mx-auto h-8 w-8 text-[var(--a-ink-3)]" />
            <p className="mt-3 text-sm font-semibold text-[var(--a-ink)]">
              No payment activity
            </p>
            <p className="mt-1 text-sm text-[var(--a-ink-2)]">
              Payment attempts will appear here.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-[var(--a-border)] px-4 py-2">
            {payments.map((payment) => {
              const success = payment.status === "SUCCESS";
              return (
                <li key={payment.id}>
                  <ListRow
                    icon={
                      success ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <XCircle className="h-4 w-4" />
                      )
                    }
                    leadingBadgeTone={success ? "emerald" : "rose"}
                    title={payment.invoice.invoiceNumber}
                    subtitle={`${payment.invoice.customerProfile.user.email} · ${payment.paymentMethod} · ${date(payment.createdAt)}`}
                    trailing={
                      <>
                        <span className="text-sm font-semibold tabular-nums text-[var(--a-ink)]">
                          {formatMoney(payment.amount, payment.currency)}
                        </span>
                        <StatusBadge status={payment.status} />
                      </>
                    }
                    href={`/admin/${businessId}/payments/${payment.id}`}
                  />
                </li>
              );
            })}
          </ul>
        )}
      </AdminCard>
    </div>
  );
}