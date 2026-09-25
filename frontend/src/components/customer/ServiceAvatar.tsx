import { cn } from "@/lib/utils";

const GRADIENTS = [
  "linear-gradient(135deg, #f3d9b7, #e3b4a5)",
  "linear-gradient(135deg, #c9d8f3, #a8b7dd)",
  "linear-gradient(135deg, #d6e5d3, #a3c3a5)",
  "linear-gradient(135deg, #e8d0e4, #c9a6c5)",
  "linear-gradient(135deg, #f1dcc4, #dcb78a)",
  "linear-gradient(135deg, #d1dee8, #a4bdd1)",
  "linear-gradient(135deg, #ede2c8, #d4bd8e)",
  "linear-gradient(135deg, #d6d3ec, #b0abd9)",
];

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

interface ServiceAvatarProps {
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZE_MAP = {
  sm: "h-8 w-8 text-[11px] rounded-xl",
  md: "h-10 w-10 text-xs rounded-2xl",
  lg: "h-12 w-12 text-sm rounded-2xl",
} as const;

export function ServiceAvatar({
  name,
  size = "md",
  className,
}: ServiceAvatarProps) {
  const source = (name || "?").trim();
  const words = source.split(/\s+/).filter(Boolean);
  const initials =
    words.length >= 2
      ? (words[0][0] + words[1][0]).toUpperCase()
      : source.slice(0, 2).toUpperCase();

  const gradient = GRADIENTS[hashString(source) % GRADIENTS.length];

  return (
    <span
      aria-hidden
      className={cn(
        "flex shrink-0 items-center justify-center font-semibold text-[var(--color-ink)] ring-1 ring-white/60",
        SIZE_MAP[size],
        className,
      )}
      style={{ backgroundImage: gradient }}
    >
      {initials}
    </span>
  );
}