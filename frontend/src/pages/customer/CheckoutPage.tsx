import { useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  Loader2,
  ShieldCheck,
  XCircle,
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

const currencySymbol = {
  INR: "₹",
  USD: "$",
};

function formatMoney(
  amount: number,
  currency: "INR" | "USD",
) {
  return `${currencySymbol[currency]}${(
    amount / 100
  ).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function CheckoutPage() {
  const navigate = useNavigate();

  const {
    businessId,
    serviceId,
    planId,
  } = useParams<{
    businessId: string;
    serviceId: string;
    planId: string;
  }>();

  const [result, setResult] =
    useState<"SUCCESS" | "FAILED">("SUCCESS");

  const planQuery = useQuery({
    queryKey: [
      "plan",
      businessId,
      serviceId,
      planId,
    ],
    queryFn: () =>
      plansApi.getById(
        businessId!,
        serviceId!,
        planId!,
      ),
    enabled: Boolean(
      businessId &&
        serviceId &&
        planId,
    ),
  });

  const checkoutMutation = useMutation({
    mutationFn: async () => {
      if (!businessId || !planQuery.data) {
        throw new Error(
          "CHECKOUT_CONTEXT_MISSING",
        );
      }

      const created =
        await subscriptionsApi.create(
          businessId,
          {
            planId: planQuery.data.id,
            currency:
              planQuery.data.currency,
          },
        );

      const payment =
        await paymentsApi.create(
          businessId,
          {
            invoiceId:
              created.invoice.id,
            paymentMethod: "DEMO",
            result,
          },
        );

      return {
        ...created,
        payment,
      };
    },

    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: [
          "subscriptions",
          businessId,
        ],
      });

      queryClient.invalidateQueries({
        queryKey: [
          "invoices",
          businessId,
        ],
      });

      queryClient.invalidateQueries({
        queryKey: [
          "payments",
          businessId,
        ],
      });

      queryClient.invalidateQueries({
        queryKey: [
          "credit-balance",
          businessId,
        ],
      });

      if (data.payment.success) {
        toast.success(
          "Payment successful. Subscription activated.",
        );

        navigate(
          `/customer/${businessId}/subscriptions/${data.subscription.id}`,
          {
            replace: true,
          },
        );

        return;
      }

      toast.error(
        "Payment failed. You can retry the invoice.",
      );

      navigate(
        `/customer/${businessId}/invoices/${data.invoice.id}`,
        {
          replace: true,
        },
      );
    },

    onError: (error) => {
      if (axios.isAxiosError(error)) {
        toast.error(
          error.response?.data?.error?.message ??
            "Checkout failed.",
        );
        return;
      }

      toast.error("Checkout failed.");
    },
  });

  if (
    !businessId ||
    !serviceId ||
    !planId
  ) {
    return (
      <div className="rounded-2xl border bg-white p-10 text-center">
        <h2 className="text-lg font-semibold">
          Checkout context is missing
        </h2>
      </div>
    );
  }

  if (planQuery.isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (
    planQuery.isError ||
    !planQuery.data
  ) {
    return (
      <div className="rounded-2xl border bg-white p-10 text-center">
        <XCircle className="mx-auto h-10 w-10 text-red-500" />

        <h2 className="mt-4 text-lg font-semibold">
          Unable to load plan
        </h2>

        <p className="mt-2 text-sm text-gray-500">
          The selected plan could not be loaded.
        </p>
      </div>
    );
  }

  const plan = planQuery.data;

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <Link
          to={`/customer/${businessId}/services/${serviceId}/plans`}
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to plans
        </Link>

        <div className="mt-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">
            Checkout
          </p>

          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-gray-950">
            Complete your subscription
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Review your plan and run a controlled demo payment.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <CreditCard className="h-5 w-5" />
            </div>

            <div>
              <h2 className="font-semibold text-gray-900">
                Demo payment
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                No real payment information is collected or
                processed.
              </p>
            </div>
          </div>

          <div className="mt-8 space-y-3">
            <button
              type="button"
              onClick={() =>
                setResult("SUCCESS")
              }
              className={`flex w-full items-center justify-between rounded-xl border p-4 text-left transition ${
                result === "SUCCESS"
                  ? "border-indigo-300 bg-indigo-50"
                  : "border-gray-200 hover:bg-gray-50"
              }`}
            >
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />

                <div>
                  <p className="font-medium">
                    Successful payment
                  </p>

                  <p className="text-xs text-gray-500">
                    Activate the subscription
                  </p>
                </div>
              </div>

              {result === "SUCCESS" && (
                <span className="text-xs font-semibold text-indigo-600">
                  Selected
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() =>
                setResult("FAILED")
              }
              className={`flex w-full items-center justify-between rounded-xl border p-4 text-left transition ${
                result === "FAILED"
                  ? "border-red-300 bg-red-50"
                  : "border-gray-200 hover:bg-gray-50"
              }`}
            >
              <div className="flex items-center gap-3">
                <XCircle className="h-5 w-5 text-red-500" />

                <div>
                  <p className="font-medium">
                    Failed payment
                  </p>

                  <p className="text-xs text-gray-500">
                    Test the failed-payment scenario
                  </p>
                </div>
              </div>

              {result === "FAILED" && (
                <span className="text-xs font-semibold text-red-600">
                  Selected
                </span>
              )}
            </button>
          </div>

          <div className="mt-8 flex gap-3 rounded-xl bg-gray-50 p-4 text-xs leading-5 text-gray-500">
            <ShieldCheck className="h-4 w-4 shrink-0" />

            <span>
              This checkout uses the project's controlled DEMO
              payment system.
            </span>
          </div>
        </section>

        <aside className="h-fit rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
            Order summary
          </p>

          <h2 className="mt-4 text-xl font-semibold text-gray-900">
            {plan.name}
          </h2>

          <p className="mt-2 text-sm leading-6 text-gray-500">
            {plan.description ??
              "Subscription plan"}
          </p>

          <div className="my-6 border-t" />

          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">
                Plan price
              </span>

              <span className="font-medium text-gray-900">
                {formatMoney(
                  plan.price,
                  plan.currency,
                )}
              </span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-gray-500">
                Billing interval
              </span>

              <span className="font-medium text-gray-900">
                {plan.interval === "MONTHLY"
                  ? "Monthly"
                  : "Yearly"}
              </span>
            </div>
          </div>

          <div className="my-6 border-t" />

          <p className="text-xs leading-5 text-gray-400">
            Final tax and invoice totals are calculated by the
            billing backend when the subscription is created.
          </p>

          <Button
            type="button"
            className="mt-6 w-full bg-gray-950 hover:bg-gray-800"
            disabled={
              checkoutMutation.isPending
            }
            onClick={() =>
              checkoutMutation.mutate()
            }
          >
            {checkoutMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
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