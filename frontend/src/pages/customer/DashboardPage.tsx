import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  CreditCard,
  FileText,
  Receipt,
  Sparkles,
} from "lucide-react";

import { subscriptionsApi } from "@/api/subscriptions";
import { invoicesApi } from "@/api/invoices";
import { creditsApi } from "@/api/credits";

import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { StatusBadge } from "@/components/status-badge";
import { LoadingState } from "@/components/loading-state";
import { ErrorState } from "@/components/error-state";
import { InvoiceTrendChart } from "@/components/charts/InvoiceTrendChart";
import { formatMoney } from "@/lib/format";

function greeting() {
  const hour = new Date().getHours();

  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export function CustomerDashboardPage() {
  const subscriptions = useQuery({
    queryKey: ["customer-subscriptions"],
    queryFn: () => subscriptionsApi.list(),
  });

  const invoices = useQuery({
    queryKey: ["customer-invoices"],
    queryFn: () => invoicesApi.list(),
  });

  const credits = useQuery({
    queryKey: ["customer-credits"],
    queryFn: () => creditsApi.getBalance(),
  });

  if (
    subscriptions.isPending ||
    invoices.isPending ||
    credits.isPending
  ) {
    return <LoadingState message="Loading your billing overview…" />;
  }

  if (
    subscriptions.isError ||
    invoices.isError ||
    credits.isError
  ) {
    return (
      <ErrorState
        description="We couldn't load your billing overview."
        retryAction={() => {
          subscriptions.refetch();
          invoices.refetch();
          credits.refetch();
        }}
      />
    );
  }

  const subscriptionList = subscriptions.data;
  const invoiceList = invoices.data.data;

  const activeSubscriptions = subscriptionList.filter(
    (subscription) => subscription.status === "ACTIVE",
  );

  const openInvoices = invoiceList.filter(
    (invoice) => invoice.status === "OPEN",
  );

  const chartCurrency = invoiceList[0]?.currency ?? "INR";

  const chartData = invoiceList
    .filter((invoice) => invoice.currency === chartCurrency)
    .slice(0, 6)
    .reverse()
    .map((invoice) => ({
      label: invoice.invoiceNumber,
      amount: invoice.total / 100,
    }));

  const creditBalances = [
    credits.data.INR > 0
      ? formatMoney(credits.data.INR, "INR")
      : null,
    credits.data.USD > 0
      ? formatMoney(credits.data.USD, "USD")
      : null,
  ].filter(Boolean);

  return (
    <div className="space-y-8">
      <PageHeader
        title={greeting()}
        description="Here's what's happening across your subscriptions and billing."
      />

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Active subscriptions"
          value={String(activeSubscriptions.length)}
          icon={<CreditCard className="h-4 w-4" />}
          description="Currently active"
        />

        <StatCard
          label="Open invoices"
          value={String(openInvoices.length)}
          icon={<FileText className="h-4 w-4" />}
          description="Awaiting payment"
        />

        <StatCard
          label="Available credit"
          value={
            creditBalances.length
              ? creditBalances.join(" · ")
              : "—"
          }
          icon={<Sparkles className="h-4 w-4" />}
          description="Available account credit"
        />

        <StatCard
          label="Invoices"
          value={String(invoiceList.length)}
          icon={<Receipt className="h-4 w-4" />}
          description="Total billing history"
        />
      </section>

      <section className="rounded-2xl border border-[var(--color-border-soft)] bg-white p-5 shadow-[var(--shadow-soft)]">
        <div className="mb-4">
          <h2 className="text-sm font-semibold tracking-tight text-[var(--color-ink)]">
            Billing trend
          </h2>

          <p className="text-xs text-[var(--color-ink-muted)]">
            Recent invoices in {chartCurrency}
          </p>
        </div>

        <InvoiceTrendChart data={chartData} />
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-[var(--color-border-soft)] bg-white shadow-[var(--shadow-soft)]">
          <div className="flex items-center justify-between border-b border-[var(--color-border-soft)] px-5 py-4">
            <h2 className="text-sm font-semibold text-[var(--color-ink)]">
              Your subscriptions
            </h2>

            <Link
              to="/customer/subscriptions"
              className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
            >
              View all
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <ul className="divide-y divide-[var(--color-border-soft)]">
            {activeSubscriptions.length === 0 ? (
              <li className="px-5 py-10 text-center text-sm text-[var(--color-ink-muted)]">
                No active subscriptions yet.
              </li>
            ) : (
              activeSubscriptions.slice(0, 4).map((subscription) => (
                <li key={subscription.id}>
                  <Link
                    to={`/customer/subscriptions/${subscription.id}`}
                    className="flex items-center gap-3 px-5 py-3.5 transition hover:bg-[var(--color-surface)]"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--color-surface)]">
                      <Sparkles className="h-4 w-4 text-[var(--color-ink-muted)]" />
                    </span>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-[var(--color-ink)]">
                        {subscription.plan?.service?.name ?? "Service"}{" "}
                        ·{" "}
                        {subscription.plan?.name ?? "Plan"}
                      </p>

                      <p className="text-xs text-[var(--color-ink-muted)]">
                        {formatMoney(
                          subscription.price,
                          subscription.currency,
                        )}{" "}
                        /{" "}
                        {subscription.billingInterval === "MONTHLY"
                          ? "month"
                          : "year"}
                      </p>
                    </div>

                    <StatusBadge status={subscription.status} />
                  </Link>
                </li>
              ))
            )}
          </ul>
        </div>

        <div className="rounded-2xl border border-[var(--color-border-soft)] bg-white shadow-[var(--shadow-soft)]">
          <div className="flex items-center justify-between border-b border-[var(--color-border-soft)] px-5 py-4">
            <h2 className="text-sm font-semibold text-[var(--color-ink)]">
              Recent invoices
            </h2>

            <Link
              to="/customer/invoices"
              className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
            >
              View all
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <ul className="divide-y divide-[var(--color-border-soft)]">
            {invoiceList.slice(0, 4).map((invoice) => (
              <li key={invoice.id}>
                <Link
                  to={`/customer/invoices/${invoice.id}`}
                  className="flex items-center gap-3 px-5 py-3.5 transition hover:bg-[var(--color-surface)]"
                >
                  <Receipt className="h-4 w-4 text-[var(--color-ink-muted)]" />

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-[var(--color-ink)]">
                      {invoice.invoiceNumber}
                    </p>

                    <p className="text-xs text-[var(--color-ink-muted)]">
                      {new Date(
                        invoice.createdAt,
                      ).toLocaleDateString()}
                    </p>
                  </div>

                  <span className="text-sm font-semibold tabular-nums text-[var(--color-ink)]">
                    {formatMoney(
                      invoice.total,
                      invoice.currency,
                    )}
                  </span>
                </Link>
              </li>
            ))}

            {invoiceList.length === 0 ? (
              <li className="px-5 py-10 text-center text-sm text-[var(--color-ink-muted)]">
                No invoices yet.
              </li>
            ) : null}
          </ul>
        </div>
      </section>

      <section className="rounded-2xl bg-[var(--color-surface-dark)] p-6 text-white shadow-[var(--shadow-card)]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-white/50">
              Discover more
            </p>

            <h2 className="mt-1 text-xl font-semibold">
              Explore available services
            </h2>

            <p className="mt-1 text-sm text-white/60">
              Browse services and choose a plan whenever you're ready.
            </p>
          </div>

          <Link
            to="/customer/explore"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--color-accent)] px-5 py-2.5 text-sm font-semibold text-[var(--color-accent-foreground)]"
          >
            Explore
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}

