import { CheckCircle2, CreditCard, XCircle } from "lucide-react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "../../api/admin";
import { LoadingState } from "../../components/loading-state";
import { ErrorState } from "../../components/error-state";
import { StatusBadge } from "../../components/status-badge";

const currencySymbol: Record<string, string> = { INR: "₹", USD: "$" };

function money(amount: number, currency: string) {
  return `${currencySymbol[currency] ?? currency}${(amount / 100).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function date(value: string) {
  return new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export function AdminPaymentsPage() {
  const { businessId } = useParams<{ businessId: string }>();
  const query = useQuery({ queryKey: ["admin-payments", businessId], queryFn: () => adminApi.payments(businessId!), enabled: Boolean(businessId) });

  if (!businessId) return <ErrorState description="A valid business context is required." />;
  if (query.isLoading) return <LoadingState message="Loading payments..." />;
  if (query.isError) return <ErrorState description="We couldn't load the payments." retryAction={() => query.refetch()} />;

  const payments = query.data?.data ?? [];

  return (
    <div className="space-y-8">
      <header><p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">Payments</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-gray-900">Payment activity</h1><p className="mt-2 text-sm text-gray-500">Successful and failed payment attempts across the business.</p></header>

      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-6 py-5"><h2 className="font-semibold text-gray-900">Payment attempts</h2><p className="mt-1 text-sm text-gray-500">{payments.length} payments on this page</p></div>

        {payments.length === 0 ? (
          <div className="py-16 text-center"><CreditCard className="mx-auto h-10 w-10 text-gray-300" /><p className="mt-4 font-semibold">No payment activity</p><p className="mt-1 text-sm text-gray-500">Payment attempts will appear here.</p></div>
        ) : (
          <div className="divide-y">
            {payments.map((payment) => (
              <div key={payment.id} className="flex flex-col gap-4 px-6 py-5 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-4"><div className={`flex h-10 w-10 items-center justify-center rounded-full ${payment.status === "SUCCESS" ? "bg-emerald-50" : "bg-red-50"}`}>{payment.status === "SUCCESS" ? <CheckCircle2 className="h-5 w-5 text-emerald-600" /> : <XCircle className="h-5 w-5 text-red-500" />}</div><div><div className="flex flex-wrap items-center gap-3"><p className="font-medium text-gray-900">{payment.invoice.invoiceNumber}</p><StatusBadge status={payment.status} /></div><p className="mt-1 text-sm text-gray-500">{payment.invoice.customerProfile.user.email} · {payment.paymentMethod} · {date(payment.createdAt)}</p></div></div>
                <div className="text-left md:text-right"><p className="font-semibold text-gray-900">{money(payment.amount, payment.currency)}</p><p className="mt-1 text-xs text-gray-400">{payment.invoice.subscription?.plan.name ?? "Invoice payment"}</p></div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}