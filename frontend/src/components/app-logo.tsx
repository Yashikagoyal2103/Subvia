import { cn } from "@/lib/utils";

interface AppLogoProps {
  className?: string;
  /**
   * mark         → square icon only (for compact navs / avatars)
   * wordmark     → icon + "Subvia" text (default, for light bg)
   * full         → full lockup with tagline
   * wordmark-light → icon + "Subvia" text, for dark backgrounds
   */
  variant?: "mark" | "wordmark" | "wordmark-light" | "full";
  alt?: string;
}

const SRC: Record<NonNullable<AppLogoProps["variant"]>, string> = {
  mark: "/branding/subvia-mark.png",
  wordmark: "/branding/subvia-logo.png",
  "wordmark-light": "/branding/subvia-logo-light.png",
  full: "/branding/subvia-logo-full.png",
};

const ALT: Record<NonNullable<AppLogoProps["variant"]>, string> = {
  mark: "Subvia",
  wordmark: "Subvia",
  "wordmark-light": "Subvia",
  full: "Subvia — Subscriptions. Simplified.",
};

export function AppLogo({
  className,
  variant = "wordmark",
  alt,
}: AppLogoProps) {
  return (
    <img
      src={SRC[variant]}
      alt={alt ?? ALT[variant]}
      // Prevent layout shift — real aspect ratio comes from the file.
      width={variant === "mark" ? 32 : 132}
      height={variant === "mark" ? 32 : 32}
      decoding="async"
      className={cn(
        "block w-auto object-contain select-none",
        variant === "mark" && "h-8",
        variant === "wordmark" && "h-8",
        variant === "wordmark-light" && "h-8",
        variant === "full" && "h-auto max-w-full",
        className,
      )}
    />
  );
}