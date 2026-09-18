import { useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Loader2,
  ShieldAlert,
  XCircle,
} from "lucide-react";
import {
  Link,
  useParams,
} from "react-router-dom";
import {
  useMutation,
  useQuery,
} from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";

import { subscriptionsApi } from "../../api/subscriptions";
import { plansApi } from "../../api/plans";
import { paymentsApi } from "../../api/payments";
import { StatusBadge } from "../../components/status-badge";
import { Button } from "../../components/ui/button";
import { queryClient } from "../../lib/query-client";

const currencySymbol = {
  INR: "₹",
  USD: "$",
};

function money(
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

function date(value: string) {
  return new Date(value).toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    },
  );
}

export function SubscriptionDetailsPage() {
  const {
    businessId,
    subscriptionId,
  } = useParams<{
    businessId: string;
    subscriptionId: string;
  }>();

  const [action, setAction] =
    useState<
      "UPGRADE" | "DOWNGRADE" | "CANCEL" | null
    >(null);

  const subscriptionQuery =
    useQuery({
      queryKey: [
        "subscription",
        businessId,
        subscriptionId,
      ],
      queryFn: () =>
        subscriptionsApi.getById(
          businessId!,
          subscriptionId!,
        ),
      enabled: Boolean(
        businessId &&
          subscriptionId,
      ),
    });

  const subscription =
    subscriptionQuery.data;

  const plansQuery = useQuery({
    queryKey: [
      "plans-for-subscription",
      businessId,
      subscription?.plan?.serviceId,
    ],
    queryFn: () =>
      plansApi.list(
        businessId!,
        subscription!.plan!.serviceId,
      ),
    enabled: Boolean(
      businessId &&
        subscription?.plan?.serviceId &&
        subscription.status === "ACTIVE",
    ),
  });

  const refresh = () => {
    queryClient.invalidateQueries({
      queryKey: [
        "subscription",
        businessId,
        subscriptionId,
      ],
    });

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
  };

  const upgradeMutation =
    useMutation({
      mutationFn: async (
        planId: string,
      ) => {
        const result =
          await subscriptionsApi.upgrade(
            businessId!,
            subscriptionId!,
            planId,
          );

        const payment =
          await paymentsApi.create(
            businessId!,
            {
              invoiceId:
                result.invoice.id,
              paymentMethod: "DEMO",
              result: "SUCCESS",
            },
          );

        return {
          ...result,
          payment,
        };
      },

      onSuccess: (result) => {
        refresh();
        setAction(null);

        if (result.payment.success) {
          toast.success(
            "Upgrade completed successfully.",
          );
        }
      },

      onError: (error) => {
        if (axios.isAxiosError(error)) {
          toast.error(
            error.response?.data?.error?.message ??
              "Upgrade failed.",
          );
        } else {
          toast.error("Upgrade failed.");
        }
      },
    });

  const downgradeMutation =
    useMutation({
      mutationFn: (planId: string) =>
        subscriptionsApi.downgrade(
          businessId!,
          subscriptionId!,
          planId,
        ),

      onSuccess: () => {
        refresh();
        setAction(null);
        toast.success(
          "Downgrade scheduled for the next billing period.",
        );
      },

      onError: (error) => {
        if (axios.isAxiosError(error)) {
          toast.error(
            error.response?.data?.error?.message ??
              "Downgrade failed.",
          );
        } else {
          toast.error("Downgrade failed.");
        }
      },
    });

  const cancelMutation =
    useMutation({
      mutationFn: (
        mode:
          | "PERIOD_END"
          | "IMMEDIATE",
      ) =>
        subscriptionsApi.cancel(
          businessId!,
          subscriptionId!,
          { mode },
        ),

      onSuccess: (
        updated,
      ) => {
        refresh();
        setAction(null);

        if (
          updated.status ===
          "CANCELLED"
        ) {
          toast.success(
            "Subscription cancelled.",
          );
        } else {
          toast.success(
            "Cancellation scheduled.",
          );
        }
      },

      onError: (error) => {
        if (axios.isAxiosError(error)) {
          toast.error(
            error.response?.data?.error?.message ??
              "Cancellation failed.",
          );
        } else {
          toast.error(
            "Cancellation failed.",
          );
        }
      },
    });

  if (
    !businessId ||
    !subscriptionId
  ) {
    return (
      <div className="rounded-2xl border bg-white p-10 text-center">
        Subscription context is missing.
      </div>
    );
  }

  if (
    subscriptionQuery.isLoading
  ) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (
    subscriptionQuery.isError ||
    !subscription
  ) {
    return (
      <div className="rounded-2xl border bg-white p-10 text-center">
        <XCircle className="mx-auto h-10 w-10 text-red-500" />

        <h2 className="mt-4 font-semibold">
          Subscription not found
        </h2>
      </div>
    );
  }

  const availablePlans =
    plansQuery.data ?? [];

  const currentPrice =
    subscription.price;

  const upgradePlans =
    availablePlans.filter(
      (plan) =>
        plan.isActive &&
        plan.id !==
          subscription.planId &&
        plan.currency ===
          subscription.currency &&
        plan.price > currentPrice,
    );

  const downgradePlans =
    availablePlans.filter(
      (plan) =>
        plan.isActive &&
        plan.id !==
          subscription.planId &&
        plan.currency ===
          subscription.currency &&
        plan.price < currentPrice,
    );

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <Link
        to={`/customer/${businessId}/subscriptions`}
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to subscriptions
      </Link>

      <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">
            Subscription
          </p>

          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-semibold tracking-tight">
              {subscription.plan?.name ??
                "Subscription"}
            </h1>

            <StatusBadge
              status={
                subscription.status
              }
            />
          </div>

          <p className="mt-2 text-sm text-gray-500">
            {subscription.plan?.service?.name ??
              "Service"}
          </p>
        </div>

        {subscription.status ===
          "ACTIVE" && (
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() =>
                setAction("UPGRADE")
              }
            >
              Upgrade
            </Button>

            <Button
              variant="outline"
              onClick={() =>
                setAction("DOWNGRADE")
              }
            >
              Downgrade
            </Button>

            <Button
              variant="outline"
              onClick={() =>
                setAction("CANCEL")
              }
            >
              Cancel
            </Button>
          </div>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-xs text-gray-400">
            Current price
          </p>

          <p className="mt-2 text-2xl font-bold">
            {money(
              subscription.price,
              subscription.currency,
            )}
          </p>

          <p className="mt-1 text-xs text-gray-400">
            /{" "}
            {subscription.billingInterval.toLowerCase()}
          </p>
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-xs text-gray-400">
            Current period
          </p>

          <p className="mt-2 text-sm font-semibold">
            {date(
              subscription.billingPeriodStart,
            )}
          </p>

          <p className="mt-1 text-xs text-gray-400">
            to{" "}
            {date(
              subscription.billingPeriodEnd,
            )}
          </p>
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-xs text-gray-400">
            Next billing
          </p>

          <p className="mt-2 text-sm font-semibold">
            {date(
              subscription.billingPeriodEnd,
            )}
          </p>

          <p className="mt-1 text-xs text-gray-400">
            Billing boundary
          </p>
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-xs text-gray-400">
            Subscription ID
          </p>

          <p className="mt-2 truncate font-mono text-xs text-gray-600">
            {subscription.id}
          </p>
        </div>
      </div>

      {subscription.pendingPlan && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <div className="flex items-start gap-3">
            <Clock3 className="mt-0.5 h-5 w-5 text-amber-600" />

            <div>
              <p className="font-semibold text-amber-900">
                Plan change scheduled
              </p>

              <p className="mt-1 text-sm text-amber-800">
                Your subscription will move to{" "}
                <strong>
                  {subscription.pendingPlan.name}
                </strong>{" "}
                at the next billing boundary.
              </p>
            </div>
          </div>
        </div>
      )}

      {subscription.cancelAtPeriodEnd && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
          <div className="flex items-start gap-3">
            <ShieldAlert className="mt-0.5 h-5 w-5 text-red-600" />

            <div>
              <p className="font-semibold text-red-900">
                Cancellation scheduled
              </p>

              <p className="mt-1 text-sm text-red-800">
                The subscription remains active
                until{" "}
                {date(
                  subscription.billingPeriodEnd,
                )}
                .
              </p>
            </div>
          </div>
        </div>
      )}

      {action === "UPGRADE" && (
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">
            Upgrade your plan
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Upgrades are immediate and use the
            backend proration calculation.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {upgradePlans.map(
              (plan) => (
                <div
                  key={plan.id}
                  className="rounded-xl border p-5"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">
                        {plan.name}
                      </h3>

                      <p className="mt-1 text-sm text-gray-500">
                        {money(
                          plan.price,
                          plan.currency,
                        )}{" "}
                        /{" "}
                        {plan.interval.toLowerCase()}
                      </p>
                    </div>

                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </div>

                  <Button
                    className="mt-5 w-full"
                    disabled={
                      upgradeMutation.isPending
                    }
                    onClick={() =>
                      upgradeMutation.mutate(
                        plan.id,
                      )
                    }
                  >
                    {upgradeMutation.isPending
                      ? "Processing..."
                      : `Upgrade to ${plan.name}`}
                  </Button>
                </div>
              ),
            )}
          </div>

          {upgradePlans.length === 0 && (
            <p className="mt-6 text-sm text-gray-500">
              No compatible higher-priced plans
              are currently available.
            </p>
          )}
        </div>
      )}

      {action === "DOWNGRADE" && (
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">
            Schedule a downgrade
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            The new plan will take effect at the
            next billing period.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {downgradePlans.map(
              (plan) => (
                <div
                  key={plan.id}
                  className="rounded-xl border p-5"
                >
                  <h3 className="font-semibold">
                    {plan.name}
                  </h3>

                  <p className="mt-1 text-sm text-gray-500">
                    {money(
                      plan.price,
                      plan.currency,
                    )}{" "}
                    /{" "}
                    {plan.interval.toLowerCase()}
                  </p>

                  <Button
                    variant="outline"
                    className="mt-5 w-full"
                    disabled={
                      downgradeMutation.isPending
                    }
                    onClick={() =>
                      downgradeMutation.mutate(
                        plan.id,
                      )
                    }
                  >
                    {downgradeMutation.isPending
                      ? "Scheduling..."
                      : "Schedule downgrade"}
                  </Button>
                </div>
              ),
            )}
          </div>
        </div>
      )}

      {action === "CANCEL" && (
        <div className="rounded-2xl border border-red-100 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">
            Cancel subscription
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Choose when the subscription should
            stop.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <button
              type="button"
              disabled={
                cancelMutation.isPending
              }
              onClick={() =>
                cancelMutation.mutate(
                  "PERIOD_END",
                )
              }
              className="rounded-xl border p-5 text-left hover:bg-gray-50"
            >
              <CalendarDays className="h-5 w-5 text-amber-600" />

              <h3 className="mt-4 font-semibold">
                At period end
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                Keep access until the current
                billing period ends.
              </p>
            </button>

            <button
              type="button"
              disabled={
                cancelMutation.isPending
              }
              onClick={() =>
                cancelMutation.mutate(
                  "IMMEDIATE",
                )
              }
              className="rounded-xl border border-red-200 p-5 text-left hover:bg-red-50"
            >
              <XCircle className="h-5 w-5 text-red-500" />

              <h3 className="mt-4 font-semibold">
                Cancel immediately
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                End the subscription now. Eligible
                unused value becomes account credit.
              </p>
            </button>
          </div>
        </div>
      )}

      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-emerald-600" />

          <div>
            <h2 className="font-semibold">
              Subscription lifecycle
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              This subscription is managed by the
              billing lifecycle implemented in the
              backend.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}