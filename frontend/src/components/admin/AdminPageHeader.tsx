
import type { ReactNode } from "react";

interface AdminPageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}

export function AdminPageHeader({
  eyebrow,
  title,
  description,
  actions,
}: AdminPageHeaderProps) {
  return (
    <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow ? (
          <p className="inline-flex items-center gap-2 rounded-full border border-[var(--a-border)] bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--a-ink-3)]">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="mt-3 break-words text-3xl font-semibold tracking-tight text-[var(--a-ink)]">
          {title}
        </h1>
        {description ? (
          <p className="mt-2 max-w-2xl break-words text-sm leading-6 text-[var(--a-ink-2)]">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </header>
  );
}
