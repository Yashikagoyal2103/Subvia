import { cn } from "cn";
import type { Plan } from "../../api/plans";

interface PlanCardProps {
  plan: Plan;
  action?: React.ReactNode;
  className?: string;
}

const CURRENCY_SYMBOL: Record<string, string> = {
  INR: "₹",
  USD: "$",
};

const INTERVAL_LABEL: Record<string, string> = {
  MONTHLY: "month",
  YEARLY: "year",
};

function formatMinorUnits(amount: number, currency: string): string {
  const symbol = CURRENCY_SYMBOL[currency] ?? currency;
  const value = (amount / 100).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${symbol}${value}`;
}

export function PlanCard({ plan, action, className }: PlanCardProps) {
  const formattedPrice = formatMinorUnits(plan.price, plan.currency);
  const intervalLabel = INTERVAL_LABEL[plan.interval] ?? plan.interval.toLowerCase();

  return (
    <div
      className={cn(
        "relative flex flex-col rounded-xl border border-gray-200 bg-white p-6 shadow-sm",
        "transition-shadow duration-200 hover:shadow-md",
        !plan.isActive && "opacity-60",
        className
      )}
    >
      {/* Top accent */}
      <div className="absolute inset-x-0 top-0 h-0.5 rounded-t-xl bg-gradient-to-r from-indigo-400 to-purple-400" />

      {/* Plan name + status */}
      <div className="mb-3 flex items-start justify-between gap-2">
        <h3 className="text-lg font-semibold text-gray-900 leading-tight">{plan.name}</h3>
        {!plan.isActive && (
          <span className="mt-0.5 shrink-0 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-500 border border-gray-200">
            Inactive
          </span>
        )}
      </div>

      {/* Description */}
      <p className="mb-6 min-h-[40px] text-sm text-gray-500 line-clamp-2">
        {plan.description || "A subscription plan for this service."}
      </p>

      {/* Price block */}
      <div className="mb-1 flex items-baseline gap-1">
        <span className="text-4xl font-bold tracking-tight text-gray-900">
          {formattedPrice}
        </span>
        <span className="text-sm font-medium text-gray-400">/ {intervalLabel}</span>
      </div>

      <p className="mb-6 text-xs font-medium tracking-wide text-gray-400 uppercase">
        Billed {plan.interval.toLowerCase()}
      </p>

      {/* CTA slot */}
      {action && <div className="mt-auto">{action}</div>}
    </div>
  );
}
