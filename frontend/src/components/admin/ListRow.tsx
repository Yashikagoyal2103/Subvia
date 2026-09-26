import type { ReactNode } from "react";
import { Link } from "react-router-dom";

import { cn } from "@/lib/utils";
import { IconBadge, type AdminTone } from "./IconBadge";

interface ListRowProps {
  icon?: ReactNode;
  leadingBadgeTone?: AdminTone;
  title: ReactNode;
  subtitle?: ReactNode;
  trailing?: ReactNode;
  href?: string;
  onClick?: () => void;
  className?: string;
}

export function ListRow({
  icon,
  leadingBadgeTone = "indigo",
  title,
  subtitle,
  trailing,
  href,
  onClick,
  className,
}: ListRowProps) {
  const body = (
    <>
      {icon ? (
        <IconBadge icon={icon} tone={leadingBadgeTone} size="sm" />
      ) : null}

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-[var(--a-ink)]">
          {title}
        </p>
        {subtitle ? (
          <p className="mt-0.5 truncate text-xs text-[var(--a-ink-3)]">
            {subtitle}
          </p>
        ) : null}
      </div>

      {trailing ? (
        <div className="ml-3 flex shrink-0 items-center gap-3">{trailing}</div>
      ) : null}
    </>
  );

  const baseClasses = cn(
    "flex items-center gap-3 px-2 py-3 transition-colors",
    (href || onClick) && "cursor-pointer rounded-xl hover:bg-[rgba(15,15,10,0.03)]",
    className,
  );

  if (href) {
    return (
      <Link to={href} className={baseClasses}>
        {body}
      </Link>
    );
  }

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={cn(baseClasses, "w-full text-left")}>
        {body}
      </button>
    );
  }

  return <div className={baseClasses}>{body}</div>;
}