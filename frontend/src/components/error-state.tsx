import { AlertTriangle, RotateCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface ErrorStateProps {
  title?: string;
  description?: string;
  retryAction?: () => void;
  className?: string;
}

export function ErrorState({
  title = "Something went wrong",
  description,
  retryAction,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-2xl",
        "border border-rose-100 bg-white/80 px-6 py-12 text-center",
        "shadow-[var(--shadow-soft)]",
        className,
      )}
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-50">
        <AlertTriangle className="h-5 w-5 text-rose-500" />
      </span>
      <div className="space-y-1">
        <p className="text-sm font-semibold text-[var(--color-ink)]">{title}</p>
        {description ? (
          <p className="max-w-md text-sm text-[var(--color-ink-muted)]">
            {description}
          </p>
        ) : null}
      </div>
      {retryAction ? (
        <button
          type="button"
          onClick={retryAction}
          className="mt-1 inline-flex items-center gap-2 rounded-full bg-[var(--color-ink)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--color-surface-dark)]"
        >
          <RotateCw className="h-3.5 w-3.5" />
          Try again
        </button>
      ) : null}
    </div>
  );
}