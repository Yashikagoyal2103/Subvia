import type { ReactNode } from "react";

interface CustomerPageHeaderProps {
  eyebrow?: string;
  title: ReactNode;
  description?: string;
  actions?: ReactNode;
}

export function CustomerPageHeader({
  eyebrow,
  title,
  description,
  actions,
}: CustomerPageHeaderProps) {
  return (
    <header className="animate-fade-up flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow ? (
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-ink-subtle)]">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="font-display mt-1 text-3xl font-semibold tracking-tight text-[var(--color-ink)] sm:text-4xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--color-ink-muted)]">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 items-center gap-2">{actions}</div>
      ) : null}
    </header>
  );
}