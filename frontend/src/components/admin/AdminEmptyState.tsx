import type { ComponentType, ReactNode } from "react";

interface AdminEmptyStateProps {
  icon: ComponentType<{ className?: string }>;
  title: string;
  description: string;
  action?: ReactNode;
}

export function AdminEmptyState({
  icon: Icon,
  title,
  description,
  action,
}: AdminEmptyStateProps) {
  return (
    <div className="a-card flex flex-col items-center justify-center px-6 py-16 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--a-indigo-soft)] text-[var(--a-indigo)]">
        <Icon className="h-5 w-5" />
      </span>
      <h2 className="mt-4 text-base font-semibold text-[var(--a-ink)]">
        {title}
      </h2>
      <p className="mt-1 max-w-md text-sm text-[var(--a-ink-2)]">
        {description}
      </p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}