import { cn } from "@/lib/utils";

interface AppLogoProps {
  className?: string;
  variant?: "mark" | "wordmark" | "full";
  alt?: string;
}

const SRC = {
  mark: "/branding/subvia-mark.png",
  wordmark: "/branding/subvia-logo.png",
  full: "/branding/subvia-logo-full.png",
} as const;

const ALT = {
  mark: "Subvia",
  wordmark: "Subvia",
  full: "Subvia — Subscriptions. Simplified.",
} as const;

export function AppLogo({
  className,
  variant = "wordmark",
  alt,
}: AppLogoProps) {
  return (
    <img
      src={SRC[variant]}
      alt={alt ?? ALT[variant]}
      decoding="async"
      className={cn(
        "block w-auto select-none object-contain",
        variant === "mark" && "h-8 w-8",
        variant === "wordmark" && "h-8",
        variant === "full" && "h-auto max-w-full",
        className,
      )}
    />
  );
}
