import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingStateProps {
  message?: string;
  className?: string;
}

export function LoadingState({
  message = "Loading…",
  className,
}: LoadingStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-2xl",
        "border border-[var(--color-border-soft)] bg-white/70 px-6 py-14",
        "shadow-[var(--shadow-soft)] backdrop-blur-sm",
        className,
      )}
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-accent-soft)]">
        <Loader2 className="h-5 w-5 animate-spin text-[var(--color-ink)]" />
      </span>
      <p className="text-sm font-medium text-[var(--color-ink-muted)]">{message}</p>
    </div>
  );
}