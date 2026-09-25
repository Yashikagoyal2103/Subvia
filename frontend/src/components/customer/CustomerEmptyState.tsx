import type { ComponentType, ReactNode } from "react";

interface CustomerEmptyStateProps {
  icon: ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function CustomerEmptyState({
  icon: Icon,
  title,
  description,
  action,
}: CustomerEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-[rgba(20,22,26,0.14)] bg-white/40 px-6 py-14 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/80 text-[var(--color-ink-muted)] ring-1 ring-white/60">
        <Icon className="h-5 w-5" />
      </span>
      <p className="mt-4 text-sm font-semibold text-[var(--color-ink)]">{title}</p>
      {description ? (
        <p className="mt-1 max-w-md text-sm text-[var(--color-ink-muted)]">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}