import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

import type { CatalogPlan } from "@/api/catalog";
import { MoneyText } from "@/components/customer/MoneyText";
import { cn } from "@/lib/utils";

interface PlanCardProps {
  plan: CatalogPlan;
  href: string;
  className?: string;
}

export function PlanCard({ plan, href, className }: PlanCardProps) {
  return (
    <Link
      to={href}
      className={cn(
        "group relative flex flex-col justify-between overflow-hidden rounded-3xl",
        "border border-white/60 bg-white/70 p-6",
        "shadow-[0_24px_50px_-30px_rgba(20,22,26,0.22)] backdrop-blur-xl",
        "transition hover:-translate-y-0.5 hover:shadow-[0_32px_60px_-30px_rgba(20,22,26,0.3)]",
        className,
      )}
    >
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-ink-subtle)]">
          {plan.interval === "MONTHLY" ? "Monthly" : "Yearly"} · {plan.currency}
        </p>

        <h3 className="font-display mt-2 text-xl font-semibold tracking-tight text-[var(--color-ink)]">
          {plan.name}
        </h3>

        {plan.description ? (
          <p className="mt-2 line-clamp-3 text-sm leading-6 text-[var(--color-ink-muted)]">
            {plan.description}
          </p>
        ) : null}

        <div className="mt-6 flex items-baseline gap-1.5">
          <MoneyText amount={plan.price} currency={plan.currency} size="xl" />
          <span className="text-sm text-[var(--color-ink-muted)]">
            /{plan.interval === "MONTHLY" ? "mo" : "yr"}
          </span>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between border-t border-[rgba(20,22,26,0.06)] pt-4">
        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-ink-subtle)]">
          Choose plan
        </span>
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-charcoal)] text-white transition group-hover:translate-x-0.5">
          <ArrowRight className="h-3.5 w-3.5" />
        </span>
      </div>
    </Link>
  );
}