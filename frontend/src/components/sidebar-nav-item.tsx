import type { ReactNode } from "react";
import { Link } from "react-router-dom";

import { cn } from "@/lib/utils";

interface SidebarNavItemProps {
  icon?: ReactNode;
  label: string;
  href: string;
  isActive?: boolean;
  badge?: string | number;
  className?: string;
}

export function SidebarNavItem({
  icon,
  label,
  href,
  isActive,
  badge,
  className,
}: SidebarNavItemProps) {
  return (
    <Link
      to={href}
      className={cn(
        "group relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
        isActive
          ? "bg-[var(--a-indigo-soft)] text-[var(--a-indigo)]"
          : "text-[var(--a-ink-2)] hover:bg-[rgba(15,15,10,0.035)] hover:text-[var(--a-ink)]",
        className,
      )}
    >
      {isActive ? (
        <span
          aria-hidden
          className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-[var(--a-indigo)]"
        />
      ) : null}

      {icon ? (
        <span
          className={cn(
            "flex h-4 w-4 shrink-0 items-center justify-center transition-colors",
            isActive
              ? "text-[var(--a-indigo)]"
              : "text-[var(--a-ink-3)] group-hover:text-[var(--a-ink-2)]",
          )}
        >
          {icon}
        </span>
      ) : null}

      <span className="truncate">{label}</span>

      {badge !== undefined ? (
        <span
          className={cn(
            "ml-auto inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold tabular-nums",
            isActive
              ? "bg-white text-[var(--a-indigo)]"
              : "bg-[rgba(15,15,10,0.06)] text-[var(--a-ink-2)]",
          )}
        >
          {badge}
        </span>
      ) : null}
    </Link>
  );
}