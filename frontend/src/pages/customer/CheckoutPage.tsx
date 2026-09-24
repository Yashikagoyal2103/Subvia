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
        toast.error("Payment failed — subscription remains inactive");
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
    return <ErrorState description="Plan context is missing." />;
  }

  if (planQuery.isPending) {
    return <LoadingState message="Preparing checkout…" />;
  }

  if (planQuery.isError || !planQuery.data) {
    return (
      <ErrorState
        description="We couldn't load this plan for checkout."
        retryAction={() => planQuery.refetch()}
      />
    );
  }

  const { service, plan } = planQuery.data;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Checkout"
        description="Demo payment only — no real money or payment details are collected."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
        <section className="rounded-2xl border border-[var(--color-border-soft)] bg-white p-6 shadow-[var(--shadow-soft)]">
          <h2 className="text-sm font-semibold text-[var(--color-ink)]">
            Payment simulator
          </h2>

          <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
            Choose the simulated payment result.
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <SimOption
              value="SUCCESS"
              selected={result === "SUCCESS"}
              onSelect={setResult}
              title="Successful payment"
              description="The subscription will become active."
              icon={<CheckCircle2 className="h-4 w-4" />}
              tone="success"
            />

            <SimOption
              value="FAILED"
              selected={result === "FAILED"}
              onSelect={setResult}
              title="Failed payment"
              description="The payment attempt will fail."
              icon={<XCircle className="h-4 w-4" />}
              tone="danger"
            />
          </div>

          <div className="mt-6 flex items-start gap-2.5 rounded-xl bg-[var(--color-surface)] p-3.5 text-xs text-[var(--color-ink-muted)]">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-ink)]" />

            <p>
              This is a controlled demo payment flow. No card,
              UPI, bank, or real payment information is collected.
            </p>
          </div>
        </section>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl bg-[var(--color-surface-dark)] p-6 text-white shadow-[var(--shadow-card)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-white/50">
              Order summary
            </p>

            <h2 className="mt-2 text-xl font-semibold">
              {plan.name}
            </h2>

            <p className="mt-1 text-sm text-white/60">
              {service.name}
            </p>

            <dl className="mt-6 space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-white/60">Billing</dt>
                <dd>
                  {plan.interval === "MONTHLY"
                    ? "Monthly"
                    : "Yearly"}
                </dd>
              </div>

              <div className="flex justify-between">
                <dt className="text-white/60">Currency</dt>
                <dd>{plan.currency}</dd>
              </div>

              <div className="flex justify-between border-t border-white/10 pt-3">
                <dt className="text-white/60">Today</dt>
                <dd className="font-semibold text-[var(--color-accent)]">
                  {formatMoney(plan.price, plan.currency)}
                </dd>
              </div>
            </dl>

            <button
              type="button"
              disabled={mutation.isPending}
              onClick={() => mutation.mutate()}
              className={cn(
                "mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full",
                "bg-[var(--color-accent)] px-5 py-3 text-sm font-semibold text-[var(--color-accent-foreground)]",
                "disabled:opacity-60",
              )}
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing…
                </>
              ) : (
                `Pay ${formatMoney(plan.price, plan.currency)}`
              )}
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}

interface SimOptionProps {
  value: SimResult;
  selected: boolean;
  onSelect: (value: SimResult) => void;
  title: string;
  description: string;
  icon: React.ReactNode;
  tone: "success" | "danger";
}

function SimOption({
  value,
  selected,
  onSelect,
  title,
  description,
  icon,
  tone,
}: SimOptionProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(value)}
      className={cn(
        "flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition",
        selected
          ? tone === "success"
            ? "border-emerald-400 bg-emerald-50"
            : "border-rose-400 bg-rose-50"
          : "border-[var(--color-border-soft)] hover:border-[var(--color-border-strong)]",
      )}
    >
      <span
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-full",
          tone === "success"
            ? "bg-emerald-100 text-emerald-700"
            : "bg-rose-100 text-rose-700",
        )}
      >
        {icon}
      </span>

      <span className="text-sm font-semibold text-[var(--color-ink)]">
        {title}
      </span>

      <span className="text-xs leading-5 text-[var(--color-ink-muted)]">
        {description}
      </span>
    </button>
  );
}