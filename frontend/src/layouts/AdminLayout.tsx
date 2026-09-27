import {
  Activity,
  ChevronDown,
  CreditCard,
  FileText,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Menu,
  Package2,
  Receipt,
  Settings,
  Users,
  Webhook,
  UserRound,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  Link,
  Outlet,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { businessesApi } from "../api/businesses";
import { AppLogo } from "../components/app-logo";
import { LogoutButton } from "../components/auth/LogoutButton";
import { SidebarNavItem } from "../components/sidebar-nav-item";

interface NavGroup {
  label: string | null;
  items: {
    key: string;
    label: string;
    icon: typeof LayoutDashboard;
  }[];
}

const navGroups: NavGroup[] = [
  {
    label: null,
    items: [
      { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
      { key: "services", label: "Services", icon: Package2 },
      { key: "plans", label: "Plans", icon: CreditCard },
    ],
  },
  {
    label: "Customers & Billing",
    items: [
      { key: "customers", label: "Customers", icon: Users },
      { key: "subscriptions", label: "Subscriptions", icon: Receipt },
      { key: "invoices", label: "Invoices", icon: FileText },
      { key: "payments", label: "Payments", icon: CreditCard },
      { key: "billing-activity", label: "Billing Activity", icon: Activity },
    ],
  },
  {
    label: "Developer",
    items: [
      { key: "webhooks", label: "Webhooks", icon: Webhook },
      { key: "api-keys", label: "API Keys", icon: KeyRound },
    ],
  },
  {
    label: null,
    items: [
      { key: "settings", label: "Settings", icon: Settings },
      { key: "profile", label: "Profile", icon: UserRound },
    ],
  },
];

export function AdminLayout() {
  const { businessId } = useParams<{ businessId: string }>();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [businessMenuOpen, setBusinessMenuOpen] = useState(false);
  const businessRef = useRef<HTMLDivElement>(null);

  const businessesQuery = useQuery({
    queryKey: ["admin-businesses"],
    queryFn: businessesApi.getMine,
  });

  useEffect(() => {
    if (!businessMenuOpen) return;
    const onMouseDown = (e: MouseEvent) => {
      if (businessRef.current && !businessRef.current.contains(e.target as Node)) {
        setBusinessMenuOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setBusinessMenuOpen(false);
    };
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [businessMenuOpen]);

  if (!businessId) {
    return (
      <div className="admin-theme admin-canvas flex min-h-screen items-center justify-center">
        <p className="text-sm text-[var(--a-ink-2)]">
          A valid business context is required.
        </p>
      </div>
    );
  }

  const businesses = businessesQuery.data ?? [];
  const activeBusiness = businesses.find((b) => b.id === businessId);

  const base = `/admin/${businessId}`;

  const goToBusiness = (nextBusinessId: string) => {
    setBusinessMenuOpen(false);
    setMobileOpen(false);
    const currentPath = pathname.split(`/admin/${businessId}`)[1] || "/dashboard";
    navigate(`/admin/${nextBusinessId}${currentPath}`);
  };

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <div className="admin-theme admin-canvas min-h-screen text-[var(--a-ink)]">
      <div className="flex min-h-screen">
        {/* Desktop sidebar */}
        <aside className="hidden w-[260px] shrink-0 border-r border-[var(--a-border)] bg-white md:flex md:flex-col">
          <div className="flex h-[68px] items-center px-5">
            <AppLogo />
          </div>

          {/* Business switcher */}
          <div className="relative px-3 pb-3" ref={businessRef}>
            <button
              type="button"
              onClick={() => setBusinessMenuOpen((v) => !v)}
              className="flex w-full items-center gap-3 rounded-2xl border border-[var(--a-border)] bg-[var(--a-canvas)] px-3 py-2.5 text-left transition hover:border-[var(--a-border-strong)]"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--a-indigo-soft)] text-[11px] font-bold text-[var(--a-indigo)]">
                {(activeBusiness?.name ?? "?").charAt(0).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--a-ink-3)]">
                  Business
                </p>
                <p className="mt-0.5 truncate text-sm font-semibold text-[var(--a-ink)]">
                  {activeBusiness?.name ?? "Select business"}
                </p>
              </div>
              <ChevronDown
                className={`h-4 w-4 shrink-0 text-[var(--a-ink-3)] transition ${
                  businessMenuOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {businessMenuOpen ? (
              <BusinessMenu
                businesses={businesses}
                activeBusinessId={businessId}
                loading={businessesQuery.isLoading}
                onSelect={goToBusiness}
              />
            ) : null}
          </div>

          {/* Nav */}
          <nav className="flex-1 overflow-y-auto px-3 pb-3">
            {navGroups.map((group, gi) => (
              <div
                key={group.label ?? `group-${gi}`}
                className={gi > 0 ? "mt-5" : ""}
              >
                {group.label ? (
                  <p className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--a-ink-3)]">
                    {group.label}
                  </p>
                ) : null}
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const href = `${base}/${item.key}`;
                    return (
                      <SidebarNavItem
                        key={href}
                        href={href}
                        label={item.label}
                        icon={<Icon className="h-4 w-4" />}
                        isActive={isActive(href)}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* Bottom callout */}
          <div className="px-3 pb-3">
            <div className="rounded-2xl border border-[var(--a-border)] bg-[var(--a-canvas-2)] p-3.5">
              <p className="text-xs font-semibold text-[var(--a-ink)]">
                Need another workspace?
              </p>
              <p className="mt-1 text-[11px] leading-5 text-[var(--a-ink-2)]">
                Create a business to manage a separate set of customers and
                billing.
              </p>
              <Link
                to="/onboarding/create-business"
                className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--a-indigo)] hover:underline"
              >
                Create a business →
              </Link>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-[var(--a-border)] p-3">
            <Link
              to="/workspace"
              className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-[var(--a-ink-2)] transition hover:bg-[rgba(15,15,10,0.035)] hover:text-[var(--a-ink)]"
            >
              <LogOut className="h-4 w-4" />
              <span>Switch workspace</span>
            </Link>
            <div className="mt-1">
              <LogoutButton />
            </div>
          </div>
        </aside>

        {/* Mobile sidebar */}
        {mobileOpen ? (
          <div className="fixed inset-0 z-50 md:hidden">
            <button
              type="button"
              aria-label="Close navigation"
              onClick={() => setMobileOpen(false)}
              className="absolute inset-0 bg-[rgba(15,15,10,0.4)] backdrop-blur-sm"
            />
            <aside className="relative flex h-full w-[285px] flex-col bg-white shadow-2xl">
              <div className="flex h-[68px] items-center justify-between px-5">
                <AppLogo />
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg p-2 text-[var(--a-ink-3)] hover:bg-[rgba(15,15,10,0.04)]"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="border-b border-[var(--a-border)] p-4">
                <MobileBusinessSelector
                  businesses={businesses}
                  activeBusinessId={businessId}
                  loading={businessesQuery.isLoading}
                  onSelect={goToBusiness}
                />
              </div>

              <nav className="flex-1 overflow-y-auto p-3">
                {navGroups.map((group, gi) => (
                  <div
                    key={group.label ?? `m-group-${gi}`}
                    className={gi > 0 ? "mt-5" : ""}
                  >
                    {group.label ? (
                      <p className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--a-ink-3)]">
                        {group.label}
                      </p>
                    ) : null}
                    <div className="space-y-0.5">
                      {group.items.map((item) => {
                        const Icon = item.icon;
                        const href = `${base}/${item.key}`;
                        return (
                          <SidebarNavItem
                            key={href}
                            href={href}
                            label={item.label}
                            icon={<Icon className="h-4 w-4" />}
                            isActive={isActive(href)}
                          />
                        );
                      })}
                    </div>
                  </div>
                ))}
              </nav>

              <div className="border-t border-[var(--a-border)] p-3">
                <LogoutButton />
              </div>
            </aside>
          </div>
        ) : null}

        {/* Main */}
        <main className="min-w-0 flex-1">
          <div className="sticky top-0 z-30 flex h-[68px] items-center border-b border-[var(--a-border)] bg-white/90 px-4 backdrop-blur-xl md:hidden">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="rounded-xl border border-[var(--a-border)] p-2 text-[var(--a-ink-2)]"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="ml-3 min-w-0">
              <p className="truncate text-sm font-semibold text-[var(--a-ink)]">
                {activeBusiness?.name ?? "Business Admin"}
              </p>
              <p className="text-[11px] text-[var(--a-ink-3)]">Admin workspace</p>
            </div>
          </div>

          <div className="p-4 sm:p-6 lg:p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

/* ─────────── Business switcher sub-components ─────────── */

function BusinessMenu({
  businesses,
  activeBusinessId,
  loading,
  onSelect,
}: {
  businesses: Awaited<ReturnType<typeof businessesApi.getMine>>;
  activeBusinessId: string;
  loading: boolean;
  onSelect: (businessId: string) => void;
}) {
  return (
    <div className="absolute left-3 right-3 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-[var(--a-border)] bg-white p-1.5 shadow-[0_20px_50px_-20px_rgba(15,15,10,0.28)]">
      {loading ? (
        <div className="px-3 py-4 text-center text-xs text-[var(--a-ink-3)]">
          Loading businesses…
        </div>
      ) : businesses.length === 0 ? (
        <div className="px-3 py-4 text-center text-xs text-[var(--a-ink-3)]">
          No businesses available.
        </div>
      ) : (
        businesses.map((business) => (
          <button
            key={business.id}
            type="button"
            onClick={() => onSelect(business.id)}
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${
              business.id === activeBusinessId
                ? "bg-[var(--a-indigo-soft)] text-[var(--a-indigo)]"
                : "text-[var(--a-ink)] hover:bg-[rgba(15,15,10,0.035)]"
            }`}
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[rgba(15,15,10,0.05)] text-xs font-bold text-[var(--a-ink-2)]">
              {business.name.charAt(0).toUpperCase()}
            </span>
            <span className="min-w-0 flex-1 truncate text-sm font-medium">
              {business.name}
            </span>
            {business.id === activeBusinessId ? (
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--a-indigo)]" />
            ) : null}
          </button>
        ))
      )}

      <div className="mt-1 border-t border-[var(--a-border)] pt-1">
        <Link
          to="/onboarding/create-business"
          className="block rounded-xl px-3 py-2.5 text-sm font-medium text-[var(--a-ink-2)] transition hover:bg-[rgba(15,15,10,0.035)] hover:text-[var(--a-ink)]"
        >
          + Create another business
        </Link>
      </div>
    </div>
  );
}

function MobileBusinessSelector({
  businesses,
  activeBusinessId,
  loading,
  onSelect,
}: {
  businesses: Awaited<ReturnType<typeof businessesApi.getMine>>;
  activeBusinessId: string;
  loading: boolean;
  onSelect: (businessId: string) => void;
}) {
  const activeBusiness = businesses.find((b) => b.id === activeBusinessId);
  return (
    <div className="relative">
      <label className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--a-ink-3)]">
        Business
      </label>
      <select
        value={activeBusinessId}
        disabled={loading}
        onChange={(e) => onSelect(e.target.value)}
        className="mt-2 w-full appearance-none rounded-xl border border-[var(--a-border)] bg-[var(--a-canvas)] px-3 py-2.5 pr-8 text-sm font-semibold text-[var(--a-ink)] outline-none transition focus:border-[var(--a-indigo)]"
      >
        {activeBusiness ? (
          <option value={activeBusiness.id}>{activeBusiness.name}</option>
        ) : null}
        {businesses
          .filter((b) => b.id !== activeBusinessId)
          .map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
      </select>
      <ChevronDown className="pointer-events-none absolute bottom-3 right-3 h-4 w-4 text-[var(--a-ink-3)]" />
    </div>
  );
}
