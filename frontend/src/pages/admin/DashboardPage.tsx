import { Building2, Package2, Settings2, ArrowRight } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { businessesApi } from "../../api/businesses";
import { servicesApi } from "../../api/services";
import { LoadingState } from "../../components/loading-state";
import { ErrorState } from "../../components/error-state";

export function AdminDashboardPage() {
  const { businessId } = useParams<{ businessId: string }>();

  const businessQuery = useQuery({
    queryKey: ["business", businessId],
    queryFn: () => businessesApi.getById(businessId!),
    enabled: Boolean(businessId),
  });

  const servicesQuery = useQuery({
    queryKey: ["services", businessId],
    queryFn: () => servicesApi.list(businessId!),
    enabled: Boolean(businessId),
  });

  if (!businessId) return <ErrorState description="A valid business context is required." />;

  if (businessQuery.isLoading || servicesQuery.isLoading) {
    return <LoadingState message="Loading business overview..." />;
  }

  if (businessQuery.isError || servicesQuery.isError || !businessQuery.data) {
    return <ErrorState description="We couldn't load the business overview." retryAction={() => { void businessQuery.refetch(); void servicesQuery.refetch(); }} />;
  }

  const business = businessQuery.data;
  const services = servicesQuery.data ?? [];
  const activeServices = services.filter(service => service.isActive).length;

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">Business Admin</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-gray-900">{business.name}</h1>
        <p className="mt-2 text-sm text-gray-500">Manage your recurring products, pricing and billing workspace.</p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard icon={<Building2 className="h-5 w-5" />} label="Business" value={business.name} />
        <StatCard icon={<Package2 className="h-5 w-5" />} label="Services" value={services.length} />
        <StatCard icon={<Settings2 className="h-5 w-5" />} label="Active services" value={activeServices} />
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-600">Workspace</p>
            <h2 className="mt-2 text-lg font-semibold text-gray-900">Catalog management</h2>
            <p className="mt-1 text-sm text-gray-500">Manage the services and plans your business offers.</p>
          </div>
          <Link to={`/admin/${businessId}/services`} className="text-sm font-medium text-indigo-600 hover:text-indigo-700">Manage catalog</Link>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <QuickLink href={`/admin/${businessId}/services`} title="Services" description="Create and manage recurring products." />
          <QuickLink href={`/admin/${businessId}/plans`} title="Plans" description="Configure pricing and billing intervals." />
        </div>
      </section>

      <section className="rounded-2xl border border-amber-100 bg-amber-50/50 p-5">
        <p className="text-sm font-semibold text-amber-900">Billing visibility</p>
        <p className="mt-1 text-sm text-amber-800">Customer, subscription, invoice and payment inspection will use dedicated admin read APIs so the dashboard never mixes customer-scoped data with business-wide data.</p>
      </section>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">{icon}</div><p className="mt-5 text-sm text-gray-500">{label}</p><p className="mt-1 truncate text-xl font-semibold text-gray-900">{value}</p></div>;
}

function QuickLink({ href, title, description }: { href: string; title: string; description: string }) {
  return <Link to={href} className="group flex items-center justify-between rounded-xl border border-gray-200 p-4 transition hover:border-indigo-200 hover:bg-indigo-50/40"><div><p className="font-medium text-gray-900">{title}</p><p className="mt-1 text-sm text-gray-500">{description}</p></div><ArrowRight className="h-4 w-4 text-gray-300 transition group-hover:translate-x-1 group-hover:text-indigo-500" /></Link>;
}