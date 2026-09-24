import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";

import { catalogApi } from "@/api/catalog";
import { PlanCard } from "@/components/catalog/PlanCard";
import { LoadingState } from "@/components/loading-state";
import { ErrorState } from "@/components/error-state";

export function ServiceDetailsPage() {
  const { serviceId = "" } = useParams();

  const query = useQuery({
    queryKey: ["customer-service", serviceId],
    queryFn: async () => {
      const catalog = await catalogApi.list();

      return (
        catalog
          .flatMap((business) =>
            business.services.map((service) => ({
              business,
              service,
            })),
          )
          .find(({ service }) => service.id === serviceId) ?? null
      );
    },
    enabled: Boolean(serviceId),
  });

  if (!serviceId) {
    return <ErrorState description="Service context is missing." />;
  }

  if (query.isPending) {
    return <LoadingState message="Loading service…" />;
  }

  if (query.isError || !query.data) {
    return (
      <ErrorState
        description="We couldn't find this service."
        retryAction={() => query.refetch()}
      />
    );
  }

  const { business, service } = query.data;

  return (
    <div className="space-y-8">
      <Link
        to="/customer/explore"
        className="inline-flex items-center gap-2 text-sm font-medium text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Explore
      </Link>

      <header className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-ink-subtle)]">
          {business.name}
        </p>

        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[var(--color-ink)]">
          {service.name}
        </h1>

        <p className="mt-3 text-base leading-7 text-[var(--color-ink-muted)]">
          {service.description ?? "Choose a plan that fits your needs."}
        </p>
      </header>

      <section>
        <div className="mb-5">
          <h2 className="text-xl font-semibold text-[var(--color-ink)]">
            Choose a plan
          </h2>

          <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
            Select the plan that works best for you.
          </p>
        </div>

        {service.plans.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[var(--color-border-soft)] bg-white/60 px-6 py-14 text-center">
            <p className="text-sm font-medium text-[var(--color-ink)]">
              No plans available
            </p>

            <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
              This service does not currently have any active plans.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {service.plans.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                href={`/customer/checkout/${plan.id}`}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}