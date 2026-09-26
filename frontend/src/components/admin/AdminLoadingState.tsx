import { cn } from "@/lib/utils";

type Variant = "cards" | "list" | "table" | "detail";

interface AdminLoadingStateProps {
  variant?: Variant;
  rows?: number;
}

export function AdminLoadingState({
  variant = "list",
  rows = 5,
}: AdminLoadingStateProps) {
  if (variant === "cards") {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="a-card p-5">
            <div className="h-9 w-9 animate-pulse rounded-full bg-[rgba(15,15,10,0.06)]" />
            <div className="mt-6 h-6 w-20 animate-pulse rounded bg-[rgba(15,15,10,0.06)]" />
            <div className="mt-2 h-3 w-24 animate-pulse rounded bg-[rgba(15,15,10,0.06)]" />
          </div>
        ))}
      </div>
    );
  }

  if (variant === "table") {
    return (
      <div className="a-card overflow-hidden">
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 border-b border-[var(--a-border)] px-6 py-4 last:border-b-0"
          >
            <div className="h-9 w-9 animate-pulse rounded-xl bg-[rgba(15,15,10,0.06)]" />
            <div className="h-3 flex-1 animate-pulse rounded bg-[rgba(15,15,10,0.06)]" />
            <div className="h-3 w-20 animate-pulse rounded bg-[rgba(15,15,10,0.06)]" />
          </div>
        ))}
      </div>
    );
  }

  if (variant === "detail") {
    return (
      <div className="space-y-6">
        <div className="a-card p-6">
          <div className="h-5 w-40 animate-pulse rounded bg-[rgba(15,15,10,0.06)]" />
          <div className="mt-3 h-4 w-64 animate-pulse rounded bg-[rgba(15,15,10,0.06)]" />
          <div className="mt-6 grid grid-cols-2 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-3 w-16 animate-pulse rounded bg-[rgba(15,15,10,0.06)]" />
                <div className="h-4 w-32 animate-pulse rounded bg-[rgba(15,15,10,0.06)]" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // list (default)
  return (
    <div className={cn("a-card overflow-hidden")}>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 border-b border-[var(--a-border)] px-5 py-4 last:border-b-0"
        >
          <div className="h-9 w-9 animate-pulse rounded-xl bg-[rgba(15,15,10,0.06)]" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-40 animate-pulse rounded bg-[rgba(15,15,10,0.06)]" />
            <div className="h-3 w-24 animate-pulse rounded bg-[rgba(15,15,10,0.06)]" />
          </div>
          <div className="h-3 w-14 animate-pulse rounded bg-[rgba(15,15,10,0.06)]" />
        </div>
      ))}
    </div>
  );
}