import { useQuery } from "@tanstack/react-query";
import { Info, Wallet } from "lucide-react";

import { creditsApi } from "@/api/credits";
import { LoadingState } from "@/components/loading-state";
import { PageHeader } from "@/components/page-header";

function formatCredit(amount: number, currency: "INR" | "USD") {
  const symbol = currency === "INR" ? "₹" : "$";

  return `${symbol}${(amount / 100).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function BalanceCard({
  currency,
  amount,
}: {
  currency: "INR" | "USD";
  amount: number;
}) {
  return (
    <div className="rounded-2xl border border-[var(--color-border-soft)] bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-ink-subtle)]">
            {currency} credit
          </p>

          <p className="mt-3 text-3xl font-semibold tracking-tight text-[var(--color-ink)]">
            {formatCredit(amount, currency)}
          </p>

          <p className="mt-2 text-sm text-[var(--color-ink-muted)]">
            Available for eligible billing charges.
          </p>
        </div>

        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-surface-muted)]">
          <Wallet className="h-5 w-5 text-[var(--color-ink-muted)]" />
        </span>
      </div>
    </div>
  );
}

export function CustomerCreditsPage() {
  const query = useQuery({
    queryKey: ["customer-credits"],
    queryFn: () => creditsApi.getBalance(),
  });

  if (query.isPending) {
    return <LoadingState message="Loading credits…" />;
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Credits"
        description="View the account credits available for your billing."
      />

      {query.isError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
          <p className="text-sm font-medium text-red-900">
            We couldn't load your credit balance.
          </p>

          <button
            type="button"
            onClick={() => query.refetch()}
            className="mt-3 text-sm font-medium text-red-700 underline underline-offset-4"
          >
            Try again
          </button>
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            <BalanceCard currency="INR" amount={query.data.INR} />
            <BalanceCard currency="USD" amount={query.data.USD} />
          </div>

          <div className="flex gap-3 rounded-2xl border border-[var(--color-border-soft)] bg-white/70 p-5">
            <Info className="mt-0.5 h-5 w-5 shrink-0 text-[var(--color-ink-muted)]" />

            <div>
              <p className="text-sm font-medium text-[var(--color-ink)]">
                How credits work
              </p>

              <p className="mt-1 text-sm leading-6 text-[var(--color-ink-muted)]">
                Credits can be created by billing adjustments such as unused
                subscription value. They can be applied to eligible future
                charges in the same currency.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}