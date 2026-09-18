import type { ReactNode } from "react";
import { cn } from "cn";
import { StatusBadge } from "./status-badge";
import type { StatusType } from "./status-badge";
import { FileText } from "lucide-react";

interface InvoiceStatusRowProps {
  invoiceNumber: string;
  amount: string;
  status: StatusType | string;
  date: string;
  action?: ReactNode;
  className?: string;
}

export function InvoiceStatusRow({
  invoiceNumber,
  amount,
  status,
  date,
  action,
  className,
}: InvoiceStatusRowProps) {
  return (
    <div className={cn("flex items-center justify-between rounded-lg border border-gray-100 bg-white p-4 transition-colors hover:bg-gray-50/80", className)}>
      <div className="flex items-center gap-4">
        <div className="hidden sm:flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-50 border border-gray-100 text-gray-400">
          <FileText className="h-5 w-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-900">{invoiceNumber}</span>
            <StatusBadge status={status} />
          </div>
          <p className="mt-0.5 text-sm text-gray-500">{date}</p>
        </div>
      </div>
      
      <div className="flex items-center gap-6">
        <span className="font-medium text-gray-900">{amount}</span>
        {action && <div>{action}</div>}
      </div>
    </div>
  );
}
