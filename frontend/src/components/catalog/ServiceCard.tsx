import { ArrowRight, Package2 } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "cn";
import type { Service } from "../../api/services";

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
        "group relative flex min-h-59.5 flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white/80 p-6 shadow-[0_12px_30px_-24px_rgba(15,23,42,0.55)] backdrop-blur-sm",
        "transition-all duration-200 hover:-translate-y-1 hover:border-indigo-200 hover:bg-white hover:shadow-[0_18px_38px_-24px_rgba(79,70,229,0.45)]",
        className
      )}
    >
      {/* Active indicator stripe */}
      {service.isActive && (
        <div className="absolute inset-x-0 top-0 h-0.5 bg-linear-to-r from-indigo-500 to-purple-500" />
      )}

      {/* Icon + arrow row */}
      <div className="mb-5 flex items-start justify-between">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-linear-to-br from-indigo-50 to-cyan-50 text-indigo-600 ring-1 ring-indigo-100 transition-colors group-hover:from-indigo-100 group-hover:to-cyan-100">
          <Package2 className="h-5 w-5" />
        </div>

        <ArrowRight className="h-4 w-4 translate-x-0 text-gray-300 transition-all duration-200 group-hover:translate-x-1 group-hover:text-indigo-500" />
      </div>

      {/* Content */}
      <h2 className="text-[17px] font-semibold tracking-tight text-slate-900">{service.name}</h2>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-500 line-clamp-3">
        {service.description || "Explore subscription plans for this service."}
      </p>

      {/* CTA */}
      <div className="mt-5 flex items-center gap-1.5 text-sm font-medium text-indigo-600 transition-colors group-hover:text-indigo-700">
        Explore plans
        <ArrowRight className="h-3.5 w-3.5 translate-x-0 transition-transform duration-200 group-hover:translate-x-0.5" />
      </div>
    </Link>
  );
}
