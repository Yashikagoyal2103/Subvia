import type { ReactNode } from "react";
import { cn } from "cn";
import { StatusBadge } from "./status-badge";

interface ServiceCardProps {
  name: string;
  description: string;
  isActive: boolean;
  planCount?: number;
  action?: ReactNode;
  className?: string;
}

export function ServiceCard({
  name,
  description,
  isActive,
  planCount,
  action,
  className,
}: ServiceCardProps) {
  return (
    <div className={cn("flex flex-col rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md", className)}>
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{name}</h3>
          <p className="mt-1 text-sm text-gray-500 line-clamp-2">{description}</p>
        </div>
        <StatusBadge status={isActive ? "ACTIVE" : "INACTIVE"} />
      </div>
      
      <div className="mt-auto flex items-center justify-between pt-4">
        {planCount !== undefined ? (
          <span className="text-sm font-medium text-gray-600">
            {planCount} {planCount === 1 ? "plan" : "plans"}
          </span>
        ) : (
          <span />
        )}
        {action && <div>{action}</div>}
      </div>
    </div>
  );
}
