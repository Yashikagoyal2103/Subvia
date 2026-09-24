import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { servicesApi, type Service } from "@/api/services";
import { PageHeader } from "@/components/page-header";
import { ServiceCard } from "@/components/catalog/ServiceCard";
import { LoadingState } from "@/components/loading-state";
import { ErrorState } from "@/components/error-state";
import { toArray } from "@/lib/api-shape";

export function CustomerServicesPage() {
  const { businessId = "" } = useParams();
  const hasBusiness = !!businessId;

  const q = useQuery({
    queryKey: ["services", businessId],
    queryFn: () => servicesApi.list(businessId),
    enabled: hasBusiness,
  });

  if (!hasBusiness)
    return <ErrorState description="A valid business context is required." />;
  if (q.isPending) return <LoadingState message="Loading services…" />;
  if (q.isError)
    return (
      <ErrorState
        description="We couldn't load services."
        retryAction={() => q.refetch()}
      />
    );

  const services = toArray<Service>(q.data);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Services"
        description="Browse the services available for your workspace."
      />

      {services.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--color-border-soft)] bg-white/60 px-6 py-16 text-center">
          <p className="text-sm font-medium text-[var(--color-ink)]">
            No services available
          </p>
          <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
            Services will appear here once published.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((s) => (
            <ServiceCard
              key={s.id}
              service={s}
              href={`/customer/${businessId}/services/${s.id}/plans`}
            />
          ))}
        </div>
      )}
    </div>
  );
}