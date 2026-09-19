import { useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  CreditCard,
  Loader2,
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

import {
  subscriptionsApi,
} from "../../api/subscriptions";

import {
  plansApi,
} from "../../api/plans";

import {
  paymentsApi,
} from "../../api/payments";

import {
  StatusBadge,
} from "../../components/status-badge";

import {
  ErrorState,
} from "../../components/error-state";

import {
  Button,
} from "../../components/ui/button";

import {
  queryClient,
} from "../../lib/query-client";

const currencySymbol: Record<
  "INR" | "USD",
  string
> = {
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

function formatDate(
  value: string | null | undefined,
) {
  if (!value) {
    return "—";
  }

  return new Date(
    value,
  ).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(
  value: string,
) {
  return new Date(
    value,
  ).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function eventLabel(
  type: string,
) {
  return type
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase(),
    );
}

function EventIcon({
  type,
}: {
  type: string;
}) {
  if (
    type === "CREATED" ||
    type === "UPGRADED" ||
    type === "RENEWED" ||
    type === "PAYMENT_SUCCEEDED"
  ) {
    return (
      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
    );
  }

  if (
    type === "CANCELLED" ||
    type === "PAYMENT_FAILED"
  ) {
    return (
      <XCircle className="h-4 w-4 text-red-600" />
    );
  }

  if (
    type === "DOWNGRADE_SCHEDULED" ||
    type === "CANCEL_REQUESTED"
  ) {
    return (
      <Clock3 className="h-4 w-4 text-amber-600" />
    );
  }

  return (
    <CreditCard className="h-4 w-4 text-indigo-600" />
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
      | "UPGRADE"
      | "DOWNGRADE"
      | "CANCEL"
      | null
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

      enabled:
        Boolean(businessId) &&
        Boolean(subscriptionId),
    });

  const subscription =
    subscriptionQuery.data;

  const eventsQuery =
    useQuery({
      queryKey: [
        "subscription-events",
        businessId,
        subscriptionId,
      ],

      queryFn: () =>
        subscriptionsApi.events(
          businessId!,
          subscriptionId!,
        ),

      enabled:
        Boolean(businessId) &&
        Boolean(subscriptionId),
    });

  const plansQuery =
    useQuery({
      queryKey: [
        "subscription-plans",
        businessId,
        subscription?.plan?.serviceId,
      ],

      queryFn: () =>
        plansApi.list(
          businessId!,
          subscription!.plan!.serviceId,
        ),

      enabled:
        Boolean(businessId) &&
        Boolean(
          subscription?.plan?.serviceId,
        ) &&
        subscription?.status === "ACTIVE",
    });

  const refreshSubscription =
    async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: [
            "subscription",
            businessId,
            subscriptionId,
          ],
        }),

        queryClient.invalidateQueries({
          queryKey: [
            "subscription-events",
            businessId,
            subscriptionId,
          ],
        }),

        queryClient.invalidateQueries({
          queryKey: [
            "subscriptions",
            businessId,
          ],
        }),

        queryClient.invalidateQueries({
          queryKey: [
            "invoices",
            businessId,
          ],
        }),

        queryClient.invalidateQueries({
          queryKey: [
            "payments",
            businessId,
          ],
        }),

        queryClient.invalidateQueries({
          queryKey: [
            "credit-balance",
            businessId,
          ],
        }),
      ]);
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
          result,
          payment,
        };
      },

      onSuccess: async ({
        payment,
      }) => {
        await refreshSubscription();

        setAction(null);

        if (payment.success) {
          toast.success(
            "Subscription upgraded successfully.",
          );
        } else {
          toast.error(
            "Upgrade payment failed.",
          );
        }
      },

      onError: (error) => {
        if (
          axios.isAxiosError(error)
        ) {
          toast.error(
            error.response?.data
              ?.error?.message ??
              "Unable to upgrade subscription.",
          );

          return;
        }

        toast.error(
          "Unable to upgrade subscription.",
        );
      },
    });

  const downgradeMutation =
    useMutation({
      mutationFn: (
        planId: string,
      ) =>
        subscriptionsApi.downgrade(
          businessId!,
          subscriptionId!,
          planId,
        ),

      onSuccess: async () => {
        await refreshSubscription();

        setAction(null);

        toast.success(
          "Downgrade scheduled for the next billing period.",
        );
      },

      onError: (error) => {
        if (
          axios.isAxiosError(error)
        ) {
          toast.error(
            error.response?.data
              ?.error?.message ??
              "Unable to schedule downgrade.",
          );

          return;
        }

        toast.error(
          "Unable to schedule downgrade.",
        );
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

      onSuccess: async (
        _result,
        mode,
      ) => {
        await refreshSubscription();

        setAction(null);

        toast.success(
          mode === "PERIOD_END"
            ? "Subscription will cancel at the end of the billing period."
            : "Subscription cancelled successfully.",
        );
      },

      onError: (error) => {
        if (
          axios.isAxiosError(error)
        ) {
          toast.error(
            error.response?.data
              ?.error?.message ??
              "Unable to cancel subscription.",
          );

          return;
        }

        toast.error(
          "Unable to cancel subscription.",
        );
      },
    });

  if (
    !businessId ||
    !subscriptionId
  ) {
    return (
      <ErrorState
        description="A valid subscription context is required."
      />
    );
  }

  if (
    subscriptionQuery.isLoading
  ) {
    return (
      <div className="flex min-h-100 items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (
    subscriptionQuery.isError ||
    !subscription
  ) {
    return (
      <ErrorState
        description="We couldn't load this subscription."
        retryAction={() =>
          subscriptionQuery.refetch()
        }
      />
    );
  }

  const currentPlan =
    subscription.plan;

  const availablePlans =
    plansQuery.data ?? [];

  const higherPlans =
    availablePlans.filter(
      (plan) =>
        plan.id !==
          subscription.planId &&
        plan.isActive &&
        plan.currency ===
          subscription.currency &&
        plan.price >
          subscription.price,
    );

  const lowerPlans =
    availablePlans.filter(
      (plan) =>
        plan.id !==
          subscription.planId &&
        plan.isActive &&
        plan.currency ===
          subscription.currency &&
        plan.price <
          subscription.price,
    );

  const isMutating =
    upgradeMutation.isPending ||
    downgradeMutation.isPending ||
    cancelMutation.isPending;

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      {/* Header */}
      <header>
        <Link
          to={`/customer/${businessId}/subscriptions`}
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to subscriptions
        </Link>

        <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600">
              Subscription
            </p>

            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-gray-900">
              {currentPlan?.name ??
                "Subscription"}
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              {currentPlan?.service?.name ??
                "Service"}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <StatusBadge
              status={subscription.status}
            />

            {subscription.cancelAtPeriodEnd && (
              <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                Cancels at period end
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Overview */}
      <section className="grid gap-5 lg:grid-cols-[1.4fr_0.8fr]">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-400">
                Current plan
              </p>

              <h2 className="mt-2 text-xl font-semibold text-gray-900">
                {currentPlan?.name ??
                  "Current plan"}
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                {currentPlan?.description ??
                  "Your current recurring subscription."}
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <CreditCard className="h-5 w-5" />
            </div>
          </div>

          <div className="mt-7 grid gap-4 sm:grid-cols-3">
            <InfoCard
              label="Price"
              value={formatMoney(
                subscription.price,
                subscription.currency,
              )}
              helper={`per ${subscription.billingInterval.toLowerCase()}`}
            />

            <InfoCard
              label="Period starts"
              value={formatDate(
                subscription.billingPeriodStart,
              )}
              helper="current period"
            />

            <InfoCard
              label="Period ends"
              value={formatDate(
                subscription.billingPeriodEnd,
              )}
              helper="next billing point"
            />
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-400">
            Status
          </p>

          <div className="mt-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="h-5 w-5" />
            </div>

            <div>
              <p className="font-semibold text-gray-900">
                {subscription.status}
              </p>

              <p className="mt-1 text-sm text-gray-500">
                {subscription.status ===
                "ACTIVE"
                  ? "Your subscription is currently active."
                  : "Review the subscription activity below."}
              </p>
            </div>
          </div>

          {subscription.pendingPlan && (
            <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50/60 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-amber-700">
                Pending plan
              </p>

              <p className="mt-1 font-medium text-amber-900">
                {subscription.pendingPlan.name}
              </p>

              <p className="mt-1 text-sm text-amber-800">
                This change takes effect at the next billing
                period.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Management actions */}
      {subscription.status ===
        "ACTIVE" &&
        !subscription.cancelAtPeriodEnd && (
          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-600">
              Manage subscription
            </p>

            <h2 className="mt-2 text-lg font-semibold text-gray-900">
              Change your plan
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Upgrades are applied immediately. Downgrades are
              scheduled for the next billing period.
            </p>

            <div className="mt-6 grid gap-3 md:grid-cols-3">
              <ActionCard
                title="Upgrade plan"
                description="Move to a higher plan with proration."
                onClick={() =>
                  setAction("UPGRADE")
                }
              />

              <ActionCard
                title="Schedule downgrade"
                description="Move to a lower plan next period."
                onClick={() =>
                  setAction("DOWNGRADE")
                }
              />

              <ActionCard
                title="Cancel subscription"
                description="Cancel immediately or at period end."
                danger
                onClick={() =>
                  setAction("CANCEL")
                }
              />
            </div>
          </section>
        )}

      {/* Upgrade / downgrade */}
      {(action === "UPGRADE" ||
        action === "DOWNGRADE") && (
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-600">
                {action === "UPGRADE"
                  ? "Upgrade"
                  : "Downgrade"}
              </p>

              <h2 className="mt-2 text-lg font-semibold text-gray-900">
                Select a plan
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                {action === "UPGRADE"
                  ? "The difference for the remaining billing period will be calculated as proration."
                  : "The selected lower plan will become active at the next billing period."}
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                setAction(null)
              }
              className="text-sm text-gray-400 hover:text-gray-700"
            >
              Close
            </button>
          </div>

          {plansQuery.isLoading ? (
            <div className="mt-6 flex items-center gap-3 text-sm text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading available plans...
            </div>
          ) : plansQuery.isError ? (
            <div className="mt-6 rounded-xl border border-red-100 bg-red-50 p-4">
              <p className="text-sm text-red-700">
                Unable to load available plans.
              </p>
            </div>
          ) : (
            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {(action === "UPGRADE"
                ? higherPlans
                : lowerPlans
              ).map((plan) => (
                <PlanOption
                  key={plan.id}
                  name={plan.name}
                  description={
                    plan.description
                  }
                  price={plan.price}
                  currency={
                    plan.currency
                  }
                  interval={
                    plan.interval
                  }
                  disabled={
                    isMutating
                  }
                  onSelect={() => {
                    if (
                      action ===
                      "UPGRADE"
                    ) {
                      upgradeMutation.mutate(
                        plan.id,
                      );
                    } else {
                      downgradeMutation.mutate(
                        plan.id,
                      );
                    }
                  }}
                />
              ))}

              {(action ===
                "UPGRADE"
                ? higherPlans
                : lowerPlans
              ).length === 0 && (
                <div className="md:col-span-2 xl:col-span-3 rounded-xl border border-dashed border-gray-200 p-8 text-center">
                  <p className="text-sm font-medium text-gray-700">
                    {action ===
                    "UPGRADE"
                      ? "No higher-priced plans are available."
                      : "No lower-priced plans are available."}
                  </p>
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {/* Cancellation */}
      {action === "CANCEL" && (
        <section className="rounded-2xl border border-red-100 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-red-600">
            Cancellation
          </p>

          <h2 className="mt-2 text-lg font-semibold text-gray-900">
            Choose when to cancel
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            You can continue using the subscription until the
            current billing period ends, or cancel immediately.
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
              className="rounded-xl border border-gray-200 p-5 text-left transition hover:border-amber-200 hover:bg-amber-50/40 disabled:opacity-50"
            >
              <CalendarDays className="h-5 w-5 text-amber-600" />

              <p className="mt-4 font-semibold text-gray-900">
                Cancel at period end
              </p>

              <p className="mt-1 text-sm text-gray-500">
                Access continues until{" "}
                {formatDate(
                  subscription.billingPeriodEnd,
                )}
                .
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
              className="rounded-xl border border-red-200 p-5 text-left transition hover:bg-red-50 disabled:opacity-50"
            >
              <XCircle className="h-5 w-5 text-red-500" />

              <p className="mt-4 font-semibold text-gray-900">
                Cancel immediately
              </p>

              <p className="mt-1 text-sm text-gray-500">
                Unused eligible value is handled as account
                credit by the billing system.
              </p>
            </button>
          </div>
        </section>
      )}

      {/* Billing period */}
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <CalendarDays className="h-5 w-5 text-indigo-600" />

          <div>
            <h2 className="font-semibold text-gray-900">
              Billing period
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Current subscription billing window.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <InfoCard
            label="Starts"
            value={formatDate(
              subscription.billingPeriodStart,
            )}
            helper="period start"
          />

          <InfoCard
            label="Ends"
            value={formatDate(
              subscription.billingPeriodEnd,
            )}
            helper="period end"
          />
        </div>
      </section>

      {/* Event history */}
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-600">
            Audit trail
          </p>

          <h2 className="mt-2 text-lg font-semibold text-gray-900">
            Subscription activity
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Important subscription and billing lifecycle events.
          </p>
        </div>

        {eventsQuery.isLoading ? (
          <div className="mt-6 flex items-center gap-3 text-sm text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading activity...
          </div>
        ) : eventsQuery.isError ? (
          <div className="mt-6 rounded-xl border border-red-100 bg-red-50 p-4">
            <p className="text-sm font-medium text-red-700">
              Unable to load subscription activity.
            </p>

            <button
              type="button"
              onClick={() =>
                eventsQuery.refetch()
              }
              className="mt-2 text-sm font-medium text-red-700 underline"
            >
              Try again
            </button>
          </div>
        ) : !eventsQuery.data?.length ? (
          <div className="mt-6 rounded-xl border border-dashed border-gray-200 p-8 text-center">
            <Clock3 className="mx-auto h-8 w-8 text-gray-300" />

            <p className="mt-3 text-sm font-medium text-gray-700">
              No activity yet
            </p>
          </div>
        ) : (
          <div className="mt-7">
            {eventsQuery.data.map(
              (event, index) => (
                <div
                  key={event.id}
                  className="relative flex gap-4 pb-7 last:pb-0"
                >
                  {index !==
                    eventsQuery.data!
                      .length -
                      1 && (
                    <div className="absolute left-4 top-9 h-full w-px bg-gray-200" />
                  )}

                  <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white">
                    <EventIcon
                      type={event.type}
                    />
                  </div>

                  <div className="min-w-0 flex-1 rounded-xl border border-gray-100 bg-gray-50/60 p-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-sm font-semibold text-gray-900">
                        {eventLabel(
                          event.type,
                        )}
                      </p>

                      <time className="text-xs text-gray-400">
                        {formatDateTime(
                          event.createdAt,
                        )}
                      </time>
                    </div>

                    {event.metadata &&
                      Object.keys(
                        event.metadata,
                      ).length > 0 && (
                        <pre className="mt-3 overflow-x-auto rounded-lg border border-gray-200 bg-white p-3 text-xs text-gray-500">
                          {JSON.stringify(
                            event.metadata,
                            null,
                            2,
                          )}
                        </pre>
                      )}
                  </div>
                </div>
              ),
            )}
          </div>
        )}
      </section>
    </div>
  );
}

function InfoCard({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-4">
      <p className="text-xs font-medium text-gray-400">
        {label}
      </p>

      <p className="mt-2 text-lg font-semibold text-gray-900">
        {value}
      </p>

      <p className="mt-1 text-xs text-gray-400">
        {helper}
      </p>
    </div>
  );
}

function ActionCard({
  title,
  description,
  danger = false,
  onClick,
}: {
  title: string;
  description: string;
  danger?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group rounded-xl border p-4 text-left transition ${
        danger
          ? "border-red-100 hover:border-red-200 hover:bg-red-50/40"
          : "border-gray-200 hover:border-indigo-200 hover:bg-indigo-50/40"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <p
          className={`font-semibold ${
            danger
              ? "text-red-700"
              : "text-gray-900"
          }`}
        >
          {title}
        </p>

        <ChevronRight className="h-4 w-4 text-gray-300 transition group-hover:translate-x-0.5" />
      </div>

      <p className="mt-1 text-sm text-gray-500">
        {description}
      </p>
    </button>
  );
}

function PlanOption({
  name,
  description,
  price,
  currency,
  interval,
  disabled,
  onSelect,
}: {
  name: string;
  description: string | null;
  price: number;
  currency: "INR" | "USD";
  interval: "MONTHLY" | "YEARLY";
  disabled: boolean;
  onSelect: () => void;
}) {
  return (
    <div className="rounded-xl border border-gray-200 p-5 transition hover:border-indigo-200 hover:shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-gray-900">
            {name}
          </h3>

          <p className="mt-1 text-sm text-gray-500">
            {description ||
              "Subscription plan"}
          </p>
        </div>

        <span className="rounded-lg bg-gray-50 px-2 py-1 text-xs font-medium text-gray-500">
          {interval}
        </span>
      </div>

      <p className="mt-5 text-2xl font-semibold text-gray-900">
        {formatMoney(
          price,
          currency,
        )}
      </p>

      <p className="mt-1 text-xs text-gray-400">
        per {interval.toLowerCase()}
      </p>

      <Button
        type="button"
        className="mt-5 w-full"
        disabled={disabled}
        onClick={onSelect}
      >
        {disabled ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          "Select plan"
        )}
      </Button>
    </div>
  );
}