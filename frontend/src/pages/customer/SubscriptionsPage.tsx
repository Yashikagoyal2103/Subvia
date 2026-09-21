import type { ReactNode } from "react";
import { Package, ArrowUpRight, AlertCircle, Calendar } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { subscriptionsApi } from "../../api/subscriptions";
import { StatusBadge } from "../../components/status-badge";
import { LoadingState } from "../../components/loading-state";
import { ErrorState } from "../../components/error-state";

const symbols: Record<string, string> = { INR: "₹", USD: "$" };
const money = (amount: number, currency: string) => `${symbols[currency] ?? currency}${(amount / 100).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const date = (value: string | null | undefined) => value ? new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "-";

export function CustomerSubscriptionsPage() {
  const { businessId } = useParams<{ businessId: string }>();

  const { data: subscriptions, isLoading, isError, refetch } = useQuery({
    queryKey: ["subscriptions", businessId],
    queryFn: () => subscriptionsApi.list(businessId!),
    enabled: Boolean(businessId),
  });

  if (!businessId) return <ErrorState description="A valid business context is required." />;
  if (isLoading) return <LoadingState message="Loading your subscriptions..." />;
  if (isError) return <ErrorState description="We couldn't load your subscriptions." retryAction={() => { void refetch(); }} />;

  const hasSubscriptions = subscriptions && subscriptions.length > 0;

  return (
    <div className="space-y-10 pb-12 animate-fade-in">
      <header className="flex flex-col gap-6 md:flex-row md:items-end justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">Subscriptions</h1>
          <p className="mt-2 max-w-2xl text-base text-slate-500">Manage your active plans, scheduled changes, and billing cycles.</p>
        </div>
        <Link to={`/customer/${businessId}/services`} className="inline-flex w-fit items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-indigo-600">
          Browse new services <ArrowUpRight className="h-4 w-4" />
        </Link>
      </header>

      {!hasSubscriptions ? (
        <div className="flex min-h-[400px] flex-col items-center justify-center rounded-[32px] border border-dashed border-slate-300 bg-white/50 p-10 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 mb-6">
            <Package className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">No subscriptions found</h2>
          <p className="max-w-sm text-sm text-slate-500 mb-6">You aren't subscribed to any services yet. Explore the catalog to get started.</p>
          <Link to={`/customer/${businessId}/services`} className="text-sm font-semibold text-indigo-600 hover:text-indigo-800">
            Explore services &rarr;
          </Link>
        </div>
      ) : (
        <div className="grid gap-6">
          {subscriptions.map((subscription) => (
            <SubscriptionRow key={subscription.id} subscription={subscription} businessId={businessId} />
          ))}
        </div>
      )}
    </div>
  );
}

function SubscriptionRow({ subscription, businessId }: { subscription: any; businessId: string }) {
  const isPendingChange = Boolean(subscription.pendingPlan);
  const isCancelling = subscription.cancelAtPeriodEnd;
  
  return (
    <Link to={`/customer/${businessId}/subscriptions/${subscription.id}`} className="premium-card group block">
      <div className="flex flex-col lg:flex-row lg:items-center p-6 sm:p-8 gap-8">
        
        {/* Core Info */}
        <div className="flex-1">
          <div className="flex items-center gap-4 mb-3">
            <StatusBadge status={subscription.status} />
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-500">{subscription.plan?.service?.name ?? "Service"}</span>
          </div>
          <h3 className="text-2xl font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
            {subscription.plan?.name ?? "Plan"}
          </h3>
          <div className="mt-4 flex items-baseline gap-1">
            <span className="text-3xl font-bold tracking-tight text-slate-900">{money(subscription.price, subscription.currency)}</span>
            <span className="text-sm font-medium text-slate-500 uppercase">/{subscription.billingInterval.toLowerCase()}</span>
          </div>
        </div>

        {/* State / Cycle Info */}
        <div className="flex-1 flex flex-col gap-4 border-t lg:border-t-0 lg:border-l border-slate-100 pt-6 lg:pt-0 lg:pl-8">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-slate-50 rounded-lg text-slate-400 mt-0.5"><Calendar className="h-4 w-4" /></div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Current Period</p>
              <p className="text-sm font-medium text-slate-900">{date(subscription.billingPeriodStart)} &rarr; {date(subscription.billingPeriodEnd)}</p>
            </div>
          </div>
          
          {isPendingChange && (
            <div className="flex items-start gap-3">
              <div className="p-2 bg-amber-50 rounded-lg text-amber-500 mt-0.5"><AlertCircle className="h-4 w-4" /></div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-amber-600 mb-1">Scheduled Change</p>
                <p className="text-sm font-medium text-slate-900">{subscription.plan?.name} &rarr; {subscription.pendingPlan?.name}</p>
                <p className="text-xs text-slate-500 mt-0.5">Effective next billing period</p>
              </div>
            </div>
          )}

          {isCancelling && (
            <div className="flex items-start gap-3">
              <div className="p-2 bg-rose-50 rounded-lg text-rose-500 mt-0.5"><AlertCircle className="h-4 w-4" /></div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-rose-600 mb-1">Cancellation Scheduled</p>
                <p className="text-sm font-medium text-slate-900">Access continues until {date(subscription.billingPeriodEnd)}</p>
              </div>
            </div>
          )}
        </div>

        {/* Action arrow */}
        <div className="hidden lg:flex shrink-0 w-12 h-12 rounded-full border border-slate-100 items-center justify-center bg-slate-50 text-slate-400 group-hover:bg-indigo-600 group-hover:border-indigo-600 group-hover:text-white transition-all">
          <ArrowUpRight className="h-5 w-5" />
        </div>
      </div>
    </Link>
  );
}