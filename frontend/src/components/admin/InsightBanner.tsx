import type { ReactNode } from "react";
import { AlertTriangle, Sparkles, Info } from "lucide-react";

import { cn } from "@/lib/utils";

type Tone = "positive" | "neutral" | "warning";

interface InsightBannerProps {
  tone: Tone;
  children: ReactNode;
  className?: string;
}

const STYLES: Record<Tone, { wrap: string; icon: ReactNode }> = {
  positive: {
    wrap: "bg-[var(--a-emerald-soft)] text-[#0f5132]",
    icon: <Sparkles className="h-4 w-4" />,
  },
  neutral: {
    wrap: "bg-[var(--a-indigo-soft)] text-[#312e81]",
    icon: <Info className="h-4 w-4" />,
  },
  warning: {
    wrap: "bg-[var(--a-amber-soft)] text-[#7c540f]",
    icon: <AlertTriangle className="h-4 w-4" />,
  },
};

export function InsightBanner({ tone, children, className }: InsightBannerProps) {
  const style = STYLES[tone];
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-2xl px-4 py-3 text-sm",
        style.wrap,
        className,
      )}
    >
      <span className="mt-0.5 shrink-0">{style.icon}</span>
      <div className="min-w-0">{children}</div>
    </div>
  );
}