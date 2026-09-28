import { useState } from "react";
import { CreditCard, LockKeyhole, Smartphone } from "lucide-react";

import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

type Result = "SUCCESS" | "FAILED";
type Method = "CARD" | "UPI";

export function DemoPaymentPanel({
  amount,
  currency,
  onPay,
  isPending = false,
  initialResult = "SUCCESS",
  title = "Payment",
  description = "Complete your payment securely.",
  submitLabel,
}: {
  amount: number;
  currency: "INR" | "USD";
  onPay: (result: Result) => void;
  isPending?: boolean;
  initialResult?: Result;
  title?: string;
  description?: string;
  submitLabel?: string;
}) {
  const [method, setMethod] = useState<Method>("CARD");
  const [result, setResult] = useState<Result>(initialResult);

  return (
    <section className="glass-strong overflow-hidden rounded-3xl">
      <div className="border-b border-[rgba(20,22,26,0.06)] px-6 py-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <LockKeyhole className="h-4 w-4 text-[var(--color-positive)]" />
              <p className="text-sm font-semibold text-[var(--color-ink)]">
                {title}
              </p>
            </div>

            <p className="mt-1 text-xs text-[var(--color-ink-muted)]">
              {description}
            </p>
          </div>

          <p className="text-lg font-semibold tabular-nums text-[var(--color-ink)]">
            {formatMoney(amount, currency)}
          </p>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-2 gap-2 rounded-2xl bg-[rgba(20,22,26,0.04)] p-1">
          <button
            type="button"
            onClick={() => setMethod("CARD")}
            className={cn(
              "flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold transition",
              method === "CARD"
                ? "bg-white text-[var(--color-ink)] shadow-sm"
                : "text-[var(--color-ink-muted)]",
            )}
          >
            <CreditCard className="h-3.5 w-3.5" />
            Card
          </button>

          <button
            type="button"
            onClick={() => setMethod("UPI")}
            className={cn(
              "flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold transition",
              method === "UPI"
                ? "bg-white text-[var(--color-ink)] shadow-sm"
                : "text-[var(--color-ink-muted)]",
            )}
          >
            <Smartphone className="h-3.5 w-3.5" />
            UPI
          </button>
        </div>

        {method === "CARD" ? (
          <div className="mt-5 space-y-3">
            <Field
              label="Card number"
              placeholder="1234 5678 9012 3456"
            />

            <div className="grid grid-cols-2 gap-3">
              <Field label="Expiry" placeholder="MM / YY" />
              <Field label="CVC" placeholder="•••" />
            </div>

            <Field label="Cardholder name" placeholder="Your name" />
          </div>
        ) : (
          <div className="mt-5 rounded-2xl border border-[rgba(20,22,26,0.08)] bg-white/70 p-4">
            <label className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-ink-subtle)]">
              UPI ID
            </label>

            <input
              placeholder="name@upi"
              className="mt-2 h-11 w-full rounded-xl border border-[rgba(20,22,26,0.08)] bg-white px-3.5 text-sm outline-none focus:ring-2 focus:ring-[var(--color-charcoal)]/10"
            />
          </div>
        )}

        <div className="mt-5 rounded-2xl border border-[rgba(20,22,26,0.08)] bg-[rgba(20,22,26,0.025)] p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-[var(--color-ink)]">
                Payment outcome
              </p>
              <p className="mt-0.5 text-[11px] text-[var(--color-ink-subtle)]">
                Demo environment · no real money is moved.
              </p>
            </div>

            <div className="flex gap-1 rounded-full bg-white p-1 shadow-sm">
              <button
                type="button"
                onClick={() => setResult("SUCCESS")}
                className={cn(
                  "rounded-full px-3 py-1.5 text-[11px] font-semibold",
                  result === "SUCCESS"
                    ? "bg-[rgba(20,22,26,0.08)] text-[var(--color-ink)]"
                    : "text-[var(--color-ink-muted)]",
                )}
              >
                Success
              </button>

              <button
                type="button"
                onClick={() => setResult("FAILED")}
                className={cn(
                  "rounded-full px-3 py-1.5 text-[11px] font-semibold",
                  result === "FAILED"
                    ? "bg-[rgba(20,22,26,0.08)] text-[var(--color-ink)]"
                    : "text-[var(--color-ink-muted)]",
                )}
              >
                Failure
              </button>
            </div>
          </div>
        </div>

        <button
          type="button"
          disabled={isPending}
          onClick={() => onPay(result)}
          className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[var(--color-charcoal)] text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending
            ? "Processing…"
            : amount <= 0
              ? submitLabel ?? "Complete purchase"
              : submitLabel ?? `Pay ${formatMoney(amount, currency)}`}
        </button>

        <p className="mt-3 text-center text-[11px] leading-5 text-[var(--color-ink-subtle)]">
          Subvia demo environment. Payment details are not stored or sent to a
          real payment provider.
        </p>
      </div>
    </section>
  );
}

function Field({
  label,
  placeholder,
}: {
  label: string;
  placeholder: string;
}) {
  return (
    <label className="block">
      <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-ink-subtle)]">
        {label}
      </span>

      <input
        placeholder={placeholder}
        className="mt-2 h-11 w-full rounded-xl border border-[rgba(20,22,26,0.08)] bg-white/80 px-3.5 text-sm text-[var(--color-ink)] outline-none focus:ring-2 focus:ring-[var(--color-charcoal)]/10"
      />
    </label>
  );
}