import type { ReactNode } from "react";
import { cn } from "cn";
import { Link } from "react-router-dom";

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
        "group flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        isActive 
          ? "bg-indigo-50 text-indigo-700" 
          : "text-gray-700 hover:bg-gray-100 hover:text-gray-900",
        className
      )}
    >
      <div className="flex items-center gap-3">
        {icon && (
          <div className={cn(
            "flex-shrink-0",
            isActive ? "text-indigo-700" : "text-gray-400 group-hover:text-gray-600"
          )}>
            {icon}
          </div>
        )}
        <span className="truncate">{label}</span>
      </div>
      
      {badge !== undefined && (
        <span
          className={cn(
            "ml-auto inline-block rounded-full px-2 py-0.5 text-xs font-semibold",
            isActive
              ? "bg-indigo-100 text-indigo-700"
              : "bg-gray-100 text-gray-600 group-hover:bg-gray-200"
          )}
        >
          {badge}
        </span>
      )}
    </Link>
  );
}
