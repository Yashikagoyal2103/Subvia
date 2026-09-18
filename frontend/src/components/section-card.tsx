import type { ReactNode } from "react";
import { cn } from "cn";

interface SectionCardProps {
  title?: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}

export function SectionCard({
  title,
  description,
  action,
  children,
  className,
  bodyClassName,
}: SectionCardProps) {
  return (
    <section className={cn("overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm", className)}>
      {(title || description || action) && (
        <div className="flex flex-col gap-4 border-b border-gray-100 bg-gray-50/50 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            {title && <h3 className="text-lg font-semibold text-gray-900">{title}</h3>}
            {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      <div className={cn("p-6", bodyClassName)}>
        {children}
      </div>
    </section>
  );
}
