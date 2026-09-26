import { useMemo, useState } from "react";
import { FileText } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { adminApi } from "../../api/admin";
import { formatMoney } from "@/lib/format";
import { useCurrentBusinessName } from "@/hooks/useCurrentBusinessName";

import { AdminCard } from "@/components/admin/AdminCard";
import { AdminErrorState } from "@/components/admin/AdminErrorState";
import { AdminLoadingState } from "@/components/admin/AdminLoadingState";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { StatusBadge } from "@/components/status-badge";

function date(value: string) {
  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function AdminInvoicesPage() {
  const { businessId } = useParams<{ businessId: string }>();
  const businessName = useCurrentBusinessName();
  const [page] = useState(1);

  const query = useQuery({
    queryKey: ["admin-invoices", businessId, page],
    queryFn: () => adminApi.invoices(businessId!, page),
    enabled: Boolean(businessId),
  });

  const invoices = useMemo(() => query.data?.data ?? [], [query.data]);

  // Per-currency totals from the loaded page only — never combined.
  const totalsByCurrency = useMemo(() => {
    const map = new Map<string, number>();
    for (const inv of invoices) {
      map.set(inv.currency, (map.get(inv.currency) ?? 0) + inv.total);
    }
    return Array.from(map.entries());
  }, [invoices]);

  if (!businessId) {
    return <AdminErrorState message="A valid business context is required." />;
  }
  if (query.isLoading) return <AdminLoadingState variant="table" rows={6} />;
  if (query.isError) {
    return (
      <AdminErrorState
        message="We couldn't load the invoices."
        onRetry={() => query.refetch()}
      />
    );
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow={
          businessName ? `${businessName} / Invoices` : "Admin / Invoices"
        }
        title="Invoices"
        description="Business-wide billing documents and their payment state."
      />

      {totalsByCurrency.length > 0 ? (
        <AdminCard variant="flush">
          <div className="grid grid-cols-1 gap-px bg-[var(--a-border)] sm:grid-cols-3">
            <SummaryCell label="Invoices" value={String(invoices.length)} />
            {totalsByCurrency.map(([currency, total]) => (
              <SummaryCell
                key={currency}
                label={`Billed · ${currency}`}
                value={formatMoney(total, currency)}
              />
            ))}
          </div>
        </AdminCard>
      ) : null}

      <AdminCard variant="flush">
        <div className="border-b border-[var(--a-border)] px-6 py-5">
          <h2 className="text-sm font-semibold text-[var(--a-ink)]">
            Invoice history
          </h2>
          <p className="mt-0.5 text-xs text-[var(--a-ink-3)]">
            {invoices.length} invoice{invoices.length === 1 ? "" : "s"} on this
            page
          </p>
        </div>

        {invoices.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <FileText className="mx-auto h-8 w-8 text-[var(--a-ink-3)]" />
            <p className="mt-3 text-sm font-semibold text-[var(--a-ink)]">
              No invoices yet
            </p>
            <p className="mt-1 text-sm text-[var(--a-ink-2)]">
              Invoices will appear after subscription billing.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-[var(--a-canvas-2)] text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--a-ink-3)]">
                <tr>
                  <th className="px-6 py-3">Invoice</th>
                  <th className="px-6 py-3">Customer</th>
                  <th className="px-6 py-3">Service / Plan</th>
                  <th className="px-6 py-3 text-right">Total</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Issued</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--a-border)]">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="transition hover:bg-[rgba(15,15,10,0.025)]">
                    <td className="px-6 py-4">
                      <Link
                        to={`/admin/${businessId}/invoices/${inv.id}`}
                        className="font-medium text-[var(--a-ink)] hover:text-[var(--a-indigo)]"
                      >
                        {inv.invoiceNumber}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-[var(--a-ink-2)]">
                      {inv.customerProfile.user.email}
                    </td>
                    <td className="px-6 py-4 text-[var(--a-ink-2)]">
                      {inv.subscription?.plan.service.name ?? "—"}
                      {inv.subscription?.plan.name
                        ? ` · ${inv.subscription.plan.name}`
                        : ""}
                    </td>
                    <td className="px-6 py-4 text-right font-semibold tabular-nums text-[var(--a-ink)]">
                      {formatMoney(inv.total, inv.currency)}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={inv.status} />
                    </td>
                    <td className="px-6 py-4 text-[var(--a-ink-2)]">
                      {date(inv.issuedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminCard>
    </div>
  );
}

function SummaryCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white px-6 py-5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--a-ink-3)]">
        {label}
      </p>
      <p className="mt-1.5 text-xl font-semibold tabular-nums text-[var(--a-ink)]">
        {value}
      </p>
    </div>
  );
}