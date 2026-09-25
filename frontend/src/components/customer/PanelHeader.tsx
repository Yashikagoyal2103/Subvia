import type { ReactNode } from "react";

interface PanelHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

export function PanelHeader({ title, description, action }: PanelHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-[rgba(20,22,26,0.06)] px-6 py-5">
      <div className="min-w-0">
        <h2 className="text-sm font-semibold tracking-tight text-[var(--color-ink)]">
          {title}
        </h2>
        {description ? (
          <p className="mt-0.5 text-xs text-[var(--color-ink-muted)]">{description}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}