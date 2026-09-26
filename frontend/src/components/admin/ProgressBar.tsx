import { cn } from "@/lib/utils";
import type { AdminTone } from "./IconBadge";

interface ProgressSegment {
  value: number;
  tone: AdminTone;
}

interface ProgressBarProps {
  segments: ProgressSegment[];
  className?: string;
  height?: number;
}

const BG: Record<AdminTone, string> = {
  indigo: "bg-[var(--a-indigo)]",
  emerald: "bg-[var(--a-emerald)]",
  amber: "bg-[var(--a-amber)]",
  rose: "bg-[var(--a-rose)]",
  violet: "bg-[var(--a-violet)]",
};

export function ProgressBar({
  segments,
  className,
  height = 8,
}: ProgressBarProps) {
  const total = segments.reduce((s, seg) => s + Math.max(0, seg.value), 0);
  const visible = segments.filter((s) => s.value > 0);

  return (
    <div
      className={cn(
        "flex w-full overflow-hidden rounded-full bg-[rgba(15,15,10,0.06)]",
        className,
      )}
      style={{ height }}
      role="img"
      aria-label="Distribution"
    >
      {total === 0 ? null : (
        visible.map((seg, i) => (
          <span
            key={i}
            className={cn(BG[seg.tone], "h-full")}
            style={{ width: `${(seg.value / total) * 100}%` }}
          />
        ))
      )}
    </div>
  );
}