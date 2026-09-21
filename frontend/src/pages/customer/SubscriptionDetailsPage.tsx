import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Clock, Zap, ShieldCheck, AlertTriangle, ArrowRight, Settings, CheckCircle2, History } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

import { subscriptionsApi } from "../../api/subscriptions";
import { StatusBadge } from "../../components/status-badge";
import { LoadingState } from "../../components/loading-state";
import { ErrorState } from "../../components/error-state";
import { ConfirmDialog } from "../../components/confirm-dialog";
import { cn } from "../../lib/utils";

const symbols: Record<string, string> = { INR: "₹", USD: "$" };
const money = (amount: number, currency: string) => `${symbols[currency] ?? currency}${(amount / 100).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const date = (value: string | null | undefined) => value ? new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "-";
const time = (value: string | null | undefined) => value ? new Date(value).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "";

export function SubscriptionDetailsPage() {
  const { businessId, subscriptionId } = useParams<{ businessId: string; subscriptionId: string }>();
  const queryClient = useQueryClient();

  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [cancelMode, setCancelMode] = useState<"PERIOD_END" | "IMMEDIATE">("PERIOD_END");

  const subQuery = useQuery({
    queryKey: ["subscription", businessId, subscriptionId],
    queryFn: () => subscriptionsApi.getById(businessId!, subscriptionId!),
    enabled: Boolean(businessId && subscriptionId),
  });

  const eventsQuery = useQuery({
    queryKey: ["subscription-events", businessId, subscriptionId],
    queryFn: () => subscriptionsApi.events(businessId!, subscriptionId!),
    enabled: Boolean(businessId && subscriptionId),
  });

  const cancelMutation = useMutation({
    mutationFn: (mode: "PERIOD_END" | "IMMEDIATE") => subscriptionsApi.cancel(businessId!, subscriptionId!, { mode }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscription", businessId, subscriptionId] });
      queryClient.invalidateQueries({ queryKey: ["subscription-events", businessId, subscriptionId] });
      toast.success("Subscription cancelled successfully.");
      setIsCancelDialogOpen(false);
    },
    onError: (err) => {
      toast.error(axios.isAxiosError(err) ? err.response?.data?.error?.message : "Failed to cancel.");
      setIsCancelDialogOpen(false);
    },
  });

  if (!businessId || !subscriptionId) return <ErrorState description="Missing context." />;
  if (subQuery.isLoading) return <LoadingState message="Loading subscription workspace..." />;
  if (subQuery.isError || !subQuery.data) return <ErrorState description="Failed to load subscription." retryAction={() => subQuery.refetch()} />;

  const sub = subQuery.data;
  const events = eventsQuery.data ?? [];
  const isPendingChange = Boolean(sub.pendingPlan);
  const isCancelling = sub.cancelAtPeriodEnd;
  const isActive = sub.status === "ACTIVE";

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <div>
        <Link to={`/customer/${businessId}/subscriptions`} className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to subscriptions
        </Link>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          
          <div className="glass-panel overflow-hidden">
            <div className="p-8 sm:p-10 border-b border-slate-100/50 bg-white/60">
              <div className="flex items-center gap-4 mb-6">
                <StatusBadge status={sub.status} className="px-3 py-1 text-sm" />
                <span className="text-xs font-bold uppercase tracking-widest text-indigo-500">{sub.plan?.service?.name}</span>
              </div>
              <h1 className="text-4xl font-semibold tracking-tight text-slate-900 mb-6">{sub.plan?.name}</h1>
              <div className="flex flex-wrap items-end gap-2">
                <span className="text-5xl font-bold tracking-tight text-slate-900">{money(sub.price, sub.currency)}</span>
                <span className="text-base font-medium text-slate-500 uppercase mb-1">/{sub.billingInterval.toLowerCase()}</span>
              </div>
            </div>
            
            <div className="grid sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 bg-white/40">
              <div className="p-8">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Billing Cycle</p>
                <div className="space-y-4 mt-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-500">Started on</span>
                    <span className="text-sm font-medium text-slate-900">{date(sub.billingPeriodStart)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-500">Current period ends</span>
                    <span className="text-sm font-medium text-slate-900">{date(sub.billingPeriodEnd)}</span>
                  </div>
                </div>
              </div>
              <div className="p-8">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Details</p>
                <div className="space-y-4 mt-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-500">Subscription ID</span>
                    <span className="text-xs font-mono text-slate-900">{sub.id.split("-")[0]}...</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-500">Created At</span>
                    <span className="text-sm font-medium text-slate-900">{date(sub.createdAt)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {(isPendingChange || isCancelling) && (
            <div className="surface-panel p-6 border-l-4 border-l-amber-500 bg-amber-50/30">
              {isPendingChange ? (
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <Clock className="h-5 w-5 text-amber-600" />
                    <h3 className="font-semibold text-amber-900">Scheduled plan change</h3>
                  </div>
                  <p className="text-sm text-amber-800 mb-4">Your subscription will automatically update at the end of the current billing cycle.</p>
                  <div className="flex items-center gap-3 text-sm font-medium p-3 bg-white/60 rounded-xl border border-amber-100">
                    <span className="text-slate-600">{sub.plan?.name}</span>
                    <ArrowRight className="h-4 w-4 text-slate-400" />
                    <span className="text-indigo-600">{sub.pendingPlan?.name}</span>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <AlertTriangle className="h-5 w-5 text-rose-600" />
                    <h3 className="font-semibold text-rose-900">Cancellation scheduled</h3>
                  </div>
                  <p className="text-sm text-rose-800">Your subscription remains active and you will have full access until <span className="font-bold">{date(sub.billingPeriodEnd)}</span>. After this date, it will be cancelled and you will not be billed.</p>
                </div>
              )}
            </div>
          )}

          {isActive && !isCancelling && !isPendingChange && (
            <div className="surface-panel overflow-hidden">
              <div className="border-b border-slate-100 bg-slate-50/50 p-6 flex items-center gap-3">
                <Settings className="h-5 w-5 text-slate-500" />
                <h2 className="font-semibold text-slate-900">Manage Subscription</h2>
              </div>
              <div className="p-6 grid gap-4 sm:grid-cols-2">
                <Link to={`/customer/${businessId}/services/${sub.plan?.serviceId}/plans`} className="flex flex-col p-5 rounded-2xl border border-slate-200 bg-white hover:border-indigo-300 hover:shadow-md transition-all group">
                  <Zap className="h-6 w-6 text-indigo-500 mb-4" />
                  <h3 className="font-semibold text-slate-900 mb-1">Change plan</h3>
                  <p className="text-xs text-slate-500 mb-4">Upgrade or downgrade your current subscription.</p>
                  <span className="text-xs font-semibold text-indigo-600 mt-auto group-hover:text-indigo-800 flex items-center gap-1">Browse plans <ArrowRight className="h-3 w-3" /></span>
                </Link>
                
                <button onClick={() => setIsCancelDialogOpen(true)} className="flex flex-col p-5 text-left rounded-2xl border border-slate-200 bg-white hover:border-rose-300 hover:shadow-md transition-all group">
                  <ShieldCheck className="h-6 w-6 text-rose-500 mb-4" />
                  <h3 className="font-semibold text-slate-900 mb-1">Cancel subscription</h3>
                  <p className="text-xs text-slate-500 mb-4">Stop auto-renewal at the end of the billing cycle.</p>
                  <span className="text-xs font-semibold text-rose-600 mt-auto group-hover:text-rose-800 flex items-center gap-1">Cancel <ArrowRight className="h-3 w-3" /></span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Timeline */}
        <div className="lg:col-span-1">
          <div className="surface-panel h-full flex flex-col">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
              <History className="h-5 w-5 text-indigo-500" />
              <h2 className="font-semibold text-slate-900">Event History</h2>
            </div>
            
            <div className="p-6 flex-1">
              {eventsQuery.isLoading ? (
                <div className="animate-pulse space-y-6">
                  {[1,2,3].map(i => <div key={i} className="h-12 w-full bg-slate-100 rounded-xl" />)}
                </div>
              ) : events.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-10">No events found.</p>
              ) : (
                <div className="relative space-y-6 before:absolute before:inset-0 before:ml-[19px] before:w-px before:bg-slate-200">
                  {events.map((evt) => (
                    <div key={evt.id} className="relative flex items-start gap-5">
                      <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-[3px] border-white bg-slate-100 text-slate-500 shadow-sm">
                        <CheckCircle2 className="h-4 w-4" />
                      </div>
                      <div className="flex-1 pt-1.5 pb-2 border-b border-slate-100/50 last:border-0">
                        <p className="text-sm font-semibold text-slate-900">{formatEventType(evt.type)}</p>
                        <div className="mt-1 flex items-center gap-2 text-xs text-slate-400">
                          <span>{date(evt.createdAt)}</span>
                          <span>•</span>
                          <span>{time(evt.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={isCancelDialogOpen}
        onClose={() => setIsCancelDialogOpen(false)}
        title="Cancel Subscription"
        description="Are you sure you want to cancel? This will stop future billing."
        confirmLabel="Confirm Cancellation"
        isDestructive={true}
        onConfirm={() => cancelMutation.mutate(cancelMode)}
        isLoading={cancelMutation.isPending}
      >
        <div className="mt-6 space-y-3">
          <label className={cn("flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition", cancelMode === "PERIOD_END" ? "border-indigo-600 bg-indigo-50" : "border-slate-200")}>
            <input type="radio" name="cancelMode" className="mt-1 h-4 w-4 text-indigo-600" checked={cancelMode === "PERIOD_END"} onChange={() => setCancelMode("PERIOD_END")} />
            <div>
              <p className="text-sm font-medium text-slate-900">Cancel at end of billing period</p>
              <p className="text-xs text-slate-500 mt-1">You retain access until {date(sub.billingPeriodEnd)}.</p>
            </div>
          </label>
          <label className={cn("flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition", cancelMode === "IMMEDIATE" ? "border-rose-600 bg-rose-50" : "border-slate-200")}>
            <input type="radio" name="cancelMode" className="mt-1 h-4 w-4 text-rose-600" checked={cancelMode === "IMMEDIATE"} onChange={() => setCancelMode("IMMEDIATE")} />
            <div>
              <p className="text-sm font-medium text-slate-900">Cancel immediately</p>
              <p className="text-xs text-slate-500 mt-1">Access is revoked immediately. Prorated credits may be issued.</p>
            </div>
          </label>
        </div>
      </ConfirmDialog>
    </div>
  );
}

function formatEventType(type: string) {
  return type.split("_").map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(" ");
}
