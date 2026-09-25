import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  CheckCircle2,
  Loader2,
  ShieldCheck,
  XCircle,
} from "lucide-react";

import { catalogApi } from "@/api/catalog";
import { subscriptionsApi } from "@/api/subscriptions";
import { paymentsApi } from "@/api/payments";

import { PageHeader } from "@/components/page-header";
import { LoadingState } from "@/components/loading-state";
import { ErrorState } from "@/components/error-state";
import { cn } from "@/lib/utils";
import { formatMoney } from "@/lib/format";

type SimResult = "SUCCESS" | "FAILED";

export function CheckoutPage() {
  const { planId = "" } = useParams();
  const navigate = useNavigate();

  const [result, setResult] = useState<SimResult>("SUCCESS");

  const planQuery = useQuery({
    queryKey: ["checkout-plan", planId],
    queryFn: async () => {
      const catalog = await catalogApi.list();

      for (const business of catalog) {
        for (const service of business.services) {
          const plan = service.plans.find(
            (item) => item.id === planId,
          );

          if (plan) {
            return {
              business,
              service,
              plan,
            };
          }
        }
      }

      return null;
    },
    enabled: Boolean(planId),
  });

  const mutation = useMutation({
    mutationFn: async () => {
      if (!planQuery.data) {
        throw new Error("Plan not found.");
      }

      const { business, plan } = planQuery.data;

      const subscriptionResult =
        await subscriptionsApi.create({
          planId: plan.id,
          currency: plan.currency,
        });

      await paymentsApi.create(business.id, {
        invoiceId: subscriptionResult.invoice.id,
        paymentMethod: "DEMO",
        result,
      });

      return subscriptionResult;
    },

    onSuccess: (data) => {
      if (result === "SUCCESS") {
        toast.success("Subscription activated");
      } else {
        toast.error(
          "Payment failed — subscription remains inactive",
        );
      }

      navigate(
        `/customer/subscriptions/${data.subscription.id}`,
      );
    },

    onError: (error: unknown) => {
      toast.error(
        error instanceof Error
          ? error.message
          : "Checkout failed. Please try again.",
      );
    },
  });

  if (!planId) {
    return (
      <ErrorState description="Plan context is missing." />
    );
  }

  if (planQuery.isPending) {
    return (
      <LoadingState message="Preparing checkout…" />
    );
  }

  if (planQuery.isError) {
    return (
      <ErrorState
        description="We couldn't load this plan."
        retryAction={() => planQuery.refetch()}
      />
    );
  }

  if (!planQuery.data) {
    return (
      <ErrorState
        description="This plan is no longer available."
      />
    );
  }

  const { service, plan } = planQuery.data;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Checkout"
        description={`Subscribe to ${service.name}`}
      />

      <div className="grid gap-8 lg:grid-cols-[1fr_420px]">
        <section className="surface-panel p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
              <ShieldCheck className="h-6 w-6" />
            </div>

            <div>
              <p className="text-sm font-medium text-slate-500">
                {service.name}
              </p>

              <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
                {plan.name}
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                {plan.description ||
                  "A recurring plan for this service."}
              </p>
            </div>
          </div>

          <div className="mt-8 border-t border-slate-100 pt-6">
            <h3 className="text-sm font-semibold text-slate-900">
              Payment simulator
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Choose the simulated payment result for this
              checkout.
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setResult("SUCCESS")}
                className={cn(
                  "rounded-2xl border p-4 text-left transition",
                  result === "SUCCESS"
                    ? "border-emerald-300 bg-emerald-50"
                    : "border-slate-200 bg-white hover:border-slate-300",
                )}
              >
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />

                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      Successful payment
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Simulate a successful payment.
                    </p>
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setResult("FAILED")}
                className={cn(
                  "rounded-2xl border p-4 text-left transition",
                  result === "FAILED"
                    ? "border-rose-300 bg-rose-50"
                    : "border-slate-200 bg-white hover:border-slate-300",
                )}
              >
                <div className="flex items-center gap-3">
                  <XCircle className="h-5 w-5 text-rose-600" />

                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      Failed payment
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Simulate a failed payment.
                    </p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </section>

        <aside className="surface-panel p-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Order summary
          </p>

          <div className="mt-6">
            <p className="text-lg font-semibold text-slate-950">
              {plan.name}
            </p>

            <p className="mt-1 text-sm text-slate-500">
              {service.name}
            </p>
          </div>

          <div className="mt-6 space-y-4 border-y border-slate-100 py-6">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-slate-500">
                Price
              </span>

              <span className="font-semibold text-slate-900">
                {formatMoney(plan.price, plan.currency)}
              </span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-slate-500">
                Billing interval
              </span>

              <span className="font-semibold text-slate-900">
                {plan.interval.toLowerCase()}
              </span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-slate-500">
                Currency
              </span>

              <span className="font-semibold text-slate-900">
                {plan.currency}
              </span>
            </div>
          </div>

          <p className="mb-6 text-xs leading-5 text-slate-400">
            Final tax calculations and invoice totals are
            generated by the billing engine when the
            subscription is created.
          </p>

          <button
            type="button"
            disabled={mutation.isPending}
            onClick={() => mutation.mutate()}
            className={cn(
              "flex h-14 w-full items-center justify-center rounded-xl text-base font-semibold text-white shadow-md transition",
              result === "SUCCESS"
                ? "bg-slate-900 hover:bg-indigo-600"
                : "bg-rose-600 hover:bg-rose-700",
            )}
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Processing order...
              </>
            ) : result === "SUCCESS" ? (
              "Subscribe & Pay"
            ) : (
              "Run Failed Payment"
            )}
          </button>
        </aside>
      </div>
    </div>
  );
}