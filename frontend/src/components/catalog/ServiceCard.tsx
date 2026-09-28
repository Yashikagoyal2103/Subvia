
import { Link } from "react-router-dom";
import { ArrowUpRight, Sparkles } from "lucide-react";
import type { Service } from "@/api/services";
import { cn } from "@/lib/utils";

interface ServiceCardProps {
  service: Service;
  href: string;
  className?: string;
}

export function ServiceCard({ service, href, className }: ServiceCardProps) {
  return (
    <Link
      to={href}
      className={cn(
        "group relative flex min-w-0 flex-col justify-between overflow-hidden rounded-2xl",
        "border border-[var(--color-border-soft)] bg-white p-5",
        "shadow-[var(--shadow-soft)] transition hover:shadow-[var(--shadow-card)]",
        className,
      )}
    >
      <div>
        <div className="flex items-start justify-between">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-accent-soft)] text-[var(--color-ink)]">
            <Sparkles className="h-4 w-4" />
          </span>
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
              service.isActive
                ? "bg-emerald-50 text-emerald-700"
                : "bg-slate-100 text-slate-600",
            )}
          >
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                service.isActive ? "bg-emerald-500" : "bg-slate-400",
              )}
            />
            {service.isActive ? "Active" : "Inactive"}
          </span>
        </div>

        <h3 className="mt-4 break-words text-base font-semibold tracking-tight text-[var(--color-ink)]">
          {service.name}
        </h3>
        <p className="mt-1.5 break-words line-clamp-2 text-sm text-[var(--color-ink-muted)]">
          {service.description || "No description provided."}
        </p>
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-[var(--color-border-soft)] pt-3">
        <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-ink-subtle)]">
          View plans
        </span>
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-surface)] text-[var(--color-ink)] transition group-hover:bg-[var(--color-accent)]">
          <ArrowUpRight className="h-3.5 w-3.5" />
        </span>
      </div>
    </Link>
  );
}
