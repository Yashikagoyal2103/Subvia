import type { ReactNode } from "react";
import { AlertCircle, ArrowUpRight, Layers3, Package2, Sparkles, Server } from "lucide-react";
import { useParams, Link } from "react-router-dom";

import { useServices } from "../../hooks/useServices";

// Using the provided service model
function ServiceCard({ service, href }: { service: any; href: string }) {
  return (
    <Link to={href} className="premium-card group block overflow-hidden h-full">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 to-white opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <div className="relative p-6 h-full flex flex-col">
        <div className="flex items-start justify-between mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100 shadow-sm transition-transform duration-300 group-hover:scale-110">
            <Server className="h-6 w-6" />
          </div>
          {service.isActive && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-600 ring-1 ring-emerald-500/20">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Active
            </span>
          )}
        </div>
        
        <h3 className="text-xl font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">{service.name}</h3>
        <p className="mt-2 text-sm text-slate-500 line-clamp-2 flex-1">{service.description ?? "Cloud service"}</p>
        
        <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs font-semibold text-indigo-600 transition-colors group-hover:text-indigo-800">
            View plans <ArrowUpRight className="inline h-3.5 w-3.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}

function ServiceCardSkeleton() {
  return (
    <div className="h-56 animate-pulse rounded-2xl border border-slate-200 bg-white/70 p-6 flex flex-col">
      <div className="h-12 w-12 rounded-2xl bg-slate-100" />
      <div className="mt-5 h-6 w-1/2 rounded bg-slate-100" />
      <div className="mt-3 h-4 w-full rounded bg-slate-100" />
      <div className="mt-2 h-4 w-4/5 rounded bg-slate-100" />
      <div className="mt-auto pt-5">
        <div className="h-4 w-24 rounded bg-slate-100" />
      </div>
    </div>
  );
}

export function CustomerServicesPage() {
  const { businessId } = useParams<{ businessId: string }>();
  const { data: services, isLoading, isError, refetch } = useServices(businessId ?? "");

  if (!businessId) return <ServiceMessage icon={<AlertCircle />} title="Business not specified" description="A business context is required to browse services." />;

  const activeServices = services?.filter((service) => service.isActive) ?? [];

  if (isLoading) {
    return (
      <div className="space-y-10 pb-12 animate-fade-in">
        <CatalogHeader />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => <ServiceCardSkeleton key={index} />)}
        </div>
      </div>
    );
  }

  if (isError) return <ServiceMessage icon={<AlertCircle />} title="Unable to load services" description="The service catalog could not be retrieved right now." action={{ label: "Try again", onClick: () => void refetch() }} />;

  return (
    <div className="space-y-10 pb-12 animate-fade-in">
      <CatalogHeader count={activeServices.length} />
      
      {activeServices.length === 0 ? (
        <ServiceMessage icon={<Package2 />} title="No services available" description="This business has not published any services yet. Check back later." />
      ) : (
        <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {activeServices.map((service) => (
            <ServiceCard key={service.id} service={service} href={`/customer/${businessId}/services/${service.id}/plans`} />
          ))}
        </section>
      )}
    </div>
  );
}

function CatalogHeader({ count }: { count?: number }) {
  return (
    <header className="relative overflow-hidden rounded-[32px] border border-slate-200/60 bg-white p-8 sm:p-12 shadow-sm">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/80 via-white to-purple-50/50" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-indigo-100/40 to-purple-100/40 blur-3xl rounded-full -translate-y-1/2 translate-x-1/3" />
      
      <div className="relative z-10 max-w-3xl">
        <div className="mb-6 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
            <Layers3 className="h-4 w-4" />
          </div>
          <span className="text-xs font-bold uppercase tracking-widest text-indigo-600">Service Catalog</span>
        </div>
        
        <h1 className="text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl mb-6">
          Find the right <span className="text-gradient">service</span> for your business.
        </h1>
        
        <p className="max-w-xl text-base leading-7 text-slate-500 sm:text-lg">
          Explore the professional services available in this workspace. Choose a product and configure the perfect plan to scale your operations.
        </p>
      </div>

      <div className="absolute bottom-8 right-8 hidden items-center gap-2 rounded-2xl border border-white/80 bg-white/60 backdrop-blur-md px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm sm:flex">
        <Sparkles className="h-4 w-4 text-indigo-500" /> 
        {count ?? "..."} available {count === 1 ? "service" : "services"}
      </div>
    </header>
  );
}

function ServiceMessage({ icon, title, description, action }: { icon: ReactNode; title: string; description: string; action?: { label: string; onClick: () => void } }) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center rounded-[32px] border border-dashed border-slate-300 bg-white/50 p-10 text-center backdrop-blur-sm">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50 text-slate-400 ring-1 ring-slate-200 mb-6 shadow-sm">
        {icon}
      </div>
      <h2 className="text-xl font-semibold text-slate-900 mb-2">{title}</h2>
      <p className="max-w-sm text-sm leading-6 text-slate-500 mb-8">{description}</p>
      {action && (
        <button onClick={action.onClick} className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-600 shadow-md hover:shadow-lg">
          {action.label} <ArrowUpRight className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}