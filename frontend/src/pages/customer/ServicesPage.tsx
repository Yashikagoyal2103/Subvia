import { useParams } from "react-router-dom";
import { Package2, AlertCircle, Layers } from "lucide-react";

import { useServices } from "../../hooks/useServices";
import { ServiceCard } from "../../components/catalog/ServiceCard";

// ── Loading skeleton ──────────────────────────────────────────────────────────
function ServiceCardSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-start justify-between">
        <div className="h-10 w-10 rounded-lg bg-gray-100" />
      </div>
      <div className="mb-2 h-4 w-2/3 rounded bg-gray-100" />
      <div className="h-3 w-full rounded bg-gray-100 mt-2" />
      <div className="h-3 w-5/6 rounded bg-gray-100 mt-2" />
      <div className="mt-5 h-3 w-20 rounded bg-gray-100" />
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export function CustomerServicesPage() {
  const { businessId } = useParams<{ businessId: string }>();

  const { data: services, isLoading, isError } = useServices(businessId ?? "");

  const activeServices = services?.filter((s) => s.isActive) ?? [];

  // Guard: no businessId
  if (!businessId) {
    return (
      <div className="flex min-h-[300px] flex-col items-center justify-center rounded-xl border border-gray-200 bg-white p-10 text-center shadow-sm">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 text-amber-600 ring-1 ring-amber-100">
          <AlertCircle className="h-6 w-6" />
        </div>
        <h2 className="text-lg font-semibold text-gray-900">Business not specified</h2>
        <p className="mt-2 text-sm text-gray-500">
          A business context is required to browse services.
        </p>
      </div>
    );
  }

  // Loading
  if (isLoading) {
    return (
      <div className="space-y-8">
        <CatalogHeader />
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <ServiceCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  // Error
  if (isError) {
    return (
      <div className="flex min-h-[300px] flex-col items-center justify-center rounded-xl border border-red-100 bg-red-50/40 p-10 text-center shadow-sm">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
          <AlertCircle className="h-6 w-6" />
        </div>
        <h2 className="text-lg font-semibold text-gray-900">Unable to load services</h2>
        <p className="mt-2 max-w-sm text-sm text-gray-500">
          We couldn't retrieve the service catalog. Please reload the page or try again later.
        </p>
      </div>
    );
  }

  // Empty
  if (!activeServices.length) {
    return (
      <div className="space-y-8">
        <CatalogHeader />
        <div className="flex min-h-[320px] flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50/50 p-10 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-gray-400">
            <Package2 className="h-7 w-7" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">No services available</h3>
          <p className="mt-2 max-w-sm text-sm text-gray-500">
            This business hasn't published any services yet. Check back later.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <CatalogHeader count={activeServices.length} />
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {activeServices.map((service) => (
          <ServiceCard
            key={service.id}
            service={service}
            href={`/customer/${businessId}/services/${service.id}/plans`}
          />
        ))}
      </div>
    </div>
  );
}

// ── Header helper ─────────────────────────────────────────────────────────────
function CatalogHeader({ count }: { count?: number }) {
  return (
    <div className="flex items-start justify-between">
      <div>
        <div className="mb-2 flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100">
            <Layers className="h-4 w-4" />
          </div>
          <span className="text-xs font-semibold tracking-widest text-indigo-600 uppercase">
            Catalog
          </span>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Explore services</h1>
        <p className="mt-1 text-sm text-gray-500">
          Choose a service to view its available subscription plans.
        </p>
      </div>
      {count !== undefined && (
        <span className="mt-1 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-semibold text-gray-600">
          {count} {count === 1 ? "service" : "services"}
        </span>
      )}
    </div>
  );
}