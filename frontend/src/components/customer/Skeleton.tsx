import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-2xl bg-[rgba(20,22,26,0.06)]",
        className,
      )}
    />
  );
}

export function PageSkeleton() {
  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <Skeleton className="h-9 w-72" />
        <Skeleton className="h-4 w-48" />
      </div>
      <Skeleton className="h-[280px] w-full rounded-3xl" />
      <div className="grid gap-6 lg:grid-cols-12">
        <Skeleton className="h-80 rounded-3xl lg:col-span-7" />
        <Skeleton className="h-80 rounded-3xl lg:col-span-5" />
      </div>
    </div>
  );
}