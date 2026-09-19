import { Mail, Users } from "lucide-react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "../../api/admin";
import { LoadingState } from "../../components/loading-state";
import { ErrorState } from "../../components/error-state";
import { StatusBadge } from "../../components/status-badge";

function date(value: string) {
  return new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export function AdminCustomersPage() {
  const { businessId } = useParams<{ businessId: string }>();
  const query = useQuery({ queryKey: ["admin-customers", businessId], queryFn: () => adminApi.customers(businessId!), enabled: Boolean(businessId) });

  if (!businessId) return <ErrorState description="A valid business context is required." />;
  if (query.isLoading) return <LoadingState message="Loading customers..." />;
  if (query.isError) return <ErrorState description="We couldn't load the customers." retryAction={() => query.refetch()} />;

  const customers = query.data?.data ?? [];

  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">Business</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-gray-900">Customers</h1>
        <p className="mt-2 text-sm text-gray-500">Customers belonging to this business and their billing footprint.</p>
      </header>

      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
          <div className="flex items-center gap-3"><Users className="h-5 w-5 text-indigo-600" /><div><h2 className="font-semibold text-gray-900">Customer directory</h2><p className="text-sm text-gray-500">{customers.length} customers on this page</p></div></div>
        </div>

        {customers.length === 0 ? (
          <div className="py-16 text-center"><Users className="mx-auto h-10 w-10 text-gray-300" /><p className="mt-4 font-semibold text-gray-900">No customers yet</p><p className="mt-1 text-sm text-gray-500">Customers will appear after they subscribe.</p></div>
        ) : (
          <div className="divide-y">
            {customers.map((customer) => (
              <div key={customer.id} className="flex flex-col gap-4 px-6 py-5 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50 text-sm font-semibold text-indigo-700">{customer.user.email.slice(0, 1).toUpperCase()}</div>
                  <div><p className="font-medium text-gray-900">{customer.user.email}</p><p className="mt-1 text-xs text-gray-400">Joined {date(customer.createdAt)}</p></div>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-sm">
                  <span className="inline-flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 text-gray-600"><Mail className="h-4 w-4" />{customer.user.email}</span>
                  <StatusBadge status={customer._count.subscriptions > 0 ? "ACTIVE" : "PENDING"} />
                  <span className="text-xs text-gray-400">{customer._count.subscriptions} subscriptions · {customer._count.invoices} invoices</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}