import { AlertTriangle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
  isDestructive?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  isLoading = false,
  isDestructive = false,
  className,
  children,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-ink)]/40 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      <div
        className={cn(
          "w-full max-w-lg overflow-hidden rounded-2xl border border-[var(--color-border-soft)] bg-white shadow-[var(--shadow-card)]",
          className,
        )}
      >
        <div className="flex items-start gap-3 border-b border-[var(--color-border-soft)] px-6 py-5">
          {isDestructive ? (
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-rose-50">
              <AlertTriangle className="h-4 w-4 text-rose-500" />
            </span>
          ) : null}
          <div className="min-w-0">
            <h2
              id="confirm-dialog-title"
              className="text-base font-semibold tracking-tight text-[var(--color-ink)]"
            >
              {title}
            </h2>
            <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
              {description}
            </p>
          </div>
        </div>

        {children ? (
          <div className="border-b border-[var(--color-border-soft)] px-6 py-5">
            {children}
          </div>
        ) : null}

        <div className="flex items-center justify-end gap-2 bg-[var(--color-surface)] px-6 py-4">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border-soft)] bg-white px-4 py-2 text-sm font-semibold text-[var(--color-ink)] transition hover:border-[var(--color-border-strong)] disabled:opacity-60"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={cn(
              "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition disabled:opacity-60",
              isDestructive
                ? "bg-rose-600 text-white hover:bg-rose-700"
                : "bg-[var(--color-ink)] text-white hover:bg-[var(--color-surface-dark)]",
            )}
          >
            {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}