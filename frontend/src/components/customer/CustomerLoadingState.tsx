import { Loader2 } from "lucide-react";

interface CustomerLoadingStateProps {
  message?: string;
}

export function CustomerLoadingState({
  message = "Loading…",
}: CustomerLoadingStateProps) {
  return (
    <div className="glass flex flex-col items-center justify-center gap-3 rounded-3xl px-6 py-16">
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/70">
        <Loader2 className="h-5 w-5 animate-spin text-[var(--color-ink)]" />
      </span>
      <p className="text-sm font-medium text-[var(--color-ink-muted)]">
        {message}
      </p>
    </div>
  );
}