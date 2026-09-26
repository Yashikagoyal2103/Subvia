import type { ElementType, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface AdminCardProps {
  variant?: "default" | "flush";
  interactive?: boolean;
  className?: string;
  children: ReactNode;
  as?: ElementType;
}

export function AdminCard({
  variant = "default",
  interactive = false,
  className,
  children,
  as,
}: AdminCardProps) {
  const Component = (as ?? "div") as ElementType;
  return (
    <Component
      className={cn(
        "a-card",
        interactive && "a-card-interactive",
        variant === "default" && "p-6",
        variant === "flush" && "p-0",
        className,
      )}
    >
      {children}
    </Component>
  );
}