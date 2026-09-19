import { ArrowLeft, CheckCircle2, FileText, XCircle } from "lucide-react";
import { Link, useParams } from "react-router-dom";
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
  return new Date(value).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function AdminPaymentDetailsPage() {
  const { businessId, paymentId } = useParams<{ businessId: string; paymentId: string }>();
  const query = useQuery({ queryKey: ["admin-payment", businessId, paymentId], queryFn: () => adminApi.payment(businessId!, paymentId!), enabled: Boolean(businessId && paymentId) });

  if (!businessId || !paymentId) return <ErrorState description="Payment context is missing." />;
  if (query.isLoading) return <LoadingState message="Loading payment..." />;
  if (query.isError || !query.data) return <ErrorState description="We couldn't load this payment." retryAction={() => query.refetch()} />;

  const payment = query.data;
  const success = payment.status === "SUCCESS";

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <Link to={`/admin/${businessId}/payments`} className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900"><ArrowLeft className="h-4 w-4" />Back to payments</Link>

      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">Payment</p>
        <div className="mt-3 flex items-center gap-4">
          <div className={`flex h-12 w-12 items-center justify-center rounded-full ${success ? "bg-emerald-50" : "bg-red-50"}`}>{success ? <CheckCircle2 className="h-6 w-6 text-emerald-600" /> : <XCircle className="h-6 w-6 text-red-500" />}</div>
          <div><div className="flex flex-wrap items-center gap-3"><h1 className="text-3xl font-semibold tracking-tight text-gray-900">{money(payment.amount, payment.currency)}</h1><StatusBadge status={payment.status} /></div><p className="mt-1 text-sm text-gray-500">{date(payment.createdAt)}</p></div>
        </div>
      </header>

      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="font-semibold text-gray-900">Payment information</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Detail label="Payment ID" value={payment.id} />
          <Detail label="Invoice" value={payment.invoice.invoiceNumber} />
          <Detail label="Payment method" value={payment.paymentMethod} />
          <Detail label="Currency" value={payment.currency} />
          <Detail label="Customer" value={payment.invoice.customerProfile.user.email} />
          <Detail label="Created" value={date(payment.createdAt)} />
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3"><FileText className="h-5 w-5 text-indigo-600" /><div><h2 className="font-semibold text-gray-900">Related invoice</h2><p className="mt-1 text-sm text-gray-500">{payment.invoice.invoiceNumber}</p></div></div>
        <div className="mt-5 flex flex-wrap items-center justify-between gap-4 rounded-xl bg-gray-50 p-4"><div><p className="text-sm font-medium text-gray-900">Invoice total</p><p className="mt-1 text-xs text-gray-500">{payment.invoice.customerProfile.user.email}</p></div><div className="flex items-center gap-4"><p className="font-semibold">{money(payment.invoice.total, payment.invoice.currency)}</p><Link to={`/admin/${businessId}/invoices/${payment.invoice.id}`} className="rounded-lg border bg-white px-3 py-2 text-sm font-medium hover:bg-gray-50">View invoice</Link></div></div>
      </section>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl bg-gray-50 p-4"><p className="text-xs text-gray-400">{label}</p><p className="mt-1 break-all text-sm font-medium text-gray-800">{value}</p></div>;
}