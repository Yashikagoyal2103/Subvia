import { cn } from "@/lib/utils";
import { CheckCircle2, XCircle, Clock } from "lucide-react";
import type { ReactNode } from "react";

export type PaymentStatus = "SUCCESS" | "FAILED" | "PENDING";

interface PaymentResultCardProps {
  status: PaymentStatus;
  title: string;
  description: string;
  amount?: string;
  action?: ReactNode;
  className?: string;
}

export function PaymentResultCard({
  status,
  title,
  description,
  amount,
  action,
  className,
}: PaymentResultCardProps) {
  const isSuccess = status === "SUCCESS";
  const isFailed = status === "FAILED";
  const isPending = status === "PENDING";

  return (
    <div className={cn("flex flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm", className)}>
      <div
        className={cn(
          "mb-5 flex h-16 w-16 items-center justify-center rounded-full",
          isSuccess && "bg-green-100 text-green-600",
          isFailed && "bg-red-100 text-red-600",
          isPending && "bg-amber-100 text-amber-600"
        )}
      >
        {isSuccess && <CheckCircle2 className="h-8 w-8" />}
        {isFailed && <XCircle className="h-8 w-8" />}
        {isPending && <Clock className="h-8 w-8" />}
      </div>
      
      <h3 className="mb-2 text-2xl font-semibold tracking-tight text-gray-900">{title}</h3>
      <p className="mb-6 max-w-sm text-gray-500">{description}</p>
      
      {amount && (
        <div className="mb-8 rounded-xl bg-gray-50 px-6 py-4 border border-gray-100">
          <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">Amount</span>
          <div className="mt-1 text-3xl font-semibold text-gray-900">{amount}</div>
        </div>
      )}
      
      {action && <div className="w-full sm:w-auto">{action}</div>}
    </div>
  );
}
