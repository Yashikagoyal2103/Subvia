import { useState } from "react";
import {
  ArrowLeft, CheckCircle2, CreditCard, Loader2, ShieldCheck, XCircle, FileText
} from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";

import { plansApi } from "../../api/plans";
import { paymentsApi } from "../../api/payments";
import { subscriptionsApi } from "../../api/subscriptions";
import { Button } from "../../components/ui/button";
import { queryClient } from "../../lib/query-client";
import { cn } from "../../lib/utils";

const currencySymbol: Record<string, string> = { INR: "₹", USD: "$" };
function formatMoney(amount: number, currency: "INR" | "USD") {
  return `${currencySymbol[currency]}${(amount / 100).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function CheckoutPage() {
  const navigate = useNavigate();
  const { businessId, serviceId, planId } = useParams<{ businessId: string; serviceId: string; planId: string }>();
  const [result, setResult] = useState<"SUCCESS" | "FAILED">("SUCCESS");

  const planQuery = useQuery({
    queryKey: ["plan", businessId, serviceId, planId],
    queryFn: () => plansApi.getById(businessId!, serviceId!, planId!),
    enabled: Boolean(businessId && serviceId && planId),
  });

  const checkoutMutation = useMutation({
    mutationFn: async () => {
      if (!businessId || !planQuery.data) throw new Error("CHECKOUT_CONTEXT_MISSING");

      const created = await subscriptionsApi.create(businessId, { planId: planQuery.data.id, currency: planQuery.data.currency });
      const payment = await paymentsApi.create(businessId, { invoiceId: created.invoice.id, paymentMethod: "DEMO", result });

      return { ...created, payment };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["subscriptions", businessId] });
      queryClient.invalidateQueries({ queryKey: ["invoices", businessId] });
      queryClient.invalidateQueries({ queryKey: ["payments", businessId] });
      queryClient.invalidateQueries({ queryKey: ["credit-balance", businessId] });

      if (data.payment.success) {
        toast.success("Payment successful. Subscription activated.");
        navigate(`/customer/${businessId}/subscriptions/${data.subscription.id}`, { replace: true });
        return;
      }

      toast.error("Payment failed. You can retry the invoice.");
      navigate(`/customer/${businessId}/invoices/${data.invoice.id}`, { replace: true });
    },
    onError: (error) => {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.error?.message ?? "Checkout failed.");
        return;
      }
      toast.error("Checkout failed.");
    },
  });

  if (!businessId || !serviceId || !planId) {
    return <div className="rounded-3xl border bg-white p-10 text-center"><h2 className="text-lg font-semibold text-slate-900">Checkout context is missing</h2></div>;
  }

  if (planQuery.isLoading) {
    return <div className="flex min-h-[500px] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-indigo-600" /></div>;
  }

  if (planQuery.isError || !planQuery.data) {
    return (
      <div className="rounded-[32px] border bg-white p-12 text-center max-w-2xl mx-auto shadow-sm">
        <XCircle className="mx-auto h-12 w-12 text-red-500 mb-6" />
        <h2 className="text-xl font-semibold text-slate-900 mb-2">Unable to load plan</h2>
        <p className="text-sm text-slate-500">The selected plan could not be loaded for checkout.</p>
      </div>
    );
  }

  const plan = planQuery.data;

  return (
    <div className="mx-auto max-w-5xl space-y-8 animate-fade-in pb-12">
      <div>
        <Link to={`/customer/${businessId}/services/${serviceId}/plans`} className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Return to plans
        </Link>

        <div className="mt-8 flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">Complete your subscription</h1>
            <p className="mt-3 text-base text-slate-500">Review your selection and process the demo payment.</p>
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] items-start">
        
        {/* Payment Configuration */}
        <section className="glass-panel overflow-hidden p-1 lg:p-2">
          <div className="bg-white rounded-[20px] p-6 sm:p-8">
            <div className="flex items-center gap-4 mb-8 pb-6 border-b border-slate-100">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100/50">
                <CreditCard className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900 tracking-tight">Payment Configuration</h2>
                <p className="text-sm text-slate-500 mt-1">Select simulation mode</p>
              </div>
            </div>

            <div className="space-y-4">
              <button
                type="button"
                onClick={() => setResult("SUCCESS")}
                className={cn(
                  "flex w-full items-center justify-between rounded-2xl border p-5 text-left transition-all duration-200 group",
                  result === "SUCCESS" ? "border-emerald-500 bg-emerald-50/30 ring-1 ring-emerald-500/20 shadow-sm" : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                )}
              >
                <div className="flex items-center gap-4">
                  <div className={cn("p-2 rounded-full", result === "SUCCESS" ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-400 group-hover:text-slate-600")}>
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <div>
                    <p className={cn("font-semibold", result === "SUCCESS" ? "text-emerald-900" : "text-slate-700")}>Successful Payment</p>
                    <p className="text-xs text-slate-500 mt-1">Simulates a successful charge and activates the subscription.</p>
                  </div>
                </div>
                {result === "SUCCESS" && <div className="h-3 w-3 rounded-full bg-emerald-500 ring-4 ring-emerald-100" />}
              </button>

              <button
                type="button"
                onClick={() => setResult("FAILED")}
                className={cn(
                  "flex w-full items-center justify-between rounded-2xl border p-5 text-left transition-all duration-200 group",
                  result === "FAILED" ? "border-rose-500 bg-rose-50/30 ring-1 ring-rose-500/20 shadow-sm" : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                )}
              >
                <div className="flex items-center gap-4">
                  <div className={cn("p-2 rounded-full", result === "FAILED" ? "bg-rose-100 text-rose-600" : "bg-slate-100 text-slate-400 group-hover:text-slate-600")}>
                    <XCircle className="h-5 w-5" />
                  </div>
                  <div>
                    <p className={cn("font-semibold", result === "FAILED" ? "text-rose-900" : "text-slate-700")}>Failed Payment</p>
                    <p className="text-xs text-slate-500 mt-1">Simulates a declined card to test the failed payment workflow.</p>
                  </div>
                </div>
                {result === "FAILED" && <div className="h-3 w-3 rounded-full bg-rose-500 ring-4 ring-rose-100" />}
              </button>
            </div>

            <div className="mt-8 flex gap-3 rounded-xl bg-slate-50/80 border border-slate-100 p-4">
              <ShieldCheck className="h-5 w-5 text-slate-400 shrink-0 mt-0.5" />
              <p className="text-xs leading-5 text-slate-500">
                This environment is for demonstration purposes. No real money or card information is processed. The backend will simulate the complete billing lifecycle based on your selection.
              </p>
            </div>
          </div>
        </section>

        {/* Order Summary */}
        <aside className="premium-card p-6 sm:p-8 sticky top-24">
          <div className="flex items-center gap-3 mb-6 pb-6 border-b border-slate-100">
            <div className="p-2 bg-slate-100 text-slate-600 rounded-lg"><FileText className="h-5 w-5" /></div>
            <h2 className="text-lg font-semibold text-slate-900">Order Summary</h2>
          </div>

          <div className="mb-8">
            <h3 className="text-xl font-bold text-slate-900 mb-2">{plan.name}</h3>
            <p className="text-sm leading-6 text-slate-500">{plan.description ?? "Premium subscription"}</p>
          </div>

          <div className="space-y-4 bg-slate-50 p-5 rounded-2xl mb-8">
            <div className="flex justify-between items-center text-sm">
              <span className="font-medium text-slate-500">Plan price</span>
              <span className="font-semibold text-slate-900">{formatMoney(plan.price, plan.currency)}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="font-medium text-slate-500">Billing interval</span>
              <span className="font-semibold text-slate-900 capitalize">{plan.interval.toLowerCase()}</span>
            </div>
          </div>

          <p className="text-xs text-slate-400 mb-8 leading-5 text-center px-4">
            Final tax calculations and invoice totals are generated by the billing engine upon subscription creation.
          </p>

          <Button
            type="button"
            className={cn("w-full h-14 rounded-xl text-base font-semibold shadow-md transition-all duration-300", 
              result === 'SUCCESS' ? "bg-slate-900 hover:bg-indigo-600 text-white" : "bg-rose-600 hover:bg-rose-700 text-white"
            )}
            disabled={checkoutMutation.isPending}
            onClick={() => checkoutMutation.mutate()}
          >
            {checkoutMutation.isPending ? (
              <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Processing order...</>
            ) : result === "SUCCESS" ? (
              "Subscribe & Pay"
            ) : (
              "Run Failed Payment"
            )}
          </Button>
        </aside>
      </div>
    </div>
  );
}