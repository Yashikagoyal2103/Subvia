import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Search, ArrowUpRight } from "lucide-react";

import { catalogApi } from "@/api/catalog";
import { PageHeader } from "@/components/page-header";
import { LoadingState } from "@/components/loading-state";
import { ErrorState } from "@/components/error-state";

export function CustomerServicesPage() {
  const [search, setSearch] = useState("");

  const query = useQuery({
    queryKey: ["customer-catalog", search],
    queryFn: () => catalogApi.list(search ? { search } : undefined),
  });

  if (query.isPending) {
    return <LoadingState message="Loading available services…" />;
  }

  if (query.isError) {
    return (
      <ErrorState
        description="We couldn't load the available services."
        retryAction={() => query.refetch()}
      />
    );
  }

  const businesses = query.data;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Explore"
        description="Discover services and plans available to you."
      />

      <div className="relative max-w-xl">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-ink-subtle)]" />

        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search services…"
          className="w-full rounded-full border border-[var(--color-border-soft)] bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-[var(--color-border-strong)]"
        />
      </div>

      {businesses.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--color-border-soft)] bg-white/60 px-6 py-16 text-center">
          <p className="text-sm font-medium text-[var(--color-ink)]">
            No services found
          </p>
          <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
            Try another search.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {businesses.map((business) => (
            <section key={business.id}>
              <div className="mb-4">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-ink-subtle)]">
                  Provider
                </p>
                <h2 className="mt-1 text-lg font-semibold text-[var(--color-ink)]">
                  {business.name}
                </h2>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {business.services.map((service) => (
                  <Link
                    key={service.id}
                    to={`/customer/services/${service.id}`}
                    className="group rounded-2xl border border-[var(--color-border-soft)] bg-white p-5 shadow-[var(--shadow-soft)] transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-card)]"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-semibold text-[var(--color-ink)]">
                          {service.name}
                        </h3>

                        <p className="mt-2 line-clamp-3 text-sm leading-6 text-[var(--color-ink-muted)]">
                          {service.description ??
                            "Explore available plans for this service."}
                        </p>
                      </div>

                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-surface)] transition group-hover:bg-[var(--color-accent)]">
                        <ArrowUpRight className="h-4 w-4" />
                      </span>
                    </div>

                    <p className="mt-5 text-xs font-semibold text-[var(--color-ink-muted)]">
                      {service.plans.length}{" "}
                      {service.plans.length === 1 ? "plan" : "plans"} available
                    </p>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}