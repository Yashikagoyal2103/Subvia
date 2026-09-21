import type { ReactNode } from "react";
import { cn } from "cn";
import { Button } from "./ui/button";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel?: () => void;
  onClose?: () => void;
  isLoading?: boolean;
  isDestructive?: boolean;
  className?: string;
  children?: ReactNode;
}

export function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  onClose,
  isLoading,
  isDestructive,
  className,
  children,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className={cn(
          "w-full max-w-md rounded-2xl bg-white p-6 shadow-xl animate-in zoom-in-95 duration-200",
          className
        )}
      >
        <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
        <p className="mt-3 text-sm text-gray-600 leading-relaxed">{description}</p>
        
        {children}

        <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button 
            variant="outline" 
            onClick={onCancel ?? onClose}
            disabled={isLoading}
            className="sm:w-auto"
          >
            {cancelLabel}
          </Button>
          <Button
            variant={isDestructive ? "destructive" : "default"}
            onClick={onConfirm}
            disabled={isLoading}
            className={cn("sm:w-auto", !isDestructive && "bg-indigo-600 hover:bg-indigo-700")}
          >
            {isLoading ? "Loading..." : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
