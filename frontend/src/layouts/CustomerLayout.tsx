import {
  CreditCard,
  FileText,
  LayoutDashboard,
  Receipt,
  Sparkles,
  Wallet,
} from "lucide-react";
import {
  Link,
  Outlet,
  useLocation,
  useParams,
} from "react-router-dom";

import { AppLogo } from "../components/app-logo";
import { LogoutButton } from "../components/auth/LogoutButton";
import { SidebarNavItem } from "../components/sidebar-nav-item";

export function CustomerLayout() {
  const { businessId } =
    useParams<{ businessId: string }>();

  const location = useLocation();

  if (!businessId) {
    return null;
  }

  const base = `/customer/${businessId}`;

  const navigation = [
    {
      label: "Dashboard",
      href: `${base}/dashboard`,
      icon: LayoutDashboard,
    },
    {
      label: "Services",
      href: `${base}/services`,
      icon: Sparkles,
    },
    {
      label: "Subscriptions",
      href: `${base}/subscriptions`,
      icon: CreditCard,
    },
    {
      label: "Invoices",
      href: `${base}/invoices`,
      icon: FileText,
    },
    {
      label: "Credits",
      href: `${base}/credits`,
      icon: Wallet,
    },
    {
      label: "Billing history",
      href: `${base}/billing`,
      icon: Receipt,
    },
  ];

  return (
    <div className="min-h-screen bg-[#f7f8fc] text-gray-900">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-gray-200 bg-white md:flex md:flex-col">
        <div className="border-b border-gray-100 px-5 py-5">
          <AppLogo />
        </div>

        <div className="flex-1 px-3 py-5">
          <p className="px-3 pb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-400">
            Customer
          </p>

          <nav className="space-y-1">
            {navigation.map((item) => (
              <SidebarNavItem
                key={item.href}
                icon={<item.icon className="h-4 w-4" />}
                label={item.label}
                href={item.href}
                isActive={
                  location.pathname === item.href ||
                  location.pathname.startsWith(
                    `${item.href}/`,
                  )
                }
              />
            ))}
          </nav>
        </div>

        <div className="border-t border-gray-100 p-3">
          <Link
            to={`/admin/${businessId}/dashboard`}
            className="mb-2 block rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900"
          >
            Admin view
          </Link>

          <LogoutButton />
        </div>
      </aside>

      <div className="md:pl-64">
        <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/90 backdrop-blur">
          <div className="flex h-16 items-center justify-between px-6">
            <div>
              <p className="text-xs font-medium text-gray-400">
                Customer workspace
              </p>
              <p className="font-semibold text-gray-900">
                Subscription & billing
              </p>
            </div>

            <Link
              to="/workspace"
              className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
            >
              Switch business
            </Link>
          </div>
        </header>

        <main className="min-h-[calc(100vh-4rem)] p-5 sm:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}