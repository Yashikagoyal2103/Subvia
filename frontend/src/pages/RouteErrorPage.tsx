import { Link, isRouteErrorResponse, useRouteError } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import { AppLogo } from "@/components/app-logo"; 

export function RouteErrorPage() {
  const error = useRouteError();
  const notFound = isRouteErrorResponse(error) && error.status === 404;

  return (
    <div className="min-h-screen bg-[var(--color-canvas)] px-6 py-16 text-[var(--color-ink)]">
      <div className="mx-auto flex min-h-[70vh] max-w-lg flex-col items-center justify-center text-center">
         <AppLogo className="mb-6 h-8" />
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-surface)] text-[var(--color-ink-muted)] shadow-sm ring-1 ring-black/5">
          <AlertTriangle className="h-6 w-6" />
        </span>
        <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-ink-subtle)]">
          Subvia
        </p>
        <h1 className="font-display mt-2 text-3xl font-semibold tracking-tight">
          {notFound ? "Page not found" : "We couldn't open this page"}
        </h1>
        <p className="mt-3 max-w-md text-sm leading-6 text-[var(--color-ink-muted)]">
          {notFound
            ? "The page you're looking for doesn't exist or may have moved."
            : "Something unexpected happened while opening this page. Please try again from your dashboard."}
        </p>
        <Link
          to="/"
          className="mt-6 rounded-full bg-[var(--color-charcoal)] px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
        >
          Back to Subvia
        </Link>
      </div>
    </div>
  );
}
