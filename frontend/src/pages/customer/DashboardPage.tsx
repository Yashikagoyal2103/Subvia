import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  CreditCard,
  FileText,
  Receipt,
  Sparkles,
  Wallet,
} from "lucide-react";

import { subscriptionsApi, type Subscription } from "@/api/subscriptions";
import { invoicesApi, type Invoice } from "@/api/invoices";
import { paymentsApi, type Payment } from "@/api/payments";
import { creditsApi } from "@/api/credits";

import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { StatusBadge } from "@/components/status-badge";
import { LoadingState } from "@/components/loading-state";
import { ErrorState } from "@/components/error-state";
import { InvoiceTrendChart } from "@/components/charts/InvoiceTrendChart";
import { formatMoney } from "@/lib/format";
import { toArray } from "@/lib/api-shape";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function readBalance(d: unknown): { INR: number; USD: number } {
  if (!d || typeof d !== "object") return { INR: 0, USD: 0 };
  const o = d as Record<string, unknown>;
  const n = (v: unknown) => (typeof v === "number" ? v : 0);
  return { INR: n(o.INR) || n(o.inr) || 0, USD: n(o.USD) || n(o.usd) || 0 };
}

export function CustomerDashboardPage() {
  const { businessId = "" } = useParams();
  const hasBusiness = !!businessId;

  const subs = useQuery({
    queryKey: ["subscriptions", businessId],
    queryFn: () => subscriptionsApi.list(businessId),
    enabled: hasBusiness,
  });
  const invoices = useQuery({
    queryKey: ["invoices", businessId],
    queryFn: () => invoicesApi.list(businessId),
    enabled: hasBusiness,
  });
  const payments = useQuery({
    queryKey: ["payments", businessId],
    queryFn: () => paymentsApi.list(businessId),
    enabled: hasBusiness,
  });
  const credits = useQuery({
    queryKey: ["credits", businessId],
    queryFn: () => creditsApi.getBalance(businessId),
    enabled: hasBusiness,
    retry: false,
  });

  const subList = useMemo(
    () => (subs.isError ? [] : toArray<Subscription>(subs.data)),
    [subs.data, subs.isError],
  );
  const invoiceList = useMemo(
    () => (invoices.isError ? [] : toArray<Invoice>(invoices.data)),
    [invoices.data, invoices.isError],
  );
  const paymentList = useMemo(
    () => (payments.isError ? [] : toArray<Payment>(payments.data)),
    [payments.data, payments.isError],
  );
  const balance = useMemo(
    () => (credits.isError ? { INR: 0, USD: 0 } : readBalance(credits.data)),
    [credits.data, credits.isError],
  );

  if (!hasBusiness) {
    return <ErrorState description="A valid business context is required." />;
  }
  if (subs.isPending && invoices.isPending) {
    return <LoadingState message="Loading your billing overview…" />;
  }

  const degraded =
    subs.isError || invoices.isError || payments.isError || credits.isError;

  const activeSubs = subList.filter((s) => s.status === "ACTIVE").length;
  const openInvoices = invoiceList.filter((i) => i.status === "OPEN");
  const openInvoiceCount = openInvoices.length;
  const outstandingINR = openInvoices
    .filter((i) => i.currency === "INR")
    .reduce((a, i) => a + i.total, 0);

  const chartData = [...invoiceList]
    .sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    )
    .slice(-6)
    .map((i) => ({ label: i.invoiceNumber, amount: i.total / 100 }));

  const recentSubs = subList.slice(0, 4);
  const recentInvoices = [...invoiceList]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, 4);
  const recentPayments = [...paymentList]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, 5);

  return (
    <div className="space-y-8">
      <PageHeader
        title={`${greeting()}, welcome back`}
        description="A clear view of your subscriptions, invoices and credits."
      />

      {degraded ? (
        <div className="rounded-xl border-l-4 border-amber-400 bg-amber-50/70 px-4 py-2.5 text-xs text-amber-900">
          Some data couldn&apos;t be loaded from the server. The page shows what
          is available.
        </div>
      ) : null}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Active subscriptions"
          value={activeSubs}
          icon={CreditCard}
          description="Currently active services"
        />
        <StatCard
          label="Outstanding balance"
          value={formatMoney(outstandingINR, "INR")}
          icon={Receipt}
          description="Open invoices (INR)"
        />
        <StatCard
          label="Credits available"
          value={formatMoney(balance.INR, "INR")}
          icon={Wallet}
          description={
            balance.USD > 0
              ? `Also ${formatMoney(balance.USD, "USD")}`
              : "Account credits"
          }
        />
        <StatCard
          label="Open invoices"
          value={openInvoiceCount}
          icon={FileText}
          description="Awaiting payment"
        />
      </section>

      <section className="rounded-2xl border border-[var(--color-border-soft)] bg-white p-5 shadow-[var(--shadow-soft)]">
        <div className="mb-4">
          <h2 className="text-sm font-semibold tracking-tight text-[var(--color-ink)]">
            Invoice amounts (last 6)
          </h2>
          <p className="text-xs text-[var(--color-ink-muted)]">
            Based on your recent invoice history
          </p>
        </div>
        <InvoiceTrendChart data={chartData} />
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-[var(--color-border-soft)] bg-white shadow-[var(--shadow-soft)]">
          <div className="flex items-center justify-between border-b border-[var(--color-border-soft)] px-5 py-4">
            <h2 className="text-sm font-semibold tracking-tight text-[var(--color-ink)]">
              Your Subscriptions
            </h2>
            <Link
              to={`/customer/${businessId}/subscriptions`}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--color-ink-muted)] transition hover:text-[var(--color-ink)]"
            >
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <ul className="divide-y divide-[var(--color-border-soft)]">
            {recentSubs.length === 0 ? (
              <li className="px-5 py-10 text-center text-sm text-[var(--color-ink-muted)]">
                No subscriptions yet.
              </li>
            ) : (
              recentSubs.map((s) => (
                <li key={s.id}>
                  <Link
                    to={`/customer/${businessId}/subscriptions/${s.id}`}
                    className="flex items-center gap-3 px-5 py-3.5 transition hover:bg-[var(--color-surface)]"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--color-surface)] ring-1 ring-[var(--color-border-soft)]">
                      <Sparkles className="h-4 w-4 text-[var(--color-ink-muted)]" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-[var(--color-ink)]">
                        {s.plan?.service?.name ?? "Service"} ·{" "}
                        {s.plan?.name ?? "Plan"}
                      </p>
                      <p className="truncate text-xs text-[var(--color-ink-muted)]">
                        {s.billingInterval === "MONTHLY" ? "Monthly" : "Yearly"}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <span className="text-sm font-semibold tabular-nums text-[var(--color-ink)]">
                        {formatMoney(s.price, s.currency)}
                      </span>
                      <StatusBadge status={s.status} />
                    </div>
                  </Link>
                </li>
              ))
            )}
          </ul>
        </div>

        <div className="rounded-2xl border border-[var(--color-border-soft)] bg-white shadow-[var(--shadow-soft)]">
          <div className="flex items-center justify-between border-b border-[var(--color-border-soft)] px-5 py-4">
            <h2 className="text-sm font-semibold tracking-tight text-[var(--color-ink)]">
              Recent Invoices
            </h2>
            <Link
              to={`/customer/${businessId}/invoices`}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--color-ink-muted)] transition hover:text-[var(--color-ink)]"
            >
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <ul className="divide-y divide-[var(--color-border-soft)]">
            {recentInvoices.length === 0 ? (
              <li className="px-5 py-10 text-center text-sm text-[var(--color-ink-muted)]">
                No invoices yet.
              </li>
            ) : (
              recentInvoices.map((i) => (
                <li key={i.id}>
                  <Link
                    to={`/customer/${businessId}/invoices/${i.id}`}
                    className="flex items-center gap-3 px-5 py-3.5 transition hover:bg-[var(--color-surface)]"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--color-surface)] ring-1 ring-[var(--color-border-soft)]">
                      <FileText className="h-4 w-4 text-[var(--color-ink-muted)]" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-[var(--color-ink)]">
                        {i.invoiceNumber}
                      </p>
                      <p className="truncate text-xs text-[var(--color-ink-muted)]">
                        {new Date(i.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <span className="text-sm font-semibold tabular-nums text-[var(--color-ink)]">
                        {formatMoney(i.total, i.currency)}
                      </span>
                      <StatusBadge status={i.status} />
                    </div>
                  </Link>
                </li>
              ))
            )}
          </ul>
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--color-border-soft)] bg-white shadow-[var(--shadow-soft)]">
        <div className="flex items-center justify-between border-b border-[var(--color-border-soft)] px-5 py-4">
          <h2 className="text-sm font-semibold tracking-tight text-[var(--color-ink)]">
            Billing Activity
          </h2>
          <Link
            to={`/customer/${businessId}/billing`}
            className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--color-ink-muted)] transition hover:text-[var(--color-ink)]"
          >
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <ul className="divide-y divide-[var(--color-border-soft)]">
          {recentPayments.length === 0 ? (
            <li className="px-5 py-10 text-center text-sm text-[var(--color-ink-muted)]">
              No payment activity yet.
            </li>
          ) : (
            recentPayments.map((p) => (
              <li key={p.id} className="flex items-center gap-3 px-5 py-3.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--color-surface)] ring-1 ring-[var(--color-border-soft)]">
                  <Receipt className="h-4 w-4 text-[var(--color-ink-muted)]" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-[var(--color-ink)]">
                    {p.paymentMethod ?? "Payment"} · {p.status}
                  </p>
                  <p className="truncate text-xs text-[var(--color-ink-muted)]">
                    {new Date(p.createdAt).toLocaleString()}
                  </p>
                </div>
                <span className="text-sm font-semibold tabular-nums text-[var(--color-ink)]">
                  {formatMoney(p.amount, p.currency)}
                </span>
              </li>
            ))
          )}
        </ul>
      </section>
    </div>
  );
}