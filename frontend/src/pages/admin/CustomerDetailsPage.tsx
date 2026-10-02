
import { FileText, Mail, Receipt, Users } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { StatusBadge } from "@/components/status-badge";
import { adminApi } from "../../api/admin";
import { useCurrentBusinessName } from "@/hooks/useCurrentBusinessName";

import { AdminCard } from "@/components/admin/AdminCard";
import { AdminErrorState } from "@/components/admin/AdminErrorState";
import { AdminLoadingState } from "@/components/admin/AdminLoadingState";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { ListRow } from "@/components/admin/ListRow";
import { MetricCard } from "@/components/admin/MetricCard";

function date(value: string) {
  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function AdminCustomerDetailsPage() {
  const { businessId, customerId } = useParams<{
    businessId: string;
    customerId: string;
  }>();
  const businessName = useCurrentBusinessName();

  const query = useQuery({
    queryKey: ["admin-customer", businessId, customerId],
    queryFn: () => adminApi.customer(businessId!, customerId!),
    enabled: Boolean(businessId && customerId),
  });

  if (!businessId || !customerId) {
    return <AdminErrorState message="Customer context is missing." />;
  }
  if (query.isLoading) return <AdminLoadingState variant="detail" />;
  if (query.isError || !query.data) {
    return (
      <AdminErrorState
        message="We couldn't load this customer."
        onRetry={() => query.refetch()}
      />
    );
  }

  const customer = query.data;

  return (
    <div className="space-y-6">
      <Link
        to={`/admin/${businessId}/customers`}
        className="text-xs font-semibold text-[var(--a-ink-2)] transition hover:text-[var(--a-ink)]"
      >
        ← Back to customers
      </Link>

      <AdminPageHeader
        eyebrow={
          businessName ? `${businessName} / Customers` : "Admin / Customers"
        }
        title={customer.user.email}
        description={`Customer since ${date(customer.createdAt)}`}
      />

      <section className="grid gap-4 sm:grid-cols-3">
        <MetricCard
          icon={<Users className="h-4 w-4" />}
          tone="indigo"
          label="Subscriptions"
          value={customer._count.subscriptions}
          hint="Active and historical"
        />
        <MetricCard
          icon={<FileText className="h-4 w-4" />}
          tone="violet"
          label="Invoices"
          value={customer._count.invoices}
          hint="Billing documents"
        />
        <MetricCard
          icon={<Receipt className="h-4 w-4" />}
          tone="emerald"
          label="Credit ledger entries"
          value={customer._count.creditLedger}
          hint="Credits and debits"
        />
      </section>

      <AdminCard>
        <h2 className="text-sm font-semibold text-[var(--a-ink)]">
          Customer profile
        </h2>
        <dl className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Customer ID" value={customer.id} mono />
          <Field label="Email" value={customer.user.email} />
          <Field label="Created" value={date(customer.createdAt)} />
        </dl>
      </AdminCard>
      <AdminCard variant="flush">
        <div className="border-b border-[var(--a-border)] px-6 py-5">
          <h2 className="text-sm font-semibold text-[var(--a-ink)]">
            Related records
          </h2>
          <p className="mt-0.5 text-xs text-[var(--a-ink-3)]">
            Records belonging to this customer.
          </p>
        </div>

        <ul className="divide-y divide-[var(--a-border)] px-4 py-2">
          {customer.subscriptions.map((subscription) => (
            <li key={subscription.id}>
              <ListRow
                icon={<Users className="h-4 w-4" />}
                leadingBadgeTone="indigo"
                title={subscription.plan.name}
                subtitle={`${subscription.plan.service.name} · ${subscription.status}`}
                trailing={
                  <span className="text-xs text-[var(--a-ink-3)]">
                    Subscription
                  </span>
                }
                href={`/admin/${businessId}/subscriptions/${subscription.id}`}
              />
            </li>
          ))}

          {customer.invoices.map((invoice) => (
            <li key={invoice.id}>
              <ListRow
                icon={<FileText className="h-4 w-4" />}
                leadingBadgeTone="violet"
                title={invoice.invoiceNumber}
                subtitle={`Issued ${date(invoice.issuedAt)}`}
                trailing={
                  <StatusBadge status={invoice.status} />
                }
                href={`/admin/${businessId}/invoices/${invoice.id}`}
              />
            </li>
          ))}

          <li>
            <ListRow
              icon={<Mail className="h-4 w-4" />}
              leadingBadgeTone="emerald"
              title="Contact email"
              subtitle={customer.user.email}
              trailing={
                <span className="rounded-full bg-[var(--a-canvas-2)] px-2.5 py-1 text-[11px] font-semibold text-[var(--a-ink-2)]">
                  Copy from your mail client
                </span>
              }
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
