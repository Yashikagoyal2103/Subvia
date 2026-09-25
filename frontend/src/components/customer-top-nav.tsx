import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  CreditCard,
  FileText,
  LayoutGrid,
  LogOut,
  Menu,
  Receipt,
  WalletCards,
  X,
} from "lucide-react";

import { authApi } from "@/api/auth";
import { queryClient } from "@/lib/query-client";
import { useAuthStore } from "@/stores/auth.store";
import { cn } from "@/lib/utils";

interface NavItem {
  to: string;
  label: string;
  icon: typeof LayoutGrid;
  match: string[];
}

const LINKS: NavItem[] = [
  {
    to: "/customer/explore",
    label: "Explore",
    icon: LayoutGrid,
    match: ["/customer/explore", "/customer/services", "/customer/checkout"],
  },
  { to: "/customer/plans", label: "Plans", icon: CreditCard, match: ["/customer/plans"] },
  {
    to: "/customer/subscriptions",
    label: "Subscriptions",
    icon: WalletCards,
    match: ["/customer/subscriptions"],
  },
  { to: "/customer/invoices", label: "Invoices", icon: Receipt, match: ["/customer/invoices"] },
  { to: "/customer/billing", label: "Billing", icon: FileText, match: ["/customer/billing"] },
];

function initialsFrom(first?: string | null, last?: string | null): string {
  const f = (first ?? "").trim();
  const l = (last ?? "").trim();
  if (f && l) return (f[0] + l[0]).toUpperCase();
  if (f) return f.slice(0, 2).toUpperCase();
  if (l) return l.slice(0, 2).toUpperCase();
  return "U";
}

export function CustomerTopNav() {
  const location = useLocation();
  const navigate = useNavigate();

  const user = useAuthStore((s) => s.user);
  const refreshToken = useAuthStore((s) => s.refreshToken);
  const clearAuth = useAuthStore((s) => s.clearAuth);

  const [accountOpen, setAccountOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!accountOpen) return;
    const onMouseDown = (e: MouseEvent) => {
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) {
        setAccountOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAccountOpen(false);
    };
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [accountOpen]);

  useEffect(() => {
    setMobileOpen(false);
    setAccountOpen(false);
  }, [location.pathname]);

  const handleSignOut = async () => {
    try {
      if (refreshToken) await authApi.logout(refreshToken);
    } catch {
      // ignore — still clear local state
    } finally {
      queryClient.clear();
      clearAuth();
      navigate("/login", { replace: true });
    }
  };

  const isActive = (match: string[]) =>
    match.some(
      (m) => location.pathname === m || location.pathname.startsWith(`${m}/`),
    );

  const userInitials = initialsFrom(user?.firstName, user?.lastName);

  return (
    <header className="sticky top-4 z-40 px-4 sm:px-6 lg:px-8">
      <nav className="glass mx-auto grid max-w-7xl grid-cols-[auto_1fr_auto] items-center gap-3 rounded-full px-3 py-2">
        <Link
          to="/customer"
          className="flex items-center gap-2.5 rounded-full px-2 py-1 transition hover:bg-white/40"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-charcoal)] text-[11px] font-bold text-[var(--color-accent)]">
            B
          </span>
          <span className="hidden text-sm font-semibold tracking-tight text-[var(--color-ink)] sm:inline">
            BillingOS
          </span>
        </Link>

        <div className="hidden justify-center gap-1 md:flex">
          {LINKS.map(({ to, label, icon: Icon, match }) => {
            const active = isActive(match);
            return (
              <NavLink
                key={to}
                to={to}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-medium transition",
                  active
                    ? "bg-[var(--color-charcoal)] text-white shadow-[0_6px_18px_-8px_rgba(20,22,26,0.5)]"
                    : "text-[var(--color-ink-muted)] hover:bg-white/60 hover:text-[var(--color-ink)]",
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </NavLink>
            );
          })}
        </div>

        <div className="flex items-center justify-end gap-2">
          <div className="relative" ref={accountRef}>
            <button
              type="button"
              onClick={() => setAccountOpen((o) => !o)}
              aria-haspopup="menu"
              aria-expanded={accountOpen}
              aria-label="Account"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-charcoal)] text-xs font-semibold text-white transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-charcoal)]/30"
            >
              {userInitials}
            </button>

            {accountOpen ? (

              <div
                role="menu"
                className="absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-2xl border border-[rgba(20,22,26,0.08)] bg-white shadow-[0_20px_50px_-20px_rgba(20,22,26,0.28)]"
              >
                <div className="border-b border-[rgba(20,22,26,0.06)] px-4 py-3">
                  <p className="truncate text-sm font-semibold text-[var(--color-ink)]">
                    {user ? `${user.firstName} ${user.lastName}` : "Account"}
                  </p>
                  {user?.email ? (
                    <p className="mt-0.5 truncate text-xs text-[var(--color-ink-muted)]">
                      {user.email}
                    </p>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="flex w-full items-center gap-2.5 px-4 py-3 text-left text-sm font-medium text-[var(--color-ink)] transition hover:bg-[rgba(20,22,26,0.03)]"
                >
                  <LogOut className="h-4 w-4 text-[var(--color-ink-muted)]" />
                  Sign out
                </button>
              </div>
            ) : null}
          </div>

          <button
            type="button"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label="Menu"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/60 text-[var(--color-ink)] transition hover:bg-white md:hidden"
          >
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </nav>

      {mobileOpen ? (
        <div className="glass-strong mx-auto mt-2 max-w-7xl overflow-hidden rounded-3xl md:hidden">
          <div className="flex flex-col p-2">
            {LINKS.map(({ to, label, icon: Icon, match }) => {
              const active = isActive(match);
              return (
                <NavLink
                  key={to}
                  to={to}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition",
                    active
                      ? "bg-[var(--color-charcoal)] text-white"
                      : "text-[var(--color-ink)] hover:bg-white/60",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </NavLink>
              );
            })}
          </div>
          <div className="border-t border-[rgba(20,22,26,0.06)] px-4 py-3">
            <p className="truncate text-sm font-semibold text-[var(--color-ink)]">
              {user ? `${user.firstName} ${user.lastName}` : "Account"}
            </p>
            {user?.email ? (
              <p className="mt-0.5 truncate text-xs text-[var(--color-ink-muted)]">
                {user.email}
              </p>
            ) : null}
            <button
              type="button"
              onClick={handleSignOut}
              className="mt-3 flex w-full items-center gap-2.5 rounded-2xl bg-white/70 px-4 py-2.5 text-left text-sm font-medium text-[var(--color-ink)] transition hover:bg-white"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </div>
      ) : null}
    </header>
  );
}