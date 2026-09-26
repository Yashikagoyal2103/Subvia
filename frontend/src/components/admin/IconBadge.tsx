import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type AdminTone = "indigo" | "emerald" | "amber" | "rose" | "violet";

const TONE_CLASSES: Record<AdminTone, string> = {
  indigo: "bg-[var(--a-indigo-soft)] text-[var(--a-indigo)]",
  emerald: "bg-[var(--a-emerald-soft)] text-[var(--a-emerald)]",
  amber: "bg-[var(--a-amber-soft)] text-[var(--a-amber)]",
  rose: "bg-[var(--a-rose-soft)] text-[var(--a-rose)]",
  violet: "bg-[var(--a-violet-soft)] text-[var(--a-violet)]",
};

const SIZE_CLASSES = {
  sm: "h-9 w-9",
  md: "h-11 w-11",
  lg: "h-12 w-12",
} as const;

interface IconBadgeProps {
  icon: ReactNode;
  tone: AdminTone;
  size?: keyof typeof SIZE_CLASSES;
  className?: string;
}

export function IconBadge({
  icon,
  tone,
  size = "md",
  className,
}: IconBadgeProps) {
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full",
        SIZE_CLASSES[size],
        TONE_CLASSES[tone],
        className,
      )}
    >
      {icon}
    </span>
  );
}