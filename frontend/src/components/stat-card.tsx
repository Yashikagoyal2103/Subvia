import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
} from "recharts";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: React.ReactNode;
  description?: React.ReactNode;
  icon?: LucideIcon;
  trend?: { value: number; label?: string };
  sparkline?: number[];
  className?: string;
}

export function StatCard({
  label,
  value,
  description,
  icon: Icon,
  trend,
  sparkline,
  className,
}: StatCardProps) {
  const trendUp = trend && trend.value >= 0;

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-[var(--color-border-soft)]",
        "bg-white p-5 shadow-[var(--shadow-soft)] transition",
        "hover:shadow-[var(--shadow-card)]",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-ink-subtle)]">
            {label}
          </p>
          <div className="mt-2 text-2xl font-semibold tracking-tight text-[var(--color-ink)] tabular-nums">
            {value}
          </div>
          {description ? (
            <p className="mt-1 truncate text-xs text-[var(--color-ink-muted)]">
              {description}
            </p>
          ) : null}
        </div>

        {Icon ? (
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--color-surface)] text-[var(--color-ink)] ring-1 ring-[var(--color-border-soft)]">
            <Icon className="h-4 w-4" />
          </span>
        ) : null}
      </div>

      {trend ? (
        <div className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold">
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5",
              trendUp
                ? "bg-emerald-50 text-emerald-700"
                : "bg-rose-50 text-rose-700",
            )}
          >
            {trendUp ? (
              <ArrowUpRight className="h-3 w-3" />
            ) : (
              <ArrowDownRight className="h-3 w-3" />
            )}
            {trendUp ? "+" : ""}
            {trend.value}%
          </span>
          {trend.label ? (
            <span className="text-[var(--color-ink-subtle)]">{trend.label}</span>
          ) : null}
        </div>
      ) : null}

      {sparkline && sparkline.length > 1 ? (
        <div className="mt-3 h-9 -mx-1">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={sparkline.map((v, i) => ({ i, v }))}
              margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
            >
              <Bar
                dataKey="v"
                radius={[3, 3, 0, 0]}
                fill="var(--color-accent)"
                isAnimationActive={false}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : null}
    </div>
  );
}