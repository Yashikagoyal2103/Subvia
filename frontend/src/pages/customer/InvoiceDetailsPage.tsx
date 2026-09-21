import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Building2, UserRound, Download, CheckCircle2, Banknote, HelpCircle } from "lucide-react";

import { invoicesApi } from "../../api/invoices";
import { paymentsApi } from "../../api/payments";
import { StatusBadge } from "../../components/status-badge";
import { LoadingState } from "../../components/loading-state";
import { ErrorState } from "../../components/error-state";
import { cn } from "../../lib/utils";

const symbols: Record<string, string> = { INR: "₹", USD: "$" };
const money = (amount: number, currency: string) => `${symbols[currency] ?? currency}${(amount / 100).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const date = (value: string | null | undefined) => value ? new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" }) : "-";

export function CustomerInvoiceDetailsPage() {
  const { businessId, invoiceId } = useParams<{ businessId: string; invoiceId: string }>();

  const invoiceQuery = useQuery({
    queryKey: ["invoice", businessId, invoiceId],
    queryFn: () => invoicesApi.getById(businessId!, invoiceId!),
    enabled: Boolean(businessId && invoiceId),
  });

  const paymentsQuery = useQuery({
    queryKey: ["invoice-payments", businessId, invoiceId],
    queryFn: () => paymentsApi.list(businessId!).then(res => res.filter(p => p.invoiceId === invoiceId)),
    enabled: Boolean(businessId && invoiceId),
  });

  if (!businessId || !invoiceId) return <ErrorState description="Context missing." />;
  if (invoiceQuery.isLoading) return <LoadingState message="Loading document..." />;
  if (invoiceQuery.isError || !invoiceQuery.data) return <ErrorState description="Unable to load invoice." retryAction={() => invoiceQuery.refetch()} />;

  const invoice = invoiceQuery.data;
  const payments = paymentsQuery.data ?? [];
  const items = invoice.items ?? [];

  return (
    <div className="space-y-8 animate-fade-in pb-16 max-w-4xl mx-auto">
      <div className="flex justify-between items-center">
        <Link to={`/customer/${businessId}/invoices`} className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to invoices
        </Link>
        <button className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50">
          <Download className="h-3.5 w-3.5" /> Download PDF
        </button>
      </div>

      {/* Document Container */}
      <div className="bg-white rounded-none sm:rounded-2xl border-y sm:border border-slate-200 shadow-sm overflow-hidden">
        
        {/* Document Header */}
        <div className="p-8 sm:p-12 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-slate-50/50">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <StatusBadge status={invoice.status} className="px-3 py-1 text-sm font-bold shadow-sm" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 mt-4">Invoice</h1>
            <p className="font-mono text-lg text-slate-500 mt-1">{invoice.invoiceNumber}</p>
          </div>
          <div className="text-left md:text-right">
            <p className="text-4xl font-bold text-slate-900">{money(invoice.total, invoice.currency)}</p>
            <p className="text-sm font-medium text-slate-500 mt-1 uppercase tracking-wider">{invoice.currency}</p>
          </div>
        </div>

        {/* Parties */}
        <div className="p-8 sm:p-12 grid sm:grid-cols-2 gap-10">
          <div>
            <div className="flex items-center gap-2 text-slate-400 mb-3">
              <Building2 className="h-4 w-4" />
              <p className="text-xs font-bold uppercase tracking-wider">From</p>
            </div>
            <p className="font-semibold text-slate-900">SaaS Billing Platform</p>
            <p className="text-sm text-slate-500 mt-1 leading-relaxed">
              123 Tech Park, Phase 1<br/>
              Cloud City, CC 400101<br/>
              contact@saasbilling.test
            </p>
          </div>
          <div>
            <div className="flex items-center gap-2 text-slate-400 mb-3">
              <UserRound className="h-4 w-4" />
              <p className="text-xs font-bold uppercase tracking-wider">Billed To</p>
            </div>
            <p className="font-semibold text-slate-900">Workspace {businessId.split('-')[0]}</p>
            <p className="text-sm text-slate-500 mt-1">Customer Profile</p>
          </div>
        </div>

        {/* Meta */}
        <div className="px-8 sm:px-12 py-6 bg-slate-50 grid grid-cols-2 sm:grid-cols-4 gap-6 border-y border-slate-100">
          <div>
            <p className="text-xs text-slate-500 mb-1">Issue Date</p>
            <p className="text-sm font-semibold text-slate-900">{date(invoice.issuedAt)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1">Due Date</p>
            <p className="text-sm font-semibold text-slate-900">{date(invoice.dueAt)}</p>
          </div>
          {invoice.paidAt && (
            <div>
              <p className="text-xs text-slate-500 mb-1">Paid Date</p>
              <p className="text-sm font-semibold text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" /> {date(invoice.paidAt)}
              </p>
            </div>
          )}
        </div>

        {/* Line Items */}
        <div className="p-8 sm:p-12">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider w-full">Description</th>
                <th className="py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right px-4">Qty</th>
                <th className="py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-6 text-sm text-slate-500">Subscription line item</td>
                </tr>
              ) : (
                items.map(item => (
                  <tr key={item.id} className="group">
                    <td className="py-4">
                      <p className="font-medium text-slate-900 group-hover:text-indigo-600 transition-colors">{item.description}</p>
                    </td>
                    <td className="py-4 text-right px-4 text-sm text-slate-500">{item.quantity}</td>
                    <td className="py-4 text-right font-medium text-slate-900">{money(item.amount, invoice.currency)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="px-8 sm:px-12 py-8 bg-slate-50/50 flex justify-end border-t border-slate-100">
          <div className="w-full sm:w-80 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Subtotal</span>
              <span className="font-medium text-slate-900">{money(invoice.subtotal, invoice.currency)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Tax ({(invoice.taxRate * 100).toFixed(0)}%)</span>
              <span className="font-medium text-slate-900">{money(invoice.taxAmount, invoice.currency)}</span>
            </div>
            <div className="border-t border-slate-200 pt-3 flex justify-between items-center">
              <span className="font-semibold text-slate-900">Total</span>
              <span className="text-xl font-bold text-slate-900">{money(invoice.total, invoice.currency)}</span>
            </div>
          </div>
        </div>

      </div>

      {/* Payments Section */}
      {payments.length > 0 && (
        <section className="mt-8">
          <h3 className="text-lg font-semibold text-slate-900 mb-4 px-1">Payment Activity</h3>
          <div className="surface-panel overflow-hidden">
            <div className="divide-y divide-slate-100">
              {payments.map(payment => (
                <div key={payment.id} className="p-5 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={cn("p-2 rounded-xl border", payment.status === 'SUCCESS' ? "bg-emerald-50 border-emerald-100 text-emerald-600" : "bg-rose-50 border-rose-100 text-rose-600")}>
                      <Banknote className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{money(payment.amount, payment.currency)}</p>
                      <p className="text-xs text-slate-500 mt-1">{date(payment.createdAt)} • {payment.paymentMethod}</p>
                    </div>
                  </div>
                  <div>
                    <StatusBadge status={payment.status} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Credit Info */}
      <div className="flex items-start gap-3 mt-8 bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
        <HelpCircle className="h-5 w-5 text-indigo-500 shrink-0 mt-0.5" />
        <p className="text-sm text-indigo-900 leading-relaxed">
          If any account credits were available at the time of invoice generation, they have been automatically applied to the subtotal. The final total represents the remaining amount due.
        </p>
      </div>
    </div>
  );
}
