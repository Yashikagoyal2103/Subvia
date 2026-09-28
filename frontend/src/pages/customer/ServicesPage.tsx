
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { ArrowUpRight, Search, X } from "lucide-react";

import { catalogApi, type CatalogBusiness, type CatalogService } from "@/api/catalog";
import type { BillingInterval, Currency } from "@/api/plans";
import { formatMoney } from "@/lib/format";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

import { CustomerPageHeader } from "@/components/customer/CustomerPageHeader";
import { GlassPanel } from "@/components/customer/GlassPanel";
import { ServiceAvatar } from "@/components/customer/ServiceAvatar";
import { Skeleton } from "@/components/customer/Skeleton";
import { CustomerErrorState } from "@/components/customer/CustomerErrorState";

interface FromPrice {
  amount: number;
  currency: string;
  interval: "MONTHLY" | "YEARLY";
}

function computeFromPrice(service: CatalogService): FromPrice | null {
  if (service.plans.length === 0) return null;

  const currencies = new Set(service.plans.map((p) => p.currency));
  if (currencies.size !== 1) return null;

  const intervals = new Set(service.plans.map((p) => p.interval));
  if (intervals.size !== 1) return null;

  const cheapest = service.plans.reduce(
    (min, p) => (p.price < min.price ? p : min),
    service.plans[0],
  );

  return {
    amount: cheapest.price,
    currency: cheapest.currency,
    interval: cheapest.interval,
  };
}

export function CustomerServicesPage() {
  const [search, setSearch] = useState("");
  const [currency, setCurrency] = useState<Currency | "ALL">("ALL");
  const [interval, setInterval] = useState<BillingInterval | "ALL">("ALL");
  const debounced = useDebouncedValue(search, 300);

  const query = useQuery({
    queryKey: ["customer-catalog", debounced, currency, interval],
    queryFn: () =>
      catalogApi.list({
        ...(debounced ? { search: debounced } : {}),
        ...(currency !== "ALL" ? { currency } : {}),
        ...(interval !== "ALL" ? { interval } : {}),
      }),
    placeholderData: keepPreviousData,
  });

  const businesses: CatalogBusiness[] = useMemo(
    () => query.data ?? [],
    [query.data],
  );

  const hasResults = businesses.some((b) => b.services.length > 0);

  return (
    <div className="space-y-8">
      <CustomerPageHeader
        eyebrow="Catalog"
        title="Explore"
        description="Discover services and plans available to you."
      />

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative max-w-xl flex-1">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-ink-subtle)]" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search services…"
          className="glass h-12 w-full rounded-full pl-11 pr-11 text-sm text-[var(--color-ink)] outline-none placeholder:text-[var(--color-ink-subtle)] focus:ring-2 focus:ring-[var(--color-charcoal)]/20"
        />
        {search ? (
          <button
            type="button"
            onClick={() => setSearch("")}
            aria-label="Clear search"
            className="absolute right-4 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-[var(--color-ink-muted)] transition hover:bg-white/70 hover:text-[var(--color-ink)]"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <FilterSelect label="Currency" value={currency} onChange={(value) => setCurrency(value as Currency | "ALL")} options={[
            ["ALL", "All currencies"],
            ["INR", "INR"],
            ["USD", "USD"],
          ]} />
          <FilterSelect label="Billing" value={interval} onChange={(value) => setInterval(value as BillingInterval | "ALL")} options={[
            ["ALL", "All intervals"],
            ["MONTHLY", "Monthly"],
            ["YEARLY", "Yearly"],
          ]} />
        </div>
      </div>

      {query.isError ? (
        <CustomerErrorState
          description="We couldn't load the available services."
          retryAction={() => query.refetch()}
        />
      ) : null}

      {query.isPending ? (
        <div className="space-y-8">
          {[0, 1].map((g) => (
            <div key={g} className="space-y-4">
              <Skeleton className="h-10 w-56" />
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[0, 1, 2].map((i) => (
                  <Skeleton key={i} className="h-48 rounded-3xl" />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {!query.isPending && !query.isError && !hasResults ? (
        <GlassPanel className="px-6 py-14 text-center">
          <p className="text-sm font-semibold text-[var(--color-ink)]">
            No services match &ldquo;{debounced}&rdquo;
          </p>
          <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
            Try a different keyword.
          </p>
          {debounced ? (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-[var(--color-charcoal)] px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
            >
              Clear search
            </button>
          ) : null}
        </GlassPanel>
      ) : null}

      {!query.isPending && !query.isError && hasResults ? (
        <div className="space-y-8">
          {businesses.map((business) => (
            <section key={business.id}>
              <div className="mb-4 flex items-center gap-3">
                <ServiceAvatar name={business.name} size="md" />
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-ink-subtle)]">
                    Provider
                  </p>
                  <h2 className="mt-0.5 text-base font-semibold tracking-tight text-[var(--color-ink)]">
                    {business.name}{" "}
                    <span className="text-sm font-normal text-[var(--color-ink-muted)]">
                      · {business.services.length}{" "}
                      {business.services.length === 1 ? "service" : "services"}
                    </span>
                  </h2>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {business.services.map((service) => {
                  const fromPrice = computeFromPrice(service);
                  return (
                    <Link
                      key={service.id}
                      to={`/customer/services/${service.id}`}
                      className="glass group relative flex flex-col justify-between overflow-hidden rounded-3xl p-5 transition hover:-translate-y-0.5"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-3">
                          <ServiceAvatar name={service.name} size="md" />
                          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/70 text-[var(--color-ink)] transition group-hover:bg-[var(--color-charcoal)] group-hover:text-white">
                            <ArrowUpRight className="h-3.5 w-3.5" />
                          </span>
                        </div>

                        <h3 className="font-display mt-4 text-lg font-semibold tracking-tight text-[var(--color-ink)]">
                          {service.name}
                        </h3>

                        <p className="mt-1.5 line-clamp-2 text-sm leading-6 text-[var(--color-ink-muted)]">
                          {service.description ?? "Explore available plans for this service."}
                        </p>
                      </div>

                      <div className="mt-5 flex items-end justify-between gap-3 border-t border-[rgba(20,22,26,0.06)] pt-4">
                        <p className="text-xs font-medium text-[var(--color-ink-muted)]">
                          {service.plans.length}{" "}
                          {service.plans.length === 1 ? "plan" : "plans"} available
                        </p>
                        {fromPrice ? (
                          <p className="text-right text-xs">
                            <span className="text-[var(--color-ink-subtle)]">from </span>
                            <span className="font-semibold text-[var(--color-ink)]">
                              {formatMoney(fromPrice.amount, fromPrice.currency)}
                            </span>
                            <span className="text-[var(--color-ink-subtle)]">
                              /{fromPrice.interval === "MONTHLY" ? "mo" : "yr"}
                            </span>
                          </p>
                        ) : null}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      ) : null}
    </div>
  );
}


function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: [string, string][];
}) {
  return (
    <label className="flex items-center gap-2 rounded-full border border-[rgba(20,22,26,0.08)] bg-white/60 px-3.5 py-2 backdrop-blur">
      <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-ink-subtle)]">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="bg-transparent text-xs font-semibold text-[var(--color-ink)] outline-none"
      >
        {options.map(([optionValue, optionLabel]) => (
          <option key={optionValue} value={optionValue}>
            {optionLabel}
          </option>
        ))}
      </select>
    </label>
  );
}
