import type { ReactNode } from "react";
import { 
  ArrowUpRight, CheckCircle2, FileText, 
  Package, Receipt, WalletCards, XCircle, TrendingUp,
  Clock
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { invoicesApi } from "../../api/invoices";
import { paymentsApi } from "../../api/payments";
import { subscriptionsApi } from "../../api/subscriptions";
import { creditsApi } from "../../api/credits";
import { StatusBadge } from "../../components/status-badge";
import { LoadingState } from "../../components/loading-state";
import { ErrorState } from "../../components/error-state";
import { cn } from "../../lib/utils";

const symbols: Record<string, string> = { INR: "₹", USD: "$" };
const money = (amount: number, currency: string) => `${symbols[currency] ?? currency}${(amount / 100).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const date = (value: string | null | undefined) => value ? new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "-";

export function CustomerDashboardPage() {
  const { businessId } = useParams<{ businessId: string }>();
  const subscriptionsQuery = useQuery({ queryKey: ["subscriptions", businessId], queryFn: () => subscriptionsApi.list(businessId!), enabled: Boolean(businessId) });
  const invoicesQuery = useQuery({ queryKey: ["invoices", businessId], queryFn: () => invoicesApi.list(businessId!), enabled: Boolean(businessId) });
  const paymentsQuery = useQuery({ queryKey: ["payments", businessId], queryFn: () => paymentsApi.list(businessId!), enabled: Boolean(businessId) });
  const creditsQuery = useQuery({ queryKey: ["credit-balance", businessId], queryFn: () => creditsApi.getBalance(businessId!), enabled: Boolean(businessId) });

  if (!businessId) return <ErrorState description="A valid business context is required." />;
  if ([subscriptionsQuery, invoicesQuery, paymentsQuery, creditsQuery].some((query) => query.isLoading)) return <LoadingState message="Preparing your billing workspace..." />;
  if ([subscriptionsQuery, invoicesQuery, paymentsQuery, creditsQuery].some((query) => query.isError)) return <ErrorState description="We couldn't load your dashboard data." retryAction={() => { void subscriptionsQuery.refetch(); void invoicesQuery.refetch(); void paymentsQuery.refetch(); void creditsQuery.refetch(); }} />;

  const subscriptions = subscriptionsQuery.data ?? [];
  const invoices = invoicesQuery.data?.data ?? [];
  const payments = paymentsQuery.data ?? [];
  const credits = creditsQuery.data ?? { INR: 0, USD: 0 };
  const active = subscriptions.filter((item) => item.status === "ACTIVE");
  const openInvoices = invoices.filter((item) => item.status === "OPEN");
  
  // Outstanding total
  const outstandingInr = openInvoices.filter(i => i.currency === "INR").reduce((acc, curr) => acc + curr.total, 0);

  const recentInvoices = [...invoices].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)).slice(0, 4);
  const recentPayments = [...payments].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)).slice(0, 4);

  return (
    <div className="space-y-10 pb-12 animate-fade-in">
      <header className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20"></span>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Workspace Active</p>
          </div>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">Your billing overview.</h1>
          <p className="mt-2 text-base leading-7 text-slate-500 max-w-xl">Review active plans, invoices and recent payments.</p>
        </div>
        <Link to={`/customer/${businessId}/services`} className="group inline-flex w-fit items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/10 transition-all hover:bg-indigo-600 hover:shadow-indigo-500/25">
          Browse services <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </Link>
      </header>

      {/* Hero Overview */}
      <section className="glass-panel overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 via-white/20 to-purple-50/50 pointer-events-none" />
        <div className="relative p-6 sm:p-10">
          <div className="flex flex-col lg:flex-row gap-10 lg:gap-16 items-start lg:items-center">
            
            <div className="flex-1">
              <div className="flex items-center gap-3 text-indigo-600 mb-4">
                <div className="p-2 bg-indigo-100 rounded-lg"><WalletCards className="h-5 w-5" /></div>
                <h2 className="font-semibold text-sm uppercase tracking-wider">Available credits</h2>
              </div>
              <div className="flex flex-wrap items-baseline gap-6">
                <div>
                  <p className="text-5xl font-semibold tracking-tight text-slate-900">{money(credits.INR, "INR")}</p>
                  <p className="text-sm text-slate-500 mt-1">INR credits</p>
                </div>
                {credits.USD > 0 && (
                  <div>
                    <p className="text-4xl font-semibold tracking-tight text-slate-700">{money(credits.USD, "USD")}</p>
                    <p className="text-sm text-slate-500 mt-1">USD Credits</p>
                  </div>
                )}
              </div>
            </div>

            <div className="hidden lg:block w-px h-24 bg-slate-200/60" />

            <div className="flex-1 grid grid-cols-2 gap-6 sm:gap-10">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Active Subscriptions</p>
                <p className="text-3xl font-semibold text-slate-900">{active.length}</p>
                <Link to={`/customer/${businessId}/subscriptions`} className="text-xs font-semibold text-indigo-600 mt-2 inline-flex items-center hover:text-indigo-800 transition-colors">
                  View all <ArrowUpRight className="h-3 w-3 ml-1" />
                </Link>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Outstanding</p>
                <p className={cn("text-3xl font-semibold", openInvoices.length > 0 ? "text-amber-600" : "text-slate-900")}>
                  {openInvoices.length > 0 ? money(outstandingInr, "INR") : "₹0.00"}
                </p>
                <p className="text-xs text-slate-400 mt-2">{openInvoices.length} open invoice{openInvoices.length !== 1 && 's'}</p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Main Content Grid */}
      <div className="grid gap-8 xl:grid-cols-3">
        
        {/* Left Column: Subscriptions */}
        <div className="xl:col-span-2 space-y-8">
          <section className="surface-panel overflow-hidden">
            <SectionHeader icon={<Package className="text-indigo-500" />} title="Your Subscriptions" actionHref={`/customer/${businessId}/subscriptions`} actionLabel="Manage" />
            
            <div className="p-2">
              {active.length === 0 ? (
                <EmptyState icon={<Package />} title="No active subscriptions" description="Explore the catalog to choose a plan and get started." linkHref={`/customer/${businessId}/services`} linkLabel="Browse catalog" />
              ) : (
                <div className="grid gap-2 sm:grid-cols-2 p-4">
                  {active.map(sub => (
                    <Link key={sub.id} to={`/customer/${businessId}/subscriptions/${sub.id}`} className="premium-card p-5 group">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-500 mb-1">{sub.plan?.service?.name ?? "Service"}</p>
                          <h3 className="font-semibold text-slate-900 text-lg group-hover:text-indigo-600 transition-colors">{sub.plan?.name ?? "Plan"}</h3>
                        </div>
                        <StatusBadge status={sub.status} />
                      </div>
                      <div className="flex items-end justify-between mt-6">
                        <div>
                          <p className="text-2xl font-semibold text-slate-900">{money(sub.price, sub.currency)}</p>
                          <p className="text-xs text-slate-500 capitalize">per {sub.billingInterval.toLowerCase()}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1">Period Ends</p>
                          <p className="text-sm font-medium text-slate-700">{date(sub.billingPeriodEnd)}</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </section>

          <section className="surface-panel overflow-hidden">
            <SectionHeader icon={<FileText className="text-indigo-500" />} title="Recent Invoices" actionHref={`/customer/${businessId}/invoices`} actionLabel="View all" />
            <div className="divide-y divide-slate-100/80">
              {recentInvoices.length === 0 ? (
                <EmptyState icon={<FileText />} title="No invoices yet" description="Billing documents will appear here once generated." />
              ) : (
                recentInvoices.map(invoice => (
                  <Link key={invoice.id} to={`/customer/${businessId}/invoices/${invoice.id}`} className="flex items-center justify-between p-5 sm:px-8 transition-colors hover:bg-slate-50/80 group">
                    <div className="flex items-center gap-4 sm:gap-6">
                      <div className={cn("p-2.5 rounded-xl border", invoice.status === 'PAID' ? "bg-emerald-50 border-emerald-100 text-emerald-600" : "bg-amber-50 border-amber-100 text-amber-600")}>
                        <Receipt className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-mono text-sm font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">{invoice.invoiceNumber}</p>
                        <p className="text-xs text-slate-500 mt-1">{date(invoice.createdAt)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <p className="font-semibold text-slate-900">{money(invoice.total, invoice.currency)}</p>
                      <div className="hidden sm:block"><StatusBadge status={invoice.status} /></div>
                      <ArrowUpRight className="h-4 w-4 text-slate-300 transition-colors group-hover:text-indigo-500 hidden sm:block" />
                    </div>
                  </Link>
                ))
              )}
            </div>
          </section>
        </div>

        {/* Right Column: Billing Activity Timeline */}
        <div className="xl:col-span-1">
          <section className="surface-panel overflow-hidden h-full flex flex-col">
            <SectionHeader icon={<TrendingUp className="text-indigo-500" />} title="Billing Activity" actionHref={`/customer/${businessId}/billing`} actionLabel="History" />
            <div className="p-6 flex-1 bg-gradient-to-b from-white to-slate-50/30">
              {recentPayments.length === 0 ? (
                <EmptyState icon={<Clock />} title="No activity" description="Payment events will be logged here." />
              ) : (
                <div className="relative space-y-6 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-slate-200 before:to-transparent">
                  {recentPayments.map((payment) => (
                    <div key={payment.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                      {/* Timeline Dot */}
                      <div className={cn(
                        "flex items-center justify-center w-10 h-10 rounded-full border-4 border-white shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm relative z-10",
                        payment.status === "SUCCESS" ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600"
                      )}>
                        {payment.status === "SUCCESS" ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                      </div>
                      {/* Content */}
                      <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-slate-100 bg-white shadow-sm transition-shadow hover:shadow-md">
                        <div className="flex justify-between items-start mb-1">
                          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{date(payment.createdAt)}</p>
                          <p className={cn("text-sm font-bold", payment.status === 'SUCCESS' ? "text-slate-900" : "text-rose-600")}>
                            {money(payment.amount, payment.currency)}
                          </p>
                        </div>
                        <p className="text-xs text-slate-500 mt-2">
                          {payment.status === 'SUCCESS' ? "Payment successful" : "Payment failed"} via {payment.paymentMethod}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>

      </div>
    </div>
  );
}

function SectionHeader({ icon, title, actionHref, actionLabel }: { icon: ReactNode; title: string; actionHref: string; actionLabel: string }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-200/60 bg-white/50 px-6 py-5 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50/50 shadow-sm border border-indigo-100/50">
          {icon}
        </div>
        <h2 className="text-lg font-semibold text-slate-900 tracking-tight">{title}</h2>
      </div>
      <Link to={actionHref} className="text-sm font-medium text-indigo-600 transition-colors hover:text-indigo-800 flex items-center gap-1 bg-indigo-50/50 px-3 py-1.5 rounded-lg">
        {actionLabel} <ArrowUpRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}

function EmptyState({ icon, title, description, linkHref, linkLabel }: { icon: ReactNode; title: string; description: string; linkHref?: string; linkLabel?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-400 ring-1 ring-slate-100 mb-4">
        {icon}
      </div>
      <h3 className="text-sm font-semibold text-slate-900 mb-1">{title}</h3>
      <p className="text-xs text-slate-500 max-w-xs mb-5">{description}</p>
      {linkHref && linkLabel && (
        <Link to={linkHref} className="text-xs font-semibold text-white bg-slate-900 px-4 py-2 rounded-lg hover:bg-indigo-600 transition-colors">
          {linkLabel}
        </Link>
      )}
    </div>
  );
}
