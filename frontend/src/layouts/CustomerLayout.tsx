import {
  Outlet,
  useParams,
  useLocation,
} from "react-router-dom";
import {
  LayoutDashboard,
  Package2,
  FileText,
  CreditCard,
  History,
  Receipt,
} from "lucide-react";

import { AppLogo } from "../components/app-logo";
import { SidebarNavItem } from "../components/sidebar-nav-item";
import { LogoutButton } from "../components/auth/LogoutButton";

export function CustomerLayout() {
  const { businessId } =
    useParams<{
      businessId: string;
    }>();

  const base = `/customer/${businessId}`;
  const { pathname } = useLocation();

  const navItems = [
    {
      href: `${base}/dashboard`,
      label: "Dashboard",
      icon: (
        <LayoutDashboard className="h-4 w-4" />
      ),
    },
    {
      href: `${base}/services`,
      label: "Services",
      icon: (
        <Package2 className="h-4 w-4" />
      ),
    },
    {
      href: `${base}/subscriptions`,
      label: "Subscriptions",
      icon: (
        <Receipt className="h-4 w-4" />
      ),
    },
    {
      href: `${base}/invoices`,
      label: "Invoices",
      icon: (
        <FileText className="h-4 w-4" />
      ),
    },
    {
      href: `${base}/credits`,
      label: "Credits",
      icon: (
        <CreditCard className="h-4 w-4" />
      ),
    },
    {
      href: `${base}/billing`,
      label: "Billing History",
      icon: (
        <History className="h-4 w-4" />
      ),
    },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-[#f7f7f8]">
      <header className="sticky top-0 z-30 border-b border-gray-200/80 bg-white/95 shadow-sm backdrop-blur md:hidden">
        <div className="flex h-14 items-center justify-between px-4">
          <AppLogo />

          <LogoutButton />
        </div>

        <nav className="overflow-x-auto border-t border-gray-100 px-3 py-2">
          <div className="flex min-w-max gap-1">
            {navItems.map((item) => (
              <SidebarNavItem
                key={item.href}
                href={item.href}
                label={item.label}
                icon={item.icon}
                isActive={pathname.startsWith(item.href)}
              />
            ))}
          </div>
        </nav>
      </header>

      <div className="flex min-h-0 flex-1">
        <aside className="hidden w-60 shrink-0 flex-col border-r border-gray-200/80 bg-white shadow-sm md:flex">
          <div className="flex h-14 items-center border-b border-gray-100 px-4">
            <AppLogo />
          </div>

          <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
            {navItems.map((item) => (
              <SidebarNavItem
                key={item.href}
                href={item.href}
                label={item.label}
                icon={item.icon}
                isActive={pathname.startsWith(item.href)}
              />
            ))}
          </nav>

          <div className="border-t border-gray-100 p-3">
            <LogoutButton />
          </div>
        </aside>

        <main className="min-w-0 flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}