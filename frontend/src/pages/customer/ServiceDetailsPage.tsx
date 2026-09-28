
import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";

import { catalogApi, type CatalogPlan } from "@/api/catalog";
import { PlanCard } from "@/components/catalog/PlanCard";
import { GlassPanel } from "@/components/customer/GlassPanel";
import { ServiceAvatar } from "@/components/customer/ServiceAvatar";
import { CustomerErrorState } from "@/components/customer/CustomerErrorState";
import { Skeleton } from "@/components/customer/Skeleton";
import { cn } from "@/lib/utils";

type Interval = "MONTHLY" | "YEARLY";

export function ServiceDetailsPage() {
  const { serviceId = "" } = useParams();

  const query = useQuery({
    queryKey: ["customer-service", serviceId],
    queryFn: async () => {
      const catalog = await catalogApi.list();
      return (
        catalog
          .flatMap((business) =>
            business.services.map((service) => ({ business, service })),
          )
          .find(({ service }) => service.id === serviceId) ?? null
      );
    },
    enabled: Boolean(serviceId),
  });

  const plansByInterval = useMemo(() => {
    const source: CatalogPlan[] = query.data?.service.plans ?? [];
    const map = new Map<Interval, CatalogPlan[]>();
    for (const plan of source) {
      const bucket = map.get(plan.interval) ?? [];
      bucket.push(plan);
      map.set(plan.interval, bucket);
    }
    for (const bucket of map.values()) {
      bucket.sort((a, b) => a.price - b.price);
    }
    return map;
  }, [query.data]);

  const hasMonthly = plansByInterval.has("MONTHLY");
  const hasYearly = plansByInterval.has("YEARLY");
  const [selectedInterval, setSelectedInterval] = useState<Interval>("MONTHLY");

  if (!serviceId) {
    return <CustomerErrorState description="Service context is missing." />;
  }

  if (query.isPending) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-24 w-full max-w-2xl" />
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-64 rounded-3xl" />
          ))}
        </div>
      </div>
    );
  }

  if (query.isError || !query.data) {
    return (
      <CustomerErrorState
        description="We couldn't find this service."
        retryAction={() => query.refetch()}
      />
    );
  }

  const { business, service } = query.data;
  const showSegments = hasMonthly && hasYearly;
  const effectiveInterval: Interval = showSegments
    ? selectedInterval
    : hasMonthly
      ? "MONTHLY"
      : "YEARLY";
  const plans = plansByInterval.get(effectiveInterval) ?? [];

  return (
    <div className="space-y-8">
      <Link
        to="/customer/explore"
        className="inline-flex items-center gap-2 text-sm font-medium text-[var(--color-ink-muted)] transition hover:text-[var(--color-ink)]"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Explore
      </Link>

      <header className="animate-fade-up flex items-start gap-4">
        <ServiceAvatar name={service.name} size="lg" />
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-ink-subtle)]">
            {business.name}
          </p>
          <h1 className="font-display mt-1 text-3xl font-semibold tracking-tight text-[var(--color-ink)] sm:text-4xl">
            {service.name}
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--color-ink-muted)]">
            {service.description ?? "Choose a plan that fits your needs."}
          </p>
        </div>
      </header>

      <section>
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-display text-xl font-semibold tracking-tight text-[var(--color-ink)]">
              Available plans
            </h2>
            <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
              Select the plan that works best for you.
            </p>
          </div>

          {showSegments ? (
            <div className="glass inline-flex items-center gap-1 self-start rounded-full p-1 sm:self-auto">
              {(["MONTHLY", "YEARLY"] as const).map((iv) => (
                <button
                  key={iv}
                  type="button"
                  onClick={() => setSelectedInterval(iv)}
                  className={cn(
                    "rounded-full px-4 py-1.5 text-xs font-semibold transition",
                    selectedInterval === iv
                      ? "bg-[var(--color-charcoal)] text-white"
                      : "text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]",
                  )}
                >
                  {iv === "MONTHLY" ? "Monthly" : "Yearly"}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        {plans.length === 0 ? (
          <GlassPanel className="px-6 py-14 text-center">
            <p className="text-sm font-semibold text-[var(--color-ink)]">
              No plans available
            </p>
            <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
              This service does not currently have any active plans.
            </p>
          </GlassPanel>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {plans.map((plan) => (
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
