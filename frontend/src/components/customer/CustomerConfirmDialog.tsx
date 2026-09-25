import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

interface CustomerConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
  isDestructive?: boolean;
}

export function CustomerConfirmDialog({
  isOpen,
  title,
  description,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  isLoading = false,
  isDestructive = false,
}: CustomerConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const titleId = "customer-confirm-title";
  const descId = "customer-confirm-desc";

  useEffect(() => {
    if (!isOpen) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const t = window.setTimeout(() => cancelRef.current?.focus(), 40);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isLoading) onCancel();
    };
    document.addEventListener("keydown", onKey);

    return () => {
      window.clearTimeout(t);
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen, isLoading, onCancel]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[rgba(20,22,26,0.45)] p-4 backdrop-blur-sm"
      onClick={() => {
        if (!isLoading) onCancel();
      }}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        onClick={(e) => e.stopPropagation()}
        className="glass-strong w-full max-w-md overflow-hidden rounded-3xl"
        style={{
          animation:
            "fade-up 180ms cubic-bezier(0.16, 1, 0.3, 1) both, dialog-scale 180ms cubic-bezier(0.16, 1, 0.3, 1) both",
        }}
      >
        <div className="flex items-start gap-3 px-6 pt-6">
          {isDestructive ? (
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-negative-soft)]">
              <AlertTriangle className="h-4 w-4 text-[var(--color-negative)]" />
            </span>
          ) : null}
          <div className="min-w-0">
            <h2
              id={titleId}
              className="font-display text-lg font-semibold tracking-tight text-[var(--color-ink)]"
            >
              {title}
            </h2>
            <p
              id={descId}
              className="mt-2 text-sm leading-6 text-[var(--color-ink-muted)]"
            >
              {description}
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-2 border-t border-[rgba(20,22,26,0.06)] bg-white/40 px-6 py-4 sm:flex-row sm:justify-end">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="inline-flex items-center justify-center rounded-full border border-[rgba(20,22,26,0.10)] bg-white px-4 py-2.5 text-sm font-semibold text-[var(--color-ink)] transition hover:border-[rgba(20,22,26,0.2)] disabled:opacity-60"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={cn(
              "inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold text-white transition disabled:opacity-60",
              isDestructive
                ? "bg-[var(--color-negative)] hover:brightness-95"
                : "bg-[var(--color-charcoal)] hover:opacity-90",
            )}
          >
            {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            {confirmLabel}
          </button>
        </div>
      </div>
      <style>{`
        @keyframes dialog-scale {
          from { transform: scale(0.98); }
          to { transform: scale(1); }
        }
      `}</style>
    </div>,
    document.body,
  );
}