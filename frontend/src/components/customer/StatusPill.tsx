import { cn } from "@/lib/utils";

interface StatusPillProps {
  status: string;
  className?: string;
}

type Tone = "green" | "amber" | "red" | "grey";

const TONE_MAP: Record<string, Tone> = {
  ACTIVE: "green",
  PAID: "green",
  SUCCESS: "green",
  SUCCEEDED: "green",
  DELIVERED: "green",
  PENDING: "amber",
  OPEN: "amber",
  PAST_DUE: "red",
  FAILED: "red",
  CANCELLED: "red",
  DRAFT: "grey",
  VOID: "grey",
  INACTIVE: "grey",
  DISABLED: "grey",
};

const TONE_STYLES: Record<Tone, { dot: string; chip: string }> = {
  green: {
    dot: "bg-[var(--color-positive)]",
    chip: "bg-[var(--color-positive-soft)] text-[#155f3c]",
  },
  amber: {
    dot: "bg-[var(--color-warning)]",
    chip: "bg-[var(--color-warning-soft)] text-[#7c540f]",
  },
  red: {
    dot: "bg-[var(--color-negative)]",
    chip: "bg-[var(--color-negative-soft)] text-[#8f2f28]",
  },
  grey: {
    dot: "bg-[var(--color-ink-subtle)]",
    chip: "bg-[rgba(20,22,26,0.06)] text-[var(--color-ink-muted)]",
  },
};

export function StatusPill({ status, className }: StatusPillProps) {
  const key = String(status).toUpperCase();
  const tone = TONE_MAP[key] ?? "grey";
  const style = TONE_STYLES[tone];
  const label = key.charAt(0) + key.slice(1).toLowerCase().replace(/_/g, " ");

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-tight",
        style.chip,
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", style.dot)} aria-hidden />
      {label}
    </span>
  );
}