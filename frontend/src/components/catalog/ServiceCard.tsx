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
        "group relative flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white p-6 shadow-sm",
        "transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md",
        className
      )}
    >
      {/* Active indicator stripe */}
      {service.isActive && (
        <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-indigo-500 to-purple-500" />
      )}

      {/* Icon + arrow row */}
      <div className="mb-5 flex items-start justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100 transition-colors group-hover:bg-indigo-100">
          <Package2 className="h-5 w-5" />
        </div>

        <ArrowRight className="h-4 w-4 translate-x-0 text-gray-300 transition-all duration-200 group-hover:translate-x-1 group-hover:text-indigo-500" />
      </div>

      {/* Content */}
      <h2 className="text-base font-semibold text-gray-900">{service.name}</h2>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-gray-500 line-clamp-3">
        {service.description || "Explore subscription plans for this service."}
      </p>

      {/* CTA */}
      <div className="mt-5 flex items-center gap-1.5 text-sm font-medium text-indigo-600 transition-colors group-hover:text-indigo-700">
        View plans
        <ArrowRight className="h-3.5 w-3.5 translate-x-0 transition-transform duration-200 group-hover:translate-x-0.5" />
      </div>
    </Link>
  );
}
