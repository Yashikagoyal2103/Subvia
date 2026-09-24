import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { plansApi, type Plan } from "@/api/plans";
import { servicesApi } from "@/api/services";
import { PageHeader } from "@/components/page-header";
import { PlanCard } from "@/components/catalog/PlanCard";
import { LoadingState } from "@/components/loading-state";
import { ErrorState } from "@/components/error-state";
import { toArray } from "@/lib/api-shape";

export function CustomerPlansPage() {
  const { businessId = "", serviceId = "" } = useParams();
  const enabled = !!businessId && !!serviceId;

  const serviceQ = useQuery({
    queryKey: ["service", businessId, serviceId],
    queryFn: () => servicesApi.getById(businessId, serviceId),
    enabled,
  });
  const plansQ = useQuery({
    queryKey: ["plans", businessId, serviceId],
    queryFn: () => plansApi.list(businessId, serviceId),
    enabled,
  });

  if (!enabled)
    return <ErrorState description="A valid service context is required." />;
  if (serviceQ.isPending || plansQ.isPending)
    return <LoadingState message="Loading plans…" />;
  if (plansQ.isError)
    return (
      <ErrorState
        description="We couldn't load plans for this service."
        retryAction={() => {
          serviceQ.refetch();
          plansQ.refetch();
        }}
      />
    );

  const plans = toArray<Plan>(plansQ.data);
  const service = serviceQ.data;

  return (
    <div className="space-y-8">
      <PageHeader
        title={service ? `${service.name} — Plans` : "Plans"}
        description={
          service?.description ?? "Choose a plan that fits your workspace."
        }
      />

      {plans.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--color-border-soft)] bg-white/60 px-6 py-16 text-center">
          <p className="text-sm font-medium text-[var(--color-ink)]">
            No plans available
          </p>
          <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
            This service doesn&apos;t have any plans published yet.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {plans.map((p) => (
            <PlanCard
              key={p.id}
              plan={p}
              href={`/customer/${businessId}/checkout/${serviceId}/${p.id}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}