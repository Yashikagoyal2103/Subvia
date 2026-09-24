import { Link } from "react-router-dom";
import { Check } from "lucide-react";
import type { Plan } from "@/api/plans";
import { cn } from "@/lib/utils";
import { formatMoney } from "@/lib/format";

interface PlanCardProps {
  plan: Plan;
  href: string;
  className?: string;
}

export function PlanCard({ plan, href, className }: PlanCardProps) {
  return (
    <div
      className={cn(
        "flex flex-col justify-between rounded-2xl border border-[var(--color-border-soft)] bg-white p-6 shadow-[var(--shadow-soft)] transition hover:shadow-[var(--shadow-card)]",
        className,
      )}
    >
      <div>
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-base font-semibold tracking-tight text-[var(--color-ink)]">
              {plan.name}
            </h3>
            <p className="mt-0.5 text-xs font-medium uppercase tracking-[0.08em] text-[var(--color-ink-subtle)]">
              {plan.interval === "MONTHLY" ? "Billed monthly" : "Billed yearly"}
            </p>
          </div>
          {plan.isActive ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Active
            </span>
          ) : null}
        </div>

        <div className="mt-5 flex items-baseline gap-1.5">
          <span className="text-3xl font-semibold tracking-tight text-[var(--color-ink)] tabular-nums">
            {formatMoney(plan.price, plan.currency)}
          </span>
          <span className="text-sm text-[var(--color-ink-muted)]">
            /{plan.interval === "MONTHLY" ? "mo" : "yr"}
          </span>
        </div>

        {plan.description ? (
          <p className="mt-3 line-clamp-3 text-sm text-[var(--color-ink-muted)]">
            {plan.description}
          </p>
        ) : null}
      </div>

      <Link
        to={href}
        className={cn(
          "mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full",
          "bg-[var(--color-ink)] px-4 py-2.5 text-sm font-semibold text-white",
          "transition hover:bg-[var(--color-surface-dark)]",
          !plan.isActive && "pointer-events-none opacity-40",
        )}
        aria-disabled={!plan.isActive}
      >
        <Check className="h-4 w-4" />
        Select {plan.name}
      </Link>
    </div>
  );
}