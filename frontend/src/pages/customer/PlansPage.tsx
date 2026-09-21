import { useParams, Link } from "react-router-dom";
import { ArrowLeft, AlertCircle, Receipt, CheckCircle2 } from "lucide-react";

import { usePlans } from "../../hooks/usePlans";
import { Button } from "../../components/ui/button";

const symbols: Record<string, string> = { INR: "₹", USD: "$" };
const money = (amount: number, currency: string) => `${symbols[currency] ?? currency}${(amount / 100).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function PlanCard({ plan, action }: { plan: any; action: React.ReactNode }) {
  return (
    <div className="premium-card relative overflow-hidden flex flex-col h-full bg-white">
      {/* Decorative top border */}
      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-indigo-500 to-violet-500" />
      
      <div className="p-8 flex-1 flex flex-col">
        <h3 className="text-2xl font-semibold text-slate-900">{plan.name}</h3>
        <p className="mt-3 text-sm leading-6 text-slate-500 min-h-[48px]">{plan.description || "No description provided."}</p>
        
        <div className="my-8 flex items-end gap-1">
          <span className="text-5xl font-bold tracking-tight text-slate-900">
            {money(plan.price, plan.currency)}
          </span>
          <span className="text-sm font-medium text-slate-500 mb-1.5 uppercase tracking-wider">
            /{plan.interval === "MONTHLY" ? "mo" : "yr"}
          </span>
        </div>

        <div className="mt-auto pt-6">
          {action}
        </div>
      </div>
    </div>
  );
}

function PlanCardSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-slate-200 bg-white p-8 h-[380px] flex flex-col">
      <div className="mb-4 h-8 w-1/2 rounded bg-slate-100" />
      <div className="mb-8 h-4 w-full rounded bg-slate-100" />
      <div className="mb-8 h-12 w-32 rounded bg-slate-100" />
      <div className="mt-auto h-12 w-full rounded-xl bg-slate-100" />
    </div>
  );
}

export function CustomerPlansPage() {
  const { businessId, serviceId } = useParams<{ businessId: string; serviceId: string }>();
  const { data: plans, isLoading, isError } = usePlans(businessId ?? "", serviceId ?? "");

  const activePlans = plans?.filter((p) => p.isActive) ?? [];
  const backHref = `/customer/${businessId}/services`;

  if (!businessId || !serviceId) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center rounded-[32px] border border-slate-200 bg-white/50 p-10 text-center shadow-sm">
        <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 text-amber-600 ring-1 ring-amber-100">
          <AlertCircle className="h-7 w-7" />
        </div>
        <h2 className="text-xl font-semibold text-slate-900 mb-2">Context missing</h2>
        <p className="text-sm text-slate-500">A valid business and service are required to view plans.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-10 pb-12 animate-fade-in">
        <PlansHeader backHref={backHref} />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
          {Array.from({ length: 3 }).map((_, index) => <PlanCardSkeleton key={index} />)}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-10 pb-12 animate-fade-in">
        <PlansHeader backHref={backHref} />
        <div className="flex min-h-[300px] flex-col items-center justify-center rounded-[32px] border border-red-100 bg-red-50/40 p-10 text-center shadow-sm max-w-4xl mx-auto">
          <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-600">
            <AlertCircle className="h-7 w-7" />
          </div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Unable to load plans</h2>
          <p className="max-w-sm text-sm text-slate-500">We couldn't retrieve the subscription plans. Please reload the page.</p>
        </div>
      </div>
    );
  }

  if (!activePlans.length) {
    return (
      <div className="space-y-10 pb-12 animate-fade-in">
        <PlansHeader backHref={backHref} />
        <div className="flex min-h-[300px] flex-col items-center justify-center rounded-[32px] border border-dashed border-slate-300 bg-slate-50/50 p-10 text-center max-w-4xl mx-auto">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
            <Receipt className="h-8 w-8" />
          </div>
          <h3 className="text-xl font-semibold text-slate-900 mb-2">No plans available</h3>
          <p className="max-w-sm text-sm text-slate-500">This service doesn't have any active subscription plans yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-12 animate-fade-in">
      <PlansHeader backHref={backHref} count={activePlans.length} />

      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 max-w-7xl mx-auto items-center">
        {activePlans.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            action={
              <Link to={`/customer/${businessId}/checkout/${serviceId}/${plan.id}`} className="block">
                <Button className="w-full h-12 text-sm font-semibold rounded-xl bg-slate-900 text-white shadow-md hover:bg-indigo-600 hover:shadow-lg transition-all duration-300">
                  Select {plan.name}
                </Button>
              </Link>
            }
          />
        ))}
      </div>
    </div>
  );
}

function PlansHeader({ backHref, count }: { backHref: string; count?: number }) {
  return (
    <div className="max-w-4xl mx-auto text-center pt-6">
      <Link
        to={backHref}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 transition-colors hover:text-indigo-800 mb-8"
      >
        <ArrowLeft className="h-4 w-4" />
        Return to services
      </Link>

      <div>
        <h1 className="text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl mb-6">
          Choose your <span className="text-gradient">plan</span>.
        </h1>
        <p className="max-w-xl mx-auto text-lg text-slate-500 leading-relaxed">
          Simple, transparent pricing. Select the subscription plan that works best for your current operations.
        </p>
      </div>

      {count !== undefined && (
        <div className="mt-8 flex justify-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-slate-600 shadow-sm">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            {count} {count === 1 ? "plan available" : "plans available"}
          </span>
        </div>
      )}
    </div>
  );
}
