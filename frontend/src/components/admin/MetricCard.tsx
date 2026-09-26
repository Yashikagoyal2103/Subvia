import type { ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { IconBadge, type AdminTone } from "./IconBadge";

interface MetricCardProps {
  icon: ReactNode;
  tone: AdminTone;
  label: string;
  value: ReactNode;
  hint?: string;
  trend?: { value: number; label?: string };
  className?: string;
}

export function MetricCard({
  icon,
  tone,
  label,
  value,
  hint,
  trend,
  className,
}: MetricCardProps) {
  const up = trend ? trend.value >= 0 : true;

  return (
    <div className={cn("a-card a-card-interactive p-5", className)}>
      <div className="flex items-start justify-between gap-3">
        <IconBadge icon={icon} tone={tone} size="sm" />
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--a-ink-3)]">
          {label}
        </p>
      </div>

      <p className="mt-5 text-2xl font-semibold tabular-nums tracking-tight text-[var(--a-ink)]">
        {value}
      </p>

      <div className="mt-1.5 flex items-center justify-between gap-2">
        {hint ? (
          <p className="truncate text-xs text-[var(--a-ink-2)]">{hint}</p>
        ) : (
          <span />
        )}
        {trend ? (
          <span
            className={cn(
              "inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold",
              up
                ? "bg-[var(--a-emerald-soft)] text-[var(--a-emerald)]"
                : "bg-[var(--a-rose-soft)] text-[var(--a-rose)]",
            )}
          >
            {up ? (
              <ArrowUpRight className="h-3 w-3" />
            ) : (
              <ArrowDownRight className="h-3 w-3" />
            )}
            {up ? "+" : ""}
            {trend.value}%
          </span>
        ) : null}
      </div>
    </div>
  );
}