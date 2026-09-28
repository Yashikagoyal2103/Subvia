
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

  const dashboardQuery = useQuery({
    queryKey: ["admin-dashboard", businessId],
    queryFn: () => adminApi.dashboard(businessId!),
    enabled: Boolean(businessId),
  });
  const invoicesQuery = useQuery({
    queryKey: ["admin-invoices", businessId, "recent"],
    queryFn: () => adminApi.invoices(businessId!, 1, 5),
    enabled: Boolean(businessId),
  });

  // ── All hooks are above this line. Below this point the component may
  //    early-return without breaking the rules of hooks.

  if (!businessId) {
    return <AdminErrorState message="A valid business context is required." />;
  }

  const isLoading = dashboardQuery.isLoading || invoicesQuery.isLoading;

  if (isLoading) return <AdminLoadingState variant="cards" rows={4} />;

  if (dashboardQuery.isError || invoicesQuery.isError || !dashboardQuery.data) {
    return (
      <AdminErrorState
        message="We couldn't load the business overview."
        onRetry={() => {
          void dashboardQuery.refetch();
          void invoicesQuery.refetch();
        }}
      />
    );
  }

  const dashboard = dashboardQuery.data;
  const invoices = invoicesQuery.data?.data ?? [];
  const recentInvoices = invoices.slice(0, 5);

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

      {dashboard.subscriptions.pastDue > 0 ? (
        <InsightBanner tone="warning">
          <span className="font-semibold">
            {dashboard.subscriptions.pastDue}{" "}
            {dashboard.subscriptions.pastDue === 1
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
          value={dashboard.services}
          hint="Configured services"
        />
        <MetricCard
          icon={<Users className="h-4 w-4" />}
          tone="violet"
          label="Customers"
          value={dashboard.customers}
          hint="Business customers"
        />
        <MetricCard
          icon={<CreditCard className="h-4 w-4" />}
          tone="emerald"
          label="Active subscriptions"
          value={dashboard.subscriptions.active}
          hint={`${dashboard.subscriptions.total} total`}
        />
        <MetricCard
          icon={<FileText className="h-4 w-4" />}
          tone="amber"
          label="Paid invoices"
          value={dashboard.invoices.paid}
          hint={`${dashboard.invoices.total} total`}
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
                  Breakdown of the {dashboard.subscriptions.total} subscriptions.
                </p>
              </div>
            </div>

            <div className="mt-6">
              <DonutMetric
                size={170}
                centerLabel="Total"
                centerValue={dashboard.subscriptions.total}
                segments={[
                  {
                    label: "Active",
                    value: dashboard.subscriptions.active,
                    tone: "emerald",
                  },
                  {
                    label: "Pending",
                    value: dashboard.subscriptions.pending,
                    tone: "amber",
                  },
                  {
                    label: "Past due",
                    value: dashboard.subscriptions.pastDue,
                    tone: "rose",
                  },
                  {
                    label: "Cancelled",
                    value: dashboard.subscriptions.cancelled,
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
                {dashboard.payments.successful}
              </p>
            </div>
          </AdminCard>
        </div>
      </section>
    </div>
  );
}
