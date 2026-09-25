import { formatMoneyParts } from "@/lib/format";
import { cn } from "@/lib/utils";

type MoneySize = "sm" | "md" | "lg" | "xl" | "hero";

interface MoneyTextProps {
  amount: number;
  currency: string;
  size?: MoneySize;
  className?: string;
}

const SIZES: Record<MoneySize, string> = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-xl",
  xl: "text-2xl",
  hero: "text-4xl sm:text-5xl",
};

export function MoneyText({
  amount,
  currency,
  size = "md",
  className,
}: MoneyTextProps) {
  const { symbol, whole, decimals, negative } = formatMoneyParts(amount, currency);

  return (
    <span
      className={cn(
        "font-display tabular-nums tracking-tight text-[var(--color-ink)]",
        SIZES[size],
        className,
      )}
    >
      <span className="mr-0.5">
        {negative ? "-" : ""}
        {symbol}
      </span>
      {whole}
      {decimals ? (
        <span className="text-[var(--color-ink-subtle)]">{decimals}</span>
      ) : null}
    </span>
  );
}