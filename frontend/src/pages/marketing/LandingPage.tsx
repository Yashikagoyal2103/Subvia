import { Link } from "react-router-dom";

export function LandingPage() {
  return (
    <div className="app-canvas flex min-h-screen flex-col items-center justify-center px-6 py-16">
      <div className="flex items-center gap-2.5">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-accent)] text-sm font-bold text-[var(--color-accent-foreground)]">
          B
        </span>
        <span className="text-lg font-semibold tracking-tight text-[var(--color-ink)]">
          BillingOS
        </span>
      </div>

      <p className="mt-10 max-w-xl text-center text-2xl font-medium tracking-tight text-[var(--color-ink)] sm:text-3xl">
        Subscription billing infrastructure for modern businesses.
      </p>

      <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row">
        <Link
          to="/register"
          className="inline-flex items-center gap-2 rounded-full bg-[var(--color-accent)] px-6 py-3 text-sm font-semibold text-[var(--color-accent-foreground)] shadow-[var(--shadow-card)] transition hover:brightness-105"
        >
          Create an account
        </Link>
        <Link
          to="/login"
          className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border-soft)] bg-white px-6 py-3 text-sm font-semibold text-[var(--color-ink)] transition hover:border-[var(--color-border-strong)]"
        >
          Log in
        </Link>
      </div>
    </div>
  );
}