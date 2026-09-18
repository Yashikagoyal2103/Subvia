import { Outlet, useParams, useLocation } from "react-router-dom";
import { LayoutDashboard, Package2, FileText, CreditCard, History, Receipt } from "lucide-react";

import { AppLogo } from "../components/app-logo";
import { SidebarNavItem } from "../components/sidebar-nav-item";
import { LogoutButton } from "../components/auth/LogoutButton";

export function CustomerLayout() {
  const { businessId } = useParams<{ businessId: string }>();
  const base = `/customer/${businessId}`;

  const navItems = [
    { href: `${base}/dashboard`, label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
    { href: `${base}/services`, label: "Services", icon: <Package2 className="h-4 w-4" /> },
    { href: `${base}/subscriptions`, label: "Subscriptions", icon: <Receipt className="h-4 w-4" /> },
    { href: `${base}/invoices`, label: "Invoices", icon: <FileText className="h-4 w-4" /> },
    { href: `${base}/credits`, label: "Credits", icon: <CreditCard className="h-4 w-4" /> },
    { href: `${base}/billing`, label: "Billing History", icon: <History className="h-4 w-4" /> },
  ];

  const { pathname } = useLocation();

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      {/* Top header */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-gray-200 bg-white px-4 shadow-sm md:hidden">
        <AppLogo />
        <LogoutButton />
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="hidden md:flex flex-col w-60 border-r border-gray-200 bg-white shadow-sm">
          {/* Logo */}
          <div className="flex h-14 items-center border-b border-gray-100 px-4">
            <AppLogo />
          </div>

          {/* Nav */}
          <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
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

          {/* Footer */}
          <div className="border-t border-gray-100 p-3">
            <LogoutButton />
          </div>
        </aside>

        {/* Main content */}
        <main className="min-w-0 flex-1 overflow-y-auto p-6 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}