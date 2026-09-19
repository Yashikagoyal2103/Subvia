import { ArrowLeft, CalendarDays, CreditCard, History } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "../../api/admin";
import { LoadingState } from "../../components/loading-state";
import { ErrorState } from "../../components/error-state";
import { StatusBadge } from "../../components/status-badge";

const currencySymbol: Record<string, string> = { INR: "₹", USD: "$" };

function money(amount: number, currency: string) {
  return `${currencySymbol[currency] ?? currency}${(amount / 100).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function date(value: string) {
  return new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export function AdminSubscriptionDetailsPage() {
  const { businessId, subscriptionId } = useParams<{ businessId: string; subscriptionId: string }>();
  const query = useQuery({ queryKey: ["admin-subscription", businessId, subscriptionId], queryFn: () => adminApi.subscription(businessId!, subscriptionId!), enabled: Boolean(businessId && subscriptionId) });

  if (!businessId || !subscriptionId) return <ErrorState description="Subscription context is missing." />;
  if (query.isLoading) return <LoadingState message="Loading subscription..." />;
  if (query.isError || !query.data) return <ErrorState description="We couldn't load this subscription." retryAction={() => query.refetch()} />;

  const subscription = query.data;

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <Link to={`/admin/${businessId}/subscriptions`} className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900"><ArrowLeft className="h-4 w-4" />Back to subscriptions</Link>

      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">Subscription</p>
        <div className="mt-2 flex flex-wrap items-center gap-3"><h1 className="text-3xl font-semibold tracking-tight text-gray-900">{subscription.plan.name}</h1><StatusBadge status={subscription.status} /></div>
        <p className="mt-2 text-sm text-gray-500">{subscription.plan.service.name} · {subscription.customerProfile.user.email}</p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <InfoCard icon={<CreditCard className="h-5 w-5" />} label="Billing price" value={money(subscription.price, subscription.currency)} />
        <InfoCard icon={<CalendarDays className="h-5 w-5" />} label="Interval" value={subscription.billingInterval} />
        <InfoCard icon={<CalendarDays className="h-5 w-5" />} label="Current period" value={date(subscription.billingPeriodEnd)} />
        <InfoCard icon={<History className="h-5 w-5" />} label="Events" value={String(subscription._count.events)} />
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="font-semibold text-gray-900">Subscription details</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <Detail label="Customer" value={subscription.customerProfile.user.email} />
          <Detail label="Service" value={subscription.plan.service.name} />
          <Detail label="Current plan" value={subscription.plan.name} />
          <Detail label="Status" value={subscription.status} />
          <Detail label="Period start" value={date(subscription.billingPeriodStart)} />
          <Detail label="Period end" value={date(subscription.billingPeriodEnd)} />
          <Detail label="Cancellation" value={subscription.cancelAtPeriodEnd ? "Scheduled at period end" : "Not scheduled"} />
          <Detail label="Pending plan" value={subscription.pendingPlan?.name ?? "None"} />
        </div>
      </section>
    </div>
  );
}

function InfoCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">{icon}</div><p className="mt-4 text-xs text-gray-400">{label}</p><p className="mt-1 font-semibold text-gray-900">{value}</p></div>;
}

function Detail({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl bg-gray-50 p-4"><p className="text-xs text-gray-400">{label}</p><p className="mt-1 text-sm font-medium text-gray-800">{value}</p></div>;
}