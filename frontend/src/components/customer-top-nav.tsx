import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import {
  Building2,
  ChevronDown,
  CreditCard,
  History,
  LayoutDashboard,
  Receipt,
  Sparkles,
  UserCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CustomerTopNavProps {
  businessId: string;
}

const PRIMARY_LINKS = (id: string) => [
  { to: `/customer/${id}/dashboard`,     label: "Dashboard",     icon: LayoutDashboard },
  { to: `/customer/${id}/services`,      label: "Services",      icon: Sparkles },
  { to: `/customer/${id}/subscriptions`, label: "Subscriptions", icon: CreditCard },
  { to: `/customer/${id}/invoices`,      label: "Invoices",      icon: Receipt },
];

const MORE_LINKS = (id: string) => [
  { to: `/customer/${id}/credits`, label: "Credits",         icon: CreditCard },
  { to: `/customer/${id}/billing`, label: "Billing History", icon: History },
];

export function CustomerTopNav({ businessId }: CustomerTopNavProps) {
  const location = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  // Close the dropdown on click outside — NOT onBlur (onBlur kills Link clicks).
  useEffect(() => {
    if (!moreOpen) return;
    const onMouseDown = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMoreOpen(false);
    };
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [moreOpen]);

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--color-border-soft)] bg-[var(--color-surface)]/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        <Link
          to={`/customer/${businessId}/dashboard`}
          className="flex items-center gap-2.5"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-ink)] text-[11px] font-bold text-[var(--color-accent)]">
            SB
          </span>
          <span className="hidden text-sm font-semibold tracking-tight text-[var(--color-ink)] sm:inline">
            Billing
          </span>
        </Link>

        <nav className="ml-2 hidden items-center gap-1 md:flex">
          {PRIMARY_LINKS(businessId).map(({ to, label, icon: Icon }) => {
            const active = location.pathname.startsWith(to);
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

          <div className="relative" ref={moreRef}>
            <button
              type="button"
              onClick={() => setMoreOpen((o) => !o)}
              className={cn(
                "inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-medium transition",
                moreOpen
                  ? "bg-white text-[var(--color-ink)]"
                  : "text-[var(--color-ink-muted)] hover:bg-white hover:text-[var(--color-ink)]",
              )}
              aria-haspopup="menu"
              aria-expanded={moreOpen}
            >
              More
              <ChevronDown className="h-3.5 w-3.5" />
            </button>

            {moreOpen ? (
              <div
                role="menu"
                className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-2xl border border-[var(--color-border-soft)] bg-white p-1.5 shadow-[var(--shadow-card)]"
              >
                {MORE_LINKS(businessId).map(({ to, label, icon: Icon }) => (
                  <Link
                    key={to}
                    to={to}
                    onClick={() => setMoreOpen(false)}
                    className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-[var(--color-ink)] transition hover:bg-[var(--color-surface)]"
                  >
                    <Icon className="h-4 w-4 text-[var(--color-ink-muted)]" />
                    {label}
                  </Link>
                ))}
              </div>
            ) : null}
          </div>
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Link
            to="/workspace"
            className="hidden items-center gap-2 rounded-full border border-[var(--color-border-soft)] bg-white px-3 py-1.5 text-xs font-medium text-[var(--color-ink)] transition hover:border-[var(--color-border-strong)] sm:inline-flex"
          >
            <Building2 className="h-3.5 w-3.5 text-[var(--color-ink-muted)]" />
            Workspace
          </Link>

          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--color-border-soft)] bg-white text-[var(--color-ink-muted)] transition hover:text-[var(--color-ink)]"
            aria-label="Account"
          >
            <UserCircle2 className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-1 overflow-x-auto px-4 pb-3 md:hidden">
        {[...PRIMARY_LINKS(businessId), ...MORE_LINKS(businessId)].map(
          ({ to, label, icon: Icon }) => {
            const active = location.pathname.startsWith(to);
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
          },
        )}
      </div>
    </header>
  );
}