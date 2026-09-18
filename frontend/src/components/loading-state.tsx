import { Loader2 } from "lucide-react";
import { cn } from "cn";

interface LoadingStateProps {
  className?: string;
  message?: string;
}

export function LoadingState({ className, message = "Loading..." }: LoadingStateProps) {
  return (
    <div className={cn("flex min-h-[200px] flex-col items-center justify-center p-8", className)}>
      <Loader2 className="mb-4 h-8 w-8 animate-spin text-gray-400" />
      <p className="text-sm font-medium text-gray-500">{message}</p>
    </div>
  );
}
