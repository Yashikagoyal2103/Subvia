import { ArrowLeft, CalendarDays, CreditCard, FileText } from "lucide-react";
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

function date(value: string | null) {
  return value ? new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";
}

export function AdminInvoiceDetailsPage() {
  const { businessId, invoiceId } = useParams<{ businessId: string; invoiceId: string }>();
  const query = useQuery({ queryKey: ["admin-invoice", businessId, invoiceId], queryFn: () => adminApi.invoice(businessId!, invoiceId!), enabled: Boolean(businessId && invoiceId) });

  if (!businessId || !invoiceId) return <ErrorState description="Invoice context is missing." />;
  if (query.isLoading) return <LoadingState message="Loading invoice..." />;
  if (query.isError || !query.data) return <ErrorState description="We couldn't load this invoice." retryAction={() => query.refetch()} />;

  const invoice = query.data;

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <Link to={`/admin/${businessId}/invoices`} className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900"><ArrowLeft className="h-4 w-4" />Back to invoices</Link>

      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">Invoice</p>
        <div className="mt-2 flex flex-wrap items-center gap-3"><h1 className="text-3xl font-semibold tracking-tight text-gray-900">{invoice.invoiceNumber}</h1><StatusBadge status={invoice.status} /></div>
        <p className="mt-2 text-sm text-gray-500">{invoice.customerProfile.user.email}</p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <InfoCard icon={<FileText className="h-5 w-5" />} label="Subtotal" value={money(invoice.subtotal, invoice.currency)} />
        <InfoCard icon={<CalendarDays className="h-5 w-5" />} label="Tax" value={`${invoice.taxRate}% · ${money(invoice.taxAmount, invoice.currency)}`} />
        <InfoCard icon={<CreditCard className="h-5 w-5" />} label="Total" value={money(invoice.total, invoice.currency)} />
        <InfoCard icon={<CalendarDays className="h-5 w-5" />} label="Issued" value={date(invoice.issuedAt)} />
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-6 py-5"><h2 className="font-semibold text-gray-900">Invoice items</h2><p className="mt-1 text-sm text-gray-500">Immutable billing lines recorded for this invoice.</p></div>
        <div className="divide-y">
          {invoice.items.map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-5 px-6 py-4"><div><p className="font-medium text-gray-900">{item.description}</p><p className="mt-1 text-xs text-gray-400">{item.quantity} × {money(item.unitPrice, invoice.currency)}</p></div><p className="font-semibold text-gray-900">{money(item.amount, invoice.currency)}</p></div>
          ))}
        </div>
        <div className="border-t bg-gray-50/60 px-6 py-5">
          <div className="ml-auto max-w-xs space-y-2 text-sm"><Summary label="Subtotal" value={money(invoice.subtotal, invoice.currency)} /><Summary label={`Tax (${invoice.taxRate}%)`} value={money(invoice.taxAmount, invoice.currency)} /><div className="flex justify-between border-t pt-3 text-base font-semibold"><span>Total</span><span>{money(invoice.total, invoice.currency)}</span></div></div>
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="font-semibold text-gray-900">Payment attempts</h2>
        <div className="mt-5 space-y-3">
          {invoice.payments.length === 0 ? <p className="text-sm text-gray-500">No payment attempts recorded.</p> : invoice.payments.map((payment) => (
            <div key={payment.id} className="flex flex-col gap-2 rounded-xl border border-gray-100 p-4 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex flex-wrap items-center gap-3"><span className="font-medium">{payment.paymentMethod}</span><StatusBadge status={payment.status} /></div><p className="mt-1 text-xs text-gray-400">{date(payment.createdAt)}</p></div><p className="font-semibold">{money(payment.amount, payment.currency)}</p></div>
          ))}
        </div>
      </section>
    </div>
  );
}

function InfoCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">{icon}</div><p className="mt-4 text-xs text-gray-400">{label}</p><p className="mt-1 font-semibold text-gray-900">{value}</p></div>;
}

function Summary({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between text-gray-600"><span>{label}</span><span className="font-medium text-gray-900">{value}</span></div>;
}