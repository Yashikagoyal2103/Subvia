import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Info, Wallet } from "lucide-react";

import { creditsApi } from "@/api/credits";
import { PageHeader } from "@/components/page-header";
import { LoadingState } from "@/components/loading-state";
import { ErrorState } from "@/components/error-state";
import { formatMoney } from "@/lib/format";

function readBalance(d: unknown): { INR: number; USD: number } {
  if (!d || typeof d !== "object") return { INR: 0, USD: 0 };
  const o = d as Record<string, unknown>;
  const n = (v: unknown) => (typeof v === "number" ? v : 0);
  return {
    INR: n(o.INR) || n(o.inr) || 0,
    USD: n(o.USD) || n(o.usd) || 0,
  };
}

export function CustomerCreditsPage() {
  const { businessId = "" } = useParams();
  const hasBusiness = !!businessId;

  const q = useQuery({
    queryKey: ["credits", businessId],
    queryFn: () => creditsApi.getBalance(businessId),
    enabled: hasBusiness,
    retry: false,
  });

  if (!hasBusiness)
    return <ErrorState description="A valid business context is required." />;
  if (q.isPending) return <LoadingState message="Loading credit balance…" />;

  // Missing endpoint / 404 → treat as zero balance, not an error.
  const { INR, USD } = q.isError ? { INR: 0, USD: 0 } : readBalance(q.data);
  const hasAny = INR > 0 || USD > 0;
  const endpointMissing = q.isError;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Credits"
        description="Account credits are automatically applied to eligible future invoices."
      />

      <section className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <BalancePanel currency="INR" amount={INR} />
        <BalancePanel currency="USD" amount={USD} />
      </section>

      {!hasAny ? (
        <div className="rounded-2xl border border-dashed border-[var(--color-border-soft)] bg-white/60 px-6 py-10 text-center">
          <p className="text-sm font-medium text-[var(--color-ink)]">
            No credits available
          </p>
          <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
            Credits issued to your account will appear here.
          </p>
          {endpointMissing ? (
            <p className="mt-3 text-xs text-[var(--color-ink-subtle)]">
              Note: the credit balance endpoint is not reachable for this
              workspace, so balances are shown as zero.
            </p>
          ) : null}
        </div>
      ) : null}

      <section className="rounded-2xl border border-[var(--color-border-soft)] bg-white p-5 shadow-[var(--shadow-soft)]">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-surface)]">
            <Info className="h-4 w-4 text-[var(--color-ink-muted)]" />
          </span>
          <div className="text-sm text-[var(--color-ink-muted)]">
            <p className="font-semibold text-[var(--color-ink)]">
              How credits work
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>
                Credits are monetary account credits, applied automatically to
                eligible future invoices.
              </li>
              <li>Credits are non-withdrawable and non-transferable.</li>
              <li>
                Detailed credit ledger history is available to workspace
                administrators, not from the customer view.
              </li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}

function BalancePanel({
  currency,
  amount,
}: {
  currency: "INR" | "USD";
  amount: number;
}) {
  const has = amount > 0;
  return (
    <div className="overflow-hidden rounded-2xl bg-[var(--color-surface-dark)] p-6 text-white shadow-[var(--shadow-card)]">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-white/50">
            {currency} balance
          </p>
          <p className="mt-2 text-3xl font-semibold tabular-nums text-[var(--color-accent)]">
            {formatMoney(amount, currency)}
          </p>
          <p className="mt-1 text-xs text-white/60">
            {has ? "Available for eligible invoices" : "No credits in this currency"}
          </p>
        </div>
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 ring-1 ring-white/10">
          <Wallet className="h-4 w-4 text-white/70" />
        </span>
      </div>
      <p className="mt-6 border-t border-white/10 pt-3 text-[11px] text-white/40">
        Minor units · {currency === "INR" ? "₹" : "$"}1 = 100 minor units
      </p>
    </div>
  );
}