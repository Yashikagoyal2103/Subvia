import { useParams, Link } from "react-router-dom";
import { ArrowLeft, AlertCircle, Receipt } from "lucide-react";

import { usePlans } from "../../hooks/usePlans";
import { PlanCard } from "../../components/catalog/PlanCard";
import { Button } from "../../components/ui/button";

// ── Loading skeleton ──────────────────────────────────────────────────────────
function PlanCardSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="absolute inset-x-0 top-0 h-0.5 rounded-t-xl bg-gray-100" />
      <div className="mb-3 h-5 w-1/2 rounded bg-gray-100" />
      <div className="mb-6 h-3 w-full rounded bg-gray-100" />
      <div className="mb-1 h-10 w-28 rounded bg-gray-100" />
      <div className="mb-6 h-3 w-20 rounded bg-gray-100" />
      <div className="h-9 w-full rounded-lg bg-gray-100" />
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export function CustomerPlansPage() {
  const { businessId, serviceId } = useParams<{
    businessId: string;
    serviceId: string;
  }>();

  const { data: plans, isLoading, isError } = usePlans(
    businessId ?? "",
    serviceId ?? "",
  );

  const activePlans = plans?.filter((p) => p.isActive) ?? [];
  const backHref = `/customer/${businessId}/services`;

  // Guard
  if (!businessId || !serviceId) {
    return (
      <div className="flex min-h-[300px] flex-col items-center justify-center rounded-xl border border-gray-200 bg-white p-10 text-center shadow-sm">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 text-amber-600 ring-1 ring-amber-100">
          <AlertCircle className="h-6 w-6" />
        </div>
        <h2 className="text-lg font-semibold text-gray-900">Context missing</h2>
        <p className="mt-2 text-sm text-gray-500">
          A valid business and service are required to view plans.
        </p>
      </div>
    );
  }

  // Loading
  if (isLoading) {
    return (
      <div className="space-y-8">
        <PlansHeader backHref={backHref} />
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="relative">
              <PlanCardSkeleton />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error
  if (isError) {
    return (
      <div className="space-y-6">
        <PlansHeader backHref={backHref} />
        <div className="flex min-h-[280px] flex-col items-center justify-center rounded-xl border border-red-100 bg-red-50/40 p-10 text-center shadow-sm">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
            <AlertCircle className="h-6 w-6" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900">Unable to load plans</h2>
          <p className="mt-2 max-w-sm text-sm text-gray-500">
            We couldn't retrieve the subscription plans. Please reload the page or try again.
          </p>
        </div>
      </div>
    );
  }

  // Empty
  if (!activePlans.length) {
    return (
      <div className="space-y-8">
        <PlansHeader backHref={backHref} />
        <div className="flex min-h-[280px] flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50/50 p-10 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-gray-400">
            <Receipt className="h-7 w-7" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">No plans available</h3>
          <p className="mt-2 max-w-sm text-sm text-gray-500">
            This service doesn't have any active subscription plans yet.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PlansHeader backHref={backHref} count={activePlans.length} />
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {activePlans.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            action={
              <Button
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 border-0 shadow-sm"
              >
                Select plan
              </Button>
            }
          />
        ))}
      </div>
    </div>
  );
}

// ── Header helper ──────────────────────────
function PlansHeader({
  backHref,
  count,
}: {
  backHref: string;
  count?: number;
}) {
  return (
    <div className="space-y-4">
      <Link
        to={backHref}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 transition-colors hover:text-gray-800"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to services
      </Link>

      <div className="flex items-start justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100">
              <Receipt className="h-4 w-4" />
            </div>
            <span className="text-xs font-semibold tracking-widest text-indigo-600 uppercase">
              Plans
            </span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
            Choose a plan
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Select the subscription plan that works best for you.
          </p>
        </div>
        {count !== undefined && (
          <span className="mt-1 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-semibold text-gray-600">
            {count} {count === 1 ? "plan" : "plans"}
          </span>
        )}
      </div>
    </div>
  );
}
