import type { ReactNode } from "react";
import { cn } from "cn";
// import { Button } from "./ui/button";

interface PlanCardProps {
  name: string;
  description: string;
  priceFormatted: string;
  interval: string; // e.g., "per month", "per year"
  primaryAction?: ReactNode;
  secondaryAction?: ReactNode;
  className?: string;
  isPopular?: boolean;
}

export function PlanCard({
  name,
  description,
  priceFormatted,
  interval,
  primaryAction,
  secondaryAction,
  className,
  isPopular,
}: PlanCardProps) {
  return (
    <div 
      className={cn(
        "relative flex flex-col rounded-2xl border bg-white p-6 shadow-sm",
        isPopular ? "border-indigo-200 shadow-md ring-1 ring-indigo-50" : "border-gray-200",
        className
      )}
    >
      {isPopular && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-indigo-100 px-3 py-0.5 text-xs font-semibold text-indigo-700">
          Most Popular
        </span>
      )}
      
      <h3 className="text-xl font-semibold text-gray-900">{name}</h3>
      <p className="mt-2 min-h-[40px] text-sm text-gray-500">{description}</p>
      
      <div className="my-6 flex items-baseline gap-1">
        <span className="text-4xl font-bold tracking-tight text-gray-900">{priceFormatted}</span>
        <span className="text-sm font-medium text-gray-500">/ {interval}</span>
      </div>

      <div className="mt-auto flex flex-col gap-3">
        {primaryAction}
        {secondaryAction}
      </div>
    </div>
  );
}
