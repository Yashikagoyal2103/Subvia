import { AlertCircle } from "lucide-react";
import { cn } from "cn";
import { Button } from "./ui/button";
import type { ReactNode } from "react";

interface ErrorStateProps {
  title?: string;
  description: string;
  retryAction?: () => void;
  actionNode?: ReactNode;
  className?: string;
}

export function ErrorState({ title = "Something went wrong", description, retryAction, actionNode, className }: ErrorStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center rounded-xl border border-red-100 bg-red-50/30 p-8 text-center", className)}>
      <AlertCircle className="mb-4 h-10 w-10 text-red-500" />
      <h3 className="mb-2 text-lg font-medium text-gray-900">{title}</h3>
      <p className="mb-6 max-w-md text-sm text-gray-600">{description}</p>
      {retryAction ? (
        <Button variant="outline" onClick={retryAction}>Try again</Button>
      ) : actionNode ? (
        actionNode
      ) : null}
    </div>
  );
}
