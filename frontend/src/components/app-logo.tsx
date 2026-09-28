
import { Hexagon } from "lucide-react";
import { cn } from "cn";

interface AppLogoProps {
  className?: string;
  variant?: "full" | "compact";
}

export function AppLogo({ className, variant = "full" }: AppLogoProps) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-sm">
        <Hexagon className="h-5 w-5" />
      </div>
      {variant === "full" && (
        <span className="text-lg font-semibold tracking-tight text-gray-900">
          Subvia
        </span>
      )}
    </div>
  );
}

