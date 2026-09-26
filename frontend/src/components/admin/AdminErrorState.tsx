import { AlertTriangle, RotateCw } from "lucide-react";

interface AdminErrorStateProps {
  message: string;
  onRetry?: () => void;
}

export function AdminErrorState({ message, onRetry }: AdminErrorStateProps) {
  return (
    <div className="a-card flex flex-col items-center justify-center px-6 py-14 text-center">
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--a-rose-soft)] text-[var(--a-rose)]">
        <AlertTriangle className="h-5 w-5" />
      </span>
      <p className="mt-4 text-sm font-semibold text-[var(--a-ink)]">
        {message}
      </p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 inline-flex items-center gap-2 rounded-full bg-[var(--a-ink)] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
        >
          <RotateCw className="h-3.5 w-3.5" />
          Try again
        </button>
      ) : null}
    </div>
  );
}