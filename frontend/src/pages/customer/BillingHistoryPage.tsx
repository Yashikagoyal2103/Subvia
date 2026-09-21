import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { History, Banknote, CheckCircle2, XCircle } from "lucide-react";

import { paymentsApi } from "../../api/payments";
import { StatusBadge } from "../../components/status-badge";
import { LoadingState } from "../../components/loading-state";
import { ErrorState } from "../../components/error-state";
import { cn } from "../../lib/utils";

const symbols: Record<string, string> = { INR: "₹", USD: "$" };
const money = (amount: number, currency: string) => `${symbols[currency] ?? currency}${(amount / 100).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const date = (value: string | null | undefined) => value ? new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" }) : "-";
const time = (value: string | null | undefined) => value ? new Date(value).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "";

export function CustomerBillingHistoryPage() {
  const { businessId } = useParams<{ businessId: string }>();

  const { data: payments, isLoading, isError, refetch } = useQuery({
    queryKey: ["payments", businessId],
    queryFn: () => paymentsApi.list(businessId!),
    enabled: Boolean(businessId),
  });

  if (!businessId) return <ErrorState description="Context missing." />;
  if (isLoading) return <LoadingState message="Loading payment history..." />;
  if (isError || !payments) return <ErrorState description="Failed to load history." retryAction={() => refetch()} />;

  const sortedPayments = [...payments].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));

  return (
    <div className="space-y-10 pb-12 animate-fade-in max-w-4xl mx-auto">
      <header className="py-6 border-b border-slate-200/60 mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl ring-1 ring-indigo-100">
            <History className="h-6 w-6" />
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">Billing History</h1>
        </div>
        <p className="text-base text-slate-500 max-w-xl ml-14">A timeline of all payment attempts and transactions on your account.</p>
      </header>

      {sortedPayments.length === 0 ? (
        <div className="flex min-h-[300px] flex-col items-center justify-center rounded-[32px] border border-dashed border-slate-300 bg-white/50 p-10 text-center">
          <Banknote className="h-10 w-10 text-slate-300 mb-4" />
          <h2 className="text-lg font-semibold text-slate-900 mb-2">No payment history</h2>
          <p className="text-sm text-slate-500">Payments will appear here automatically.</p>
        </div>
      ) : (
        <div className="relative space-y-8 before:absolute before:inset-0 before:ml-[23px] before:w-px before:bg-gradient-to-b before:from-slate-200 before:to-transparent">
          {sortedPayments.map(payment => (
            <div key={payment.id} className="relative flex items-start gap-6 group">
              <div className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-[4px] border-[#f8fafc] shadow-sm bg-white mt-1">
                {payment.status === "SUCCESS" ? (
                  <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                ) : (
                  <XCircle className="h-6 w-6 text-rose-500" />
                )}
              </div>
              
              <div className="flex-1 surface-panel p-6 sm:p-8 transition-shadow hover:shadow-md">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                  <div>
                    <h3 className={cn("text-lg font-bold", payment.status === 'SUCCESS' ? "text-slate-900" : "text-rose-900")}>
                      {money(payment.amount, payment.currency)}
                    </h3>
                    <p className="text-sm text-slate-500 mt-1 flex items-center gap-2">
                      <span className="font-semibold text-slate-700">{date(payment.createdAt)}</span>
                      <span className="text-slate-300">•</span>
                      <span>{time(payment.createdAt)}</span>
                    </p>
                  </div>
                  <StatusBadge status={payment.status} className="w-fit" />
                </div>
                
                <div className="border-t border-slate-100 pt-4 flex flex-wrap gap-y-2 justify-between text-sm">
                  <div className="flex items-center gap-2 text-slate-600">
                    <span className="font-medium">Method:</span>
                    <span className="bg-slate-100 px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wider">{payment.paymentMethod}</span>
                  </div>
                  
                  {payment.invoiceId && (
                    <div className="flex items-center gap-2 text-slate-600">
                      <span className="font-medium">Invoice ref:</span>
                      <span className="text-indigo-600 font-mono text-xs">{payment.invoiceId.split('-')[0]}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
