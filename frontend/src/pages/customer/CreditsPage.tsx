import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Wallet, Info, Activity } from "lucide-react";

import { creditsApi } from "../../api/credits";
import { LoadingState } from "../../components/loading-state";
import { ErrorState } from "../../components/error-state";

const symbols: Record<string, string> = { INR: "₹", USD: "$" };
const money = (amount: number, currency: string) => `${symbols[currency] ?? currency}${(amount / 100).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function CustomerCreditsPage() {
  const { businessId } = useParams<{ businessId: string }>();

  const { data: credits, isLoading, isError, refetch } = useQuery({
    queryKey: ["credit-balance", businessId],
    queryFn: () => creditsApi.getBalance(businessId!),
    enabled: Boolean(businessId),
  });

  if (!businessId) return <ErrorState description="Context missing." />;
  if (isLoading) return <LoadingState message="Loading your balance..." />;
  if (isError || !credits) return <ErrorState description="Unable to load credits." retryAction={() => refetch()} />;

  const hasBalance = credits.INR > 0 || credits.USD > 0;

  return (
    <div className="space-y-10 pb-12 animate-fade-in max-w-5xl mx-auto">
      <header className="flex flex-col gap-3 text-center items-center py-8">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100 mb-2 shadow-sm">
          <Wallet className="h-8 w-8" />
        </div>
        <h1 className="text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">Billing Credits</h1>
        <p className="text-base text-slate-500 max-w-xl">Available account balance that automatically reduces your eligible future invoices.</p>
      </header>

      {/* Balances Hero */}
      <div className="grid gap-6 md:grid-cols-2 max-w-3xl mx-auto">
        
        <div className="glass-panel overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-violet-600 opacity-95" />
          <div className="absolute right-0 top-0 h-40 w-40 translate-x-8 -translate-y-8 rounded-full bg-white/10 blur-2xl" />
          <div className="relative p-8 sm:p-10 text-white flex flex-col h-full justify-between min-h-[220px]">
            <p className="text-sm font-bold uppercase tracking-widest text-indigo-100">INR Balance</p>
            <div>
              <p className="text-6xl font-bold tracking-tight mb-2">{money(credits.INR, "INR")}</p>
              <p className="text-sm text-indigo-100 font-medium">Auto-applied to INR invoices</p>
            </div>
          </div>
        </div>

        <div className="glass-panel overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900 opacity-95" />
          <div className="relative p-8 sm:p-10 text-white flex flex-col h-full justify-between min-h-[220px]">
            <p className="text-sm font-bold uppercase tracking-widest text-slate-400">USD Balance</p>
            <div>
              <p className="text-6xl font-bold tracking-tight mb-2">{money(credits.USD, "USD")}</p>
              <p className="text-sm text-slate-400 font-medium">Auto-applied to USD invoices</p>
            </div>
          </div>
        </div>

      </div>

      {!hasBalance && (
        <div className="max-w-3xl mx-auto mt-8 flex items-start gap-4 p-5 rounded-2xl bg-slate-50 border border-slate-100">
          <Info className="h-5 w-5 text-slate-400 mt-0.5 shrink-0" />
          <p className="text-sm text-slate-500 leading-relaxed">
            You currently have no billing credits. Credits are typically generated through prorated plan downgrades or cancellations, and are strictly non-withdrawable. They will automatically be applied to your next eligible invoice.
          </p>
        </div>
      )}

      {/* Ledger placeholder if backend supports it in the future, for now show standard UI */}
      {hasBalance && (
        <div className="max-w-3xl mx-auto mt-12 space-y-6">
          <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <Activity className="h-5 w-5 text-indigo-500" /> Recent Activity
          </h3>
          <div className="surface-panel p-10 text-center flex flex-col items-center">
            <p className="text-sm text-slate-500">Detailed ledger history is available through the admin view. Your balance will automatically be deducted upon your next invoice generation.</p>
          </div>
        </div>
      )}

    </div>
  );
}