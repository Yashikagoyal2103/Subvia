import { LayoutDashboard, Package2, CreditCard, FileText, Receipt, Users, Activity, Settings2 } from "lucide-react";
import { Outlet, useLocation, useParams } from "react-router-dom";
import { AppLogo } from "../components/app-logo";
import { SidebarNavItem } from "../components/sidebar-nav-item";
import { LogoutButton } from "../components/auth/LogoutButton";

export function AdminLayout() {
  const { businessId } = useParams<{ businessId: string }>();
  const { pathname } = useLocation();
  const base = `/admin/${businessId}`;

  const navItems = [
    { href: `${base}/dashboard`, label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
    { href: `${base}/services`, label: "Services", icon: <Package2 className="h-4 w-4" /> },
    { href: `${base}/plans`, label: "Plans", icon: <CreditCard className="h-4 w-4" /> },
    { href: `${base}/customers`, label: "Customers", icon: <Users className="h-4 w-4" /> },
    { href: `${base}/subscriptions`, label: "Subscriptions", icon: <Receipt className="h-4 w-4" /> },
    { href: `${base}/invoices`, label: "Invoices", icon: <FileText className="h-4 w-4" /> },
    { href: `${base}/payments`, label: "Payments", icon: <CreditCard className="h-4 w-4" /> },
    { href: `${base}/billing-activity`, label: "Billing Activity", icon: <Activity className="h-4 w-4" /> },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-[#f7f7f8]">
      <header className="sticky top-0 z-30 border-b border-gray-200/80 bg-white/95 shadow-sm backdrop-blur md:hidden">
        <div className="flex h-14 items-center justify-between px-4"><AppLogo /><LogoutButton /></div>
        <nav className="overflow-x-auto border-t border-gray-100 px-3 py-2">
          <div className="flex min-w-max gap-1">{navItems.map(item => <SidebarNavItem key={item.href} {...item} isActive={pathname.startsWith(item.href)} />)}</div>
        </nav>
      </header>

      <div className="flex min-h-0 flex-1">
        <aside className="hidden w-60 shrink-0 flex-col border-r border-gray-200/80 bg-white shadow-sm md:flex">
          <div className="flex h-14 items-center border-b border-gray-100 px-4"><AppLogo /></div>

          <div className="border-b border-gray-100 px-4 py-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600"><Settings2 className="h-4 w-4" /></div>
              <div className="min-w-0"><p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Workspace</p><p className="truncate text-sm font-medium text-gray-800">Business Admin</p></div>
            </div>
          </div>

          <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">{navItems.map(item => <SidebarNavItem key={item.href} {...item} isActive={pathname.startsWith(item.href)} />)}</nav>

          <div className="border-t border-gray-100 p-3"><LogoutButton /></div>
        </aside>

        <main className="min-w-0 flex-1 overflow-y-auto p-5 md:p-8"><Outlet /></main>
      </div>
    </div>
  );
}