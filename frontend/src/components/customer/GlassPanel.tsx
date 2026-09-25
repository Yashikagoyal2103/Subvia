import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface GlassPanelProps {
  children: ReactNode;
  className?: string;
  strong?: boolean;
}

export function GlassPanel({ children, className, strong }: GlassPanelProps) {
  return (
    <div
      className={cn(
        strong ? "glass-strong" : "glass",
        "rounded-3xl",
        className,
      )}
    >
      {children}
    </div>
  );
}