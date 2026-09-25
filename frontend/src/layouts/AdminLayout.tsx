import {
  Activity,
  Building2,
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
  X,
} from "lucide-react";
import { useState } from "react";
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

const navItems = [
  {
    key: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    key: "services",
    label: "Services",
    icon: Package2,
  },
  {
    key: "plans",
    label: "Plans",
    icon: CreditCard,
  },
  {
    key: "customers",
    label: "Customers",
    icon: Users,
  },
  {
    key: "subscriptions",
    label: "Subscriptions",
    icon: Receipt,
  },
  {
    key: "invoices",
    label: "Invoices",
    icon: FileText,
  },
  {
    key: "payments",
    label: "Payments",
    icon: CreditCard,
  },
  {
    key: "billing-activity",
    label: "Billing Activity",
    icon: Activity,
  },
  {
    key: "webhooks",
    label: "Webhooks",
    icon: Webhook,
  },
  {
    key: "api-keys",
    label: "API Keys",
    icon: KeyRound,
  },
  {
    key: "settings",
    label: "Settings",
    icon: Settings,
  },
];

export function AdminLayout() {
  const { businessId } =
    useParams<{ businessId: string }>();

  const { pathname } = useLocation();
  const navigate = useNavigate();

  const [mobileOpen, setMobileOpen] =
    useState(false);

  const [businessMenuOpen, setBusinessMenuOpen] =
    useState(false);

  const businessesQuery = useQuery({
    queryKey: ["admin-businesses"],
    queryFn: businessesApi.getMine,
  });

  if (!businessId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f8fc]">
        <p className="text-sm text-slate-500">
          A valid business context is required.
        </p>
      </div>
    );
  }

  const businesses =
    businessesQuery.data ?? [];

  const activeBusiness =
    businesses.find(
      (business) =>
        business.id === businessId,
    );

  const base = `/admin/${businessId}`;

  const goToBusiness = (
    nextBusinessId: string,
  ) => {
    setBusinessMenuOpen(false);
    setMobileOpen(false);

    const currentPath =
      pathname.split(
        `/admin/${businessId}`,
      )[1] || "/dashboard";

    navigate(
      `/admin/${nextBusinessId}${currentPath}`,
    );
  };

  const navigation = navItems.map(
    (item) => ({
      ...item,
      href: `${base}/${item.key}`,
    }),
  );

  return (
    <div className="min-h-screen bg-[#f5f6fa] text-slate-900">
      <div className="flex min-h-screen">
        {/* Desktop sidebar */}
        <aside className="hidden w-[252px] shrink-0 border-r border-slate-200/80 bg-white md:flex md:flex-col">
          <div className="flex h-[68px] items-center border-b border-slate-100 px-5">
            <AppLogo />
          </div>

          <div className="relative border-b border-slate-100 p-3">
            <button
              type="button"
              onClick={() =>
                setBusinessMenuOpen(
                  (open) => !open,
                )
              }
              className="flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2.5 text-left transition hover:border-slate-300 hover:bg-slate-50"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                <Building2 className="h-4 w-4" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                  Business
                </p>

                <p className="mt-0.5 truncate text-sm font-semibold text-slate-800">
                  {activeBusiness?.name ??
                    "Select business"}
                </p>
              </div>

              <ChevronDown
                className={`h-4 w-4 shrink-0 text-slate-400 transition ${
                  businessMenuOpen
                    ? "rotate-180"
                    : ""
                }`}
              />
            </button>

            {businessMenuOpen && (
              <BusinessMenu
                businesses={businesses}
                activeBusinessId={
                  businessId
                }
                loading={
                  businessesQuery.isLoading
                }
                onSelect={goToBusiness}
              />
            )}
          </div>

          <div className="px-5 pb-2 pt-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
              Workspace
            </p>
          </div>

          <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-4">
            {navigation.map(
              (item) => {
                const Icon = item.icon;

                return (
                  <SidebarNavItem
                    key={item.href}
                    href={item.href}
                    label={item.label}
                    icon={
                      <Icon className="h-4 w-4" />
                    }
                    isActive={
                      pathname ===
                        item.href ||
                      pathname.startsWith(
                        `${item.href}/`,
                      )
                    }
                  />
                );
              },
            )}
          </nav>

          <div className="border-t border-slate-100 p-3">
            <Link
              to="/"
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
            >
              <LogOut className="h-4 w-4" />
              <span>Exit Admin</span>
            </Link>

            <LogoutButton />
          </div>
        </aside>

        {/* Mobile sidebar */}
        {mobileOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <button
              type="button"
              aria-label="Close navigation"
              onClick={() =>
                setMobileOpen(false)
              }
              className="absolute inset-0 bg-slate-950/30 backdrop-blur-sm"
            />

            <aside className="relative flex h-full w-[285px] flex-col bg-white shadow-2xl">
              <div className="flex h-[68px] items-center justify-between border-b border-slate-100 px-5">
                <AppLogo />

                <button
                  type="button"
                  onClick={() =>
                    setMobileOpen(false)
                  }
                  className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="border-b border-slate-100 p-4">
                <BusinessSelector
                  businesses={businesses}
                  activeBusinessId={
                    businessId
                  }
                  loading={
                    businessesQuery.isLoading
                  }
                  onSelect={goToBusiness}
                />
              </div>

              <nav className="flex-1 space-y-1 overflow-y-auto p-3">
                {navigation.map(
                  (item) => {
                    const Icon =
                      item.icon;

                    return (
                      <SidebarNavItem
                        key={item.href}
                        href={item.href}
                        label={item.label}
                        icon={
                          <Icon className="h-4 w-4" />
                        }
                        isActive={
                          pathname ===
                            item.href ||
                          pathname.startsWith(
                            `${item.href}/`,
                          )
                        }
                      />
                    );
                  },
                )}
              </nav>

              <div className="border-t border-slate-100 p-3">
                <LogoutButton />
              </div>
            </aside>
          </div>
        )}

        {/* Main */}
        <main className="min-w-0 flex-1">
          <div className="sticky top-0 z-30 flex h-[68px] items-center border-b border-slate-200/70 bg-white/85 px-4 backdrop-blur-xl md:hidden">
            <button
              type="button"
              onClick={() =>
                setMobileOpen(true)
              }
              className="rounded-xl border border-slate-200 p-2 text-slate-600"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="ml-3 min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900">
                {activeBusiness?.name ??
                  "Business Admin"}
              </p>

              <p className="text-[11px] text-slate-400">
                Admin workspace
              </p>
            </div>
          </div>

          <div className="min-h-[calc(100vh-68px)] p-4 sm:p-6 lg:p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

function BusinessSelector({
  businesses,
  activeBusinessId,
  loading,
  onSelect,
}: {
  businesses: Awaited<
    ReturnType<
      typeof businessesApi.getMine
    >
  >;
  activeBusinessId: string;
  loading: boolean;
  onSelect: (
    businessId: string,
  ) => void;
}) {
  const activeBusiness =
    businesses.find(
      (business) =>
        business.id ===
        activeBusinessId,
    );

  return (
    <div className="relative">
      <label className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
        Business
      </label>

      <select
        value={activeBusinessId}
        disabled={loading}
        onChange={(event) =>
          onSelect(event.target.value)
        }
        className="mt-2 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 pr-8 text-sm font-semibold text-slate-800 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
      >
        {activeBusiness && (
          <option
            value={
              activeBusiness.id
            }
          >
            {activeBusiness.name}
          </option>
        )}

        {businesses
          .filter(
            (business) =>
              business.id !==
              activeBusinessId,
          )
          .map((business) => (
            <option
              key={business.id}
              value={business.id}
            >
              {business.name}
            </option>
          ))}
      </select>

      <ChevronDown className="pointer-events-none absolute bottom-3 right-3 h-4 w-4 text-slate-400" />
    </div>
  );
}

function BusinessMenu({
  businesses,
  activeBusinessId,
  loading,
  onSelect,
}: {
  businesses: Awaited<
    ReturnType<
      typeof businessesApi.getMine
    >
  >;
  activeBusinessId: string;
  loading: boolean;
  onSelect: (
    businessId: string,
  ) => void;
}) {
  return (
    <div className="absolute left-3 right-3 top-[calc(100%-4px)] z-50 mt-2 overflow-hidden rounded-2xl border border-slate-200 bg-white p-1.5 shadow-[0_20px_50px_-20px_rgba(15,23,42,0.25)]">
      {loading ? (
        <div className="px-3 py-4 text-center text-xs text-slate-400">
          Loading businesses...
        </div>
      ) : businesses.length ===
        0 ? (
        <div className="px-3 py-4 text-center text-xs text-slate-400">
          No businesses available.
        </div>
      ) : (
        businesses.map(
          (business) => (
            <button
              key={business.id}
              type="button"
              onClick={() =>
                onSelect(
                  business.id,
                )
              }
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${
                business.id ===
                activeBusinessId
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-slate-700 hover:bg-slate-50"
              }`}
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-500">
                {business.name
                  .charAt(0)
                  .toUpperCase()}
              </div>

              <span className="min-w-0 flex-1 truncate text-sm font-medium">
                {business.name}
              </span>

              {business.id ===
                activeBusinessId && (
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
              )}
            </button>
          ),
        )
      )}

      <div className="mt-1 border-t border-slate-100 pt-1">
        <Link
          to="/onboarding/create-business"
          className="block rounded-xl px-3 py-2.5 text-sm font-medium text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
        >
          + Create another business
        </Link>
      </div>
    </div>
  );
}