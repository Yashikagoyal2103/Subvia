import { AlertTriangle, RotateCw } from "lucide-react";

interface CustomerErrorStateProps {
  title?: string;
  description?: string;
  retryAction?: () => void;
}

export function CustomerErrorState({
  title = "Something went wrong",
  description,
  retryAction,
}: CustomerErrorStateProps) {
  return (
    <div className="glass flex flex-col items-center justify-center gap-3 rounded-3xl px-6 py-14 text-center">
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-negative-soft)]">
        <AlertTriangle className="h-5 w-5 text-[var(--color-negative)]" />
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
          className="mt-1 inline-flex items-center gap-2 rounded-full bg-[var(--color-charcoal)] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
        >
          <RotateCw className="h-3.5 w-3.5" />
          Try again
        </button>
      ) : null}
    </div>
  );
}