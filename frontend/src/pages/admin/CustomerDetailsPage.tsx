import { ArrowLeft, FileText, Mail, Users } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "../../api/admin";
import { LoadingState } from "../../components/loading-state";
import { ErrorState } from "../../components/error-state";

function date(value: string) {
  return new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export function AdminCustomerDetailsPage() {
  const { businessId, customerId } = useParams<{ businessId: string; customerId: string }>();
  const query = useQuery({ queryKey: ["admin-customer", businessId, customerId], queryFn: () => adminApi.customer(businessId!, customerId!), enabled: Boolean(businessId && customerId) });

  if (!businessId || !customerId) return <ErrorState description="Customer context is missing." />;
  if (query.isLoading) return <LoadingState message="Loading customer..." />;
  if (query.isError || !query.data) return <ErrorState description="We couldn't load this customer." retryAction={() => query.refetch()} />;

  const customer = query.data;

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <Link to={`/admin/${businessId}/customers`} className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900"><ArrowLeft className="h-4 w-4" />Back to customers</Link>

      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">Customer</p>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-indigo-50 text-sm font-semibold text-indigo-700">{customer.user.email.slice(0, 1).toUpperCase()}</div>
          <div><h1 className="text-3xl font-semibold tracking-tight text-gray-900">{customer.user.email}</h1><p className="mt-1 text-sm text-gray-500">Customer since {date(customer.createdAt)}</p></div>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        <InfoCard icon={<Mail className="h-5 w-5" />} label="Email" value={customer.user.email} />
        <InfoCard icon={<Users className="h-5 w-5" />} label="Subscriptions" value={String(customer._count.subscriptions)} />
        <InfoCard icon={<FileText className="h-5 w-5" />} label="Invoices" value={String(customer._count.invoices)} />
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="font-semibold text-gray-900">Customer profile</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Detail label="Customer ID" value={customer.id} />
          <Detail label="User ID" value={customer.userId} />
          <Detail label="Created" value={date(customer.createdAt)} />
          <Detail label="Credit ledger entries" value={String(customer._count.creditLedger)} />
        </div>
      </section>
    </div>
  );
}

function InfoCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">{icon}</div><p className="mt-4 text-xs text-gray-400">{label}</p><p className="mt-1 truncate text-lg font-semibold text-gray-900">{value}</p></div>;
}

function Detail({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl bg-gray-50 p-4"><p className="text-xs text-gray-400">{label}</p><p className="mt-1 break-all text-sm font-medium text-gray-800">{value}</p></div>;
}