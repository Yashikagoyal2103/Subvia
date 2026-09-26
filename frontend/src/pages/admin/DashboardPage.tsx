import {
  Activity,
  CreditCard,
  FileText,
  Package2,
  Receipt,
  Users,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { adminApi } from "../../api/admin";
import { servicesApi } from "../../api/services";
import { useAuthStore } from "../../stores/auth.store";
import { formatMoney } from "@/lib/format";
import { useCurrentBusinessName } from "@/hooks/useCurrentBusinessName";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminCard } from "@/components/admin/AdminCard";
import { AdminLoadingState } from "@/components/admin/AdminLoadingState";
import { AdminErrorState } from "@/components/admin/AdminErrorState";
import { DonutMetric } from "@/components/admin/DonutMetric";
import { InsightBanner } from "@/components/admin/InsightBanner";
import { ListRow } from "@/components/admin/ListRow";
import { MetricCard } from "@/components/admin/MetricCard";
import { StatusBadge } from "@/components/status-badge";

function date(value: string) {
  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function greeting(firstName: string | undefined) {
  const h = new Date().getHours();
  const part = h < 12 ? "morning" : h < 18 ? "afternoon" : "evening";
  return firstName ? `Good ${part}, ${firstName}` : `Good ${part}`;
}

export function AdminDashboardPage() {
  const { businessId } = useParams<{ businessId: string }>();
  const user = useAuthStore((s) => s.user);
  // ▼ MOVED TO TOP — hooks must be called on every render, before any returns.
  const businessName = useCurrentBusinessName();

  const servicesQuery = useQuery({
    queryKey: ["admin-services", businessId],
    queryFn: () => servicesApi.list(businessId!),
    enabled: Boolean(businessId),
  });
  const customersQuery = useQuery({
    queryKey: ["admin-customers", businessId],
    queryFn: () => adminApi.customers(businessId!),
    enabled: Boolean(businessId),
  });
  const subscriptionsQuery = useQuery({
    queryKey: ["admin-subscriptions", businessId],
    queryFn: () => adminApi.subscriptions(businessId!),
    enabled: Boolean(businessId),
  });
  const invoicesQuery = useQuery({
    queryKey: ["admin-invoices", businessId],
    queryFn: () => adminApi.invoices(businessId!),
    enabled: Boolean(businessId),
  });
  const paymentsQuery = useQuery({
    queryKey: ["admin-payments", businessId],
    queryFn: () => adminApi.payments(businessId!),
    enabled: Boolean(businessId),
  });

  // ── All hooks are above this line. Below this point the component may
  //    early-return without breaking the rules of hooks.

  if (!businessId) {
    return <AdminErrorState message="A valid business context is required." />;
  }

  const isLoading =
    servicesQuery.isLoading ||
    customersQuery.isLoading ||
    subscriptionsQuery.isLoading ||
    invoicesQuery.isLoading ||
    paymentsQuery.isLoading;

  if (isLoading) return <AdminLoadingState variant="cards" rows={4} />;

  const hasError =
    servicesQuery.isError ||
    customersQuery.isError ||
    subscriptionsQuery.isError ||
    invoicesQuery.isError ||
    paymentsQuery.isError;

  if (hasError) {
    return (
      <AdminErrorState
        message="We couldn't load the business overview."
        onRetry={() => {
          void servicesQuery.refetch();
          void customersQuery.refetch();
          void subscriptionsQuery.refetch();
          void invoicesQuery.refetch();
          void paymentsQuery.refetch();
        }}
      />
    );
  }

  const services = servicesQuery.data ?? [];
  const customers = customersQuery.data?.data ?? [];
  const subscriptions = subscriptionsQuery.data?.data ?? [];
  const invoices = invoicesQuery.data?.data ?? [];
  const payments = paymentsQuery.data?.data ?? [];

  const activeSubscriptions = subscriptions.filter((s) => s.status === "ACTIVE");
  const pastDueSubscriptions = subscriptions.filter(
    (s) => s.status === "PAST_DUE",
  );
  const pendingSubscriptions = subscriptions.filter(
    (s) => s.status === "PENDING",
  );
  const cancelledSubscriptions = subscriptions.filter(
    (s) => s.status === "CANCELLED",
  );

  const paidInvoices = invoices.filter((i) => i.status === "PAID");
  const successfulPayments = payments.filter((p) => p.status === "SUCCESS");

  const recentInvoices = [...invoices]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow={
          businessName ? `${businessName} / Dashboard` : "Admin / Dashboard"
        }
        title={greeting(user?.firstName)}
        description="Monitor customers, subscriptions and billing activity across this business."
        actions={
          <>
            <Link
              to={`/admin/${businessId}/services`}
              className="inline-flex items-center gap-2 rounded-full border border-[var(--a-border)] bg-white px-4 py-2 text-sm font-semibold text-[var(--a-ink)] transition hover:border-[var(--a-border-strong)]"
            >
              Create service
            </Link>
            <Link
              to={`/admin/${businessId}/plans`}
              className="inline-flex items-center gap-2 rounded-full bg-[var(--a-ink)] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
            >
              Create plan
            </Link>
          </>
        }
      />

      {pastDueSubscriptions.length > 0 ? (
        <InsightBanner tone="warning">
          <span className="font-semibold">
            {pastDueSubscriptions.length}{" "}
            {pastDueSubscriptions.length === 1
              ? "subscription is"
              : "subscriptions are"}{" "}
            past due.
          </span>{" "}
          <Link
            to={`/admin/${businessId}/subscriptions`}
            className="underline underline-offset-4"
          >
            Review subscriptions
          </Link>
        </InsightBanner>
      ) : null}

      {/* 4-up metrics */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={<Package2 className="h-4 w-4" />}
          tone="indigo"
          label="Services"
          value={services.length}
          hint="Configured services"
        />
        <MetricCard
          icon={<Users className="h-4 w-4" />}
          tone="violet"
          label="Customers"
          value={customers.length}
          hint="Business customers"
        />
        <MetricCard
          icon={<CreditCard className="h-4 w-4" />}
          tone="emerald"
          label="Active subscriptions"
          value={activeSubscriptions.length}
          hint={`${subscriptions.length} total`}
        />
        <MetricCard
          icon={<FileText className="h-4 w-4" />}
          tone="amber"
          label="Paid invoices"
          value={paidInvoices.length}
          hint={`${invoices.length} total`}
        />
      </section>

      {/* Two-column */}
      <section className="grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
        <AdminCard variant="flush">
          <div className="flex items-start justify-between gap-4 border-b border-[var(--a-border)] px-6 py-5">
            <div>
              <h2 className="text-sm font-semibold text-[var(--a-ink)]">
                Recent invoices
              </h2>
              <p className="mt-0.5 text-xs text-[var(--a-ink-3)]">
                Latest billing records generated by the platform.
              </p>
            </div>
            <Link
              to={`/admin/${businessId}/invoices`}
              className="text-xs font-semibold text-[var(--a-indigo)] hover:underline"
            >
              View all
            </Link>
          </div>

          {recentInvoices.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <FileText className="mx-auto h-8 w-8 text-[var(--a-ink-3)]" />
              <p className="mt-3 text-sm font-medium text-[var(--a-ink)]">
                No invoices yet
              </p>
              <p className="mt-1 text-sm text-[var(--a-ink-2)]">
                Billing records will appear here.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-[var(--a-border)] px-4 py-2">
              {recentInvoices.map((invoice) => (
                <li key={invoice.id}>
                  <ListRow
                    icon={<Receipt className="h-4 w-4" />}
                    leadingBadgeTone="indigo"
                    title={invoice.invoiceNumber}
                    subtitle={`${invoice.customerProfile.user.email} · ${date(
                      invoice.createdAt,
                    )}`}
                    trailing={
                      <>
                        <span className="text-sm font-semibold tabular-nums text-[var(--a-ink)]">
                          {formatMoney(invoice.total, invoice.currency)}
                        </span>
                        <StatusBadge status={invoice.status} />
                      </>
                    }
                    href={`/admin/${businessId}/invoices/${invoice.id}`}
                  />
                </li>
              ))}
            </ul>
          )}
        </AdminCard>

        <div className="space-y-6">
          <AdminCard>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-[var(--a-ink)]">
                  Subscriptions by status
                </h2>
                <p className="mt-0.5 text-xs text-[var(--a-ink-3)]">
                  Breakdown of the {subscriptions.length} subscriptions.
                </p>
              </div>
            </div>

            <div className="mt-6">
              <DonutMetric
                size={170}
                centerLabel="Total"
                centerValue={subscriptions.length}
                segments={[
                  {
                    label: "Active",
                    value: activeSubscriptions.length,
                    tone: "emerald",
                  },
                  {
                    label: "Pending",
                    value: pendingSubscriptions.length,
                    tone: "amber",
                  },
                  {
                    label: "Past due",
                    value: pastDueSubscriptions.length,
                    tone: "rose",
                  },
                  {
                    label: "Cancelled",
                    value: cancelledSubscriptions.length,
                    tone: "indigo",
                  },
                ]}
              />
            </div>
          </AdminCard>

          <AdminCard variant="flush">
            <div className="flex items-center gap-3 border-b border-[var(--a-border)] px-6 py-5">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--a-indigo-soft)] text-[var(--a-indigo)]">
                <Activity className="h-4 w-4" />
              </span>
              <div>
                <h2 className="text-sm font-semibold text-[var(--a-ink)]">
                  Billing operations
                </h2>
                <p className="mt-0.5 text-xs text-[var(--a-ink-3)]">
                  Jump directly into operational views.
                </p>
              </div>
            </div>

            <ul className="px-4 py-2">
              <li>
                <ListRow
                  icon={<Users className="h-4 w-4" />}
                  leadingBadgeTone="violet"
                  title="View customers"
                  href={`/admin/${businessId}/customers`}
                />
              </li>
              <li>
                <ListRow
                  icon={<Receipt className="h-4 w-4" />}
                  leadingBadgeTone="indigo"
                  title="Review subscriptions"
                  href={`/admin/${businessId}/subscriptions`}
                />
              </li>
              <li>
                <ListRow
                  icon={<FileText className="h-4 w-4" />}
                  leadingBadgeTone="emerald"
                  title="Review invoices"
                  href={`/admin/${businessId}/invoices`}
                />
              </li>
              <li>
                <ListRow
                  icon={<CreditCard className="h-4 w-4" />}
                  leadingBadgeTone="amber"
                  title="Inspect payments"
                  href={`/admin/${businessId}/payments`}
                />
              </li>
              <li>
                <ListRow
                  icon={<Activity className="h-4 w-4" />}
                  leadingBadgeTone="violet"
                  title="Open billing activity"
                  href={`/admin/${businessId}/billing-activity`}
                />
              </li>
            </ul>

            <div className="border-t border-[var(--a-border)] px-6 py-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--a-ink-3)]">
                Successful payments
              </p>
              <p className="mt-1 text-xl font-semibold tabular-nums text-[var(--a-ink)]">
                {successfulPayments.length}
              </p>
            </div>
          </AdminCard>
        </div>
      </section>
    </div>
  );
}