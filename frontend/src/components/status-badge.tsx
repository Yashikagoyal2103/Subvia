import { cn } from "cn";

export type StatusType = 
  | "ACTIVE" | "PENDING" | "PAST_DUE" 
  | "CANCELLED" | "OPEN" | "PAID" 
  | "FAILED" | "SUCCESS" | "INACTIVE";

interface StatusBadgeProps {
  status: StatusType | string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const normalizedStatus = status.toUpperCase();
  
  let styles = "bg-gray-100 text-gray-700 border-gray-200";
  
  switch (normalizedStatus) {
    case "ACTIVE":
    case "SUCCESS":
    case "PAID":
      styles = "bg-green-50 text-green-700 border-green-200";
      break;
    case "PENDING":
    case "OPEN":
      styles = "bg-amber-50 text-amber-700 border-amber-200";
      break;
    case "PAST_DUE":
    case "FAILED":
    case "CANCELLED":
      styles = "bg-red-50 text-red-700 border-red-200";
      break;
    case "INACTIVE":
      styles = "bg-gray-50 text-gray-600 border-gray-200";
      break;
  }

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        styles,
        className
      )}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}
