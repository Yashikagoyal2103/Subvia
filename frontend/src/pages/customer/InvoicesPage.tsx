import { Link, useParams } from "react-router-dom";
import { Receipt, FileText, ArrowUpRight, Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { invoicesApi } from "../../api/invoices";
import { StatusBadge } from "../../components/status-badge";
import { LoadingState } from "../../components/loading-state";
import { ErrorState } from "../../components/error-state";
import { cn } from "../../lib/utils";

const symbols: Record<string, string> = { INR: "₹", USD: "$" };
const money = (amount: number, currency: string) => `${symbols[currency] ?? currency}${(amount / 100).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const date = (value: string | null | undefined) => value ? new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "-";

export function CustomerInvoicesPage() {
  const { businessId } = useParams<{ businessId: string }>();

  const { data: invoicesResponse, isLoading, isError, refetch } = useQuery({
    queryKey: ["invoices", businessId],
    queryFn: () => invoicesApi.list(businessId!),
    enabled: Boolean(businessId),
  });

  if (!businessId) return <ErrorState description="A valid business context is required." />;
  if (isLoading) return <LoadingState message="Loading your invoices..." />;
  if (isError) return <ErrorState description="We couldn't load your invoices." retryAction={() => { void refetch(); }} />;

  const invoices = invoicesResponse?.data ?? [];
  const hasInvoices = invoices.length > 0;
  
  const paidInvoices = invoices.filter(i => i.status === 'PAID').length;
  const openInvoices = invoices.filter(i => i.status === 'OPEN').length;

  return (
    <div className="space-y-10 pb-12 animate-fade-in">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl mb-2">Invoices</h1>
          <p className="text-base text-slate-500 max-w-xl">View and track billing documents generated for your subscriptions.</p>
        </div>
        
        {hasInvoices && (
          <div className="flex items-center gap-4 bg-white px-5 py-3 rounded-2xl border border-slate-200/60 shadow-sm">
            <div className="text-center px-4 border-r border-slate-100">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Total</p>
              <p className="text-xl font-bold text-slate-900">{invoices.length}</p>
            </div>
            <div className="text-center px-4 border-r border-slate-100">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Paid</p>
              <p className="text-xl font-bold text-emerald-600">{paidInvoices}</p>
            </div>
            <div className="text-center px-4">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Open</p>
              <p className={cn("text-xl font-bold", openInvoices > 0 ? "text-amber-600" : "text-slate-900")}>{openInvoices}</p>
            </div>
          </div>
        )}
      </header>

      {!hasInvoices ? (
        <div className="flex min-h-[400px] flex-col items-center justify-center rounded-[32px] border border-dashed border-slate-300 bg-white/50 p-10 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 mb-6">
            <Receipt className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">No invoices yet</h2>
          <p className="max-w-sm text-sm text-slate-500">Invoices will appear here once billing activity occurs.</p>
        </div>
      ) : (
        <div className="surface-panel overflow-hidden">
          {/* Table Header */}
          <div className="hidden sm:grid grid-cols-[1.5fr_1fr_1fr_1fr_auto] gap-4 p-5 bg-slate-50/80 border-b border-slate-200/60 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <div className="pl-4">Invoice</div>
            <div>Date</div>
            <div>Amount</div>
            <div>Status</div>
            <div className="text-right pr-4">Action</div>
          </div>
          
          {/* Table Body */}
          <div className="divide-y divide-slate-100">
            {invoices.map((invoice) => (
              <Link 
                key={invoice.id} 
                to={`/customer/${businessId}/invoices/${invoice.id}`}
                className="group flex flex-col sm:grid sm:grid-cols-[1.5fr_1fr_1fr_1fr_auto] gap-4 p-5 sm:items-center transition-colors hover:bg-slate-50"
              >
                <div className="flex items-center gap-4 pl-0 sm:pl-4">
                  <div className={cn("hidden sm:flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border", invoice.status === 'PAID' ? "bg-emerald-50 border-emerald-100 text-emerald-600" : "bg-amber-50 border-amber-100 text-amber-600")}>
                    <FileText className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-mono text-sm font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">{invoice.invoiceNumber}</p>
                    <p className="text-xs text-slate-500 sm:hidden mt-1">{date(invoice.createdAt)}</p>
                  </div>
                </div>
                
                <div className="hidden sm:block text-sm text-slate-600">
                  {date(invoice.createdAt)}
                </div>
                
                <div className="text-sm font-semibold text-slate-900">
                  {money(invoice.total, invoice.currency)}
                </div>
                
                <div>
                  <StatusBadge status={invoice.status} />
                </div>
                
                <div className="hidden sm:flex justify-end pr-4 text-slate-400 group-hover:text-indigo-600 transition-colors">
                  <ArrowUpRight className="h-5 w-5" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}