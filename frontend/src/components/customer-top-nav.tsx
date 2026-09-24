import { Link, NavLink, useLocation } from "react-router-dom";
import {
  CreditCard,
  FileText,
  LayoutGrid,
  Receipt,
  WalletCards,
} from "lucide-react";

import { cn } from "@/lib/utils";

const LINKS = [
  { to: "/customer/explore", label: "Explore", icon: LayoutGrid },
  { to: "/customer/plans", label: "Plans", icon: CreditCard },
  { to: "/customer/subscriptions", label: "Subscriptions", icon: WalletCards },
  { to: "/customer/invoices", label: "Invoices", icon: Receipt },
  { to: "/customer/billing", label: "Billing", icon: FileText },
];

export function CustomerTopNav() {
  const location = useLocation();

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--color-border-soft)] bg-[var(--color-surface)]/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        <Link to="/customer" className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-ink)] text-[11px] font-bold text-[var(--color-accent)]">
            SB
          </span>

          <span className="hidden text-sm font-semibold tracking-tight text-[var(--color-ink)] sm:inline">
            Billing
          </span>
        </Link>

        <nav className="ml-2 hidden items-center gap-1 md:flex">
          {LINKS.map(({ to, label, icon: Icon }) => {
            const active =
              location.pathname === to ||
              location.pathname.startsWith(`${to}/`);

            return (
              <NavLink
                key={to}
                to={to}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-medium transition",
                  active
                    ? "bg-[var(--color-accent)] text-[var(--color-accent-foreground)] shadow-[var(--shadow-pill)]"
                    : "text-[var(--color-ink-muted)] hover:bg-white hover:text-[var(--color-ink)]",
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </NavLink>
            );
          })}
        </nav>

        <div className="ml-auto">
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--color-border-soft)] bg-white text-sm font-semibold text-[var(--color-ink)] transition hover:border-[var(--color-border-strong)]"
            aria-label="Account"
          >
            U
          </button>
        </div>
      </div>

      <nav className="flex items-center gap-1 overflow-x-auto px-4 pb-3 md:hidden">
        {LINKS.map(({ to, label, icon: Icon }) => {
          const active =
            location.pathname === to ||
            location.pathname.startsWith(`${to}/`);

          return (
            <NavLink
              key={to}
              to={to}
              className={cn(
                "inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition",
                active
                  ? "bg-[var(--color-accent)] text-[var(--color-accent-foreground)]"
                  : "text-[var(--color-ink-muted)] hover:bg-white",
              )}
            >
              <Icon className="h-3 w-3" />
              {label}
            </NavLink>
          );
        })}
      </nav>
    </header>
  );
}