import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import type { AdminTone } from "./IconBadge";

export interface DonutSegment {
  label: string;
  value: number;
  tone: AdminTone;
}

interface DonutMetricProps {
  segments: DonutSegment[];
  centerLabel: ReactNode;
  centerValue: ReactNode;
  size?: number;
  className?: string;
}

const STROKE: Record<AdminTone, string> = {
  indigo: "var(--a-indigo)",
  emerald: "var(--a-emerald)",
  amber: "var(--a-amber)",
  rose: "var(--a-rose)",
  violet: "var(--a-violet)",
};

const DOT: Record<AdminTone, string> = {
  indigo: "bg-[var(--a-indigo)]",
  emerald: "bg-[var(--a-emerald)]",
  amber: "bg-[var(--a-amber)]",
  rose: "bg-[var(--a-rose)]",
  violet: "bg-[var(--a-violet)]",
};

export function DonutMetric({
  segments,
  centerLabel,
  centerValue,
  size = 180,
  className,
}: DonutMetricProps) {
  const total = segments.reduce((sum, s) => sum + Math.max(0, s.value), 0);
  const strokeWidth = 16;
  const radius = size / 2 - strokeWidth;
  const circumference = 2 * Math.PI * radius;

  // If everything is 0, render the neutral ring with a "no data" center.
  const hasData = total > 0;

  let offset = 0;

  return (
    <div className={cn("flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:gap-8", className)}>
      <div
        className="relative shrink-0"
        style={{ width: size, height: size }}
        role="img"
        aria-label="Distribution chart"
      >
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(15,15,10,0.06)"
            strokeWidth={strokeWidth}
          />
          {hasData
            ? segments.map((seg) => {
                const portion = Math.max(0, seg.value) / total;
                const dashArray = `${portion * circumference} ${circumference}`;
                const dashOffset = -offset * circumference;
                offset += portion;
                if (portion === 0) return null;
                return (
                  <circle
                    key={seg.label}
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={STROKE[seg.tone]}
                    strokeWidth={strokeWidth}
                    strokeDasharray={dashArray}
                    strokeDashoffset={dashOffset}
                    strokeLinecap="butt"
                    transform={`rotate(-90 ${size / 2} ${size / 2})`}
                  />
                );
              })
            : null}
        </svg>

        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--a-ink-3)]">
            {centerLabel}
          </p>
          <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight text-[var(--a-ink)]">
            {centerValue}
          </p>
        </div>
      </div>

      {hasData ? (
        <ul className="w-full space-y-2.5">
          {segments
            .filter((s) => s.value > 0)
            .map((seg) => {
              const pct = ((seg.value / total) * 100).toFixed(1);
              return (
                <li
                  key={seg.label}
                  className="flex items-center justify-between gap-4 text-sm"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <span
                      className={cn(
                        "h-2 w-2 shrink-0 rounded-full",
                        DOT[seg.tone],
                      )}
                      aria-hidden
                    />
                    <span className="truncate text-[var(--a-ink-2)]">
                      {seg.label}
                    </span>
                  </div>
                  <span className="shrink-0 text-right text-[var(--a-ink)]">
                    <span className="tabular-nums font-medium">{seg.value}</span>
                    <span className="ml-2 text-xs text-[var(--a-ink-3)]">
                      {pct}%
                    </span>
                  </span>
                </li>
              );
            })}
        </ul>
      ) : null}
    </div>
  );
}