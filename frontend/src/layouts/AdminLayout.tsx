import {
  Activity,
  CreditCard,
  FileText,
  KeyRound,
  LayoutDashboard,
  Package2,
  Receipt,
  Users,
  Webhook,
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

export function AdminLayout() {
  const { businessId } =
    useParams<{ businessId: string }>();
  const { pathname } = useLocation();

  const base = `/admin/${businessId}`;

  const navItems = [
    {
      href: `${base}/dashboard`,
      label: "Dashboard",
      icon: <LayoutDashboard className="h-4 w-4" />,
    },
    {
      href: `${base}/services`,
      label: "Services",
      icon: <Package2 className="h-4 w-4" />,
    },
    {
      href: `${base}/plans`,
      label: "Plans",
      icon: <CreditCard className="h-4 w-4" />,
    },
    {
      href: `${base}/customers`,
      label: "Customers",
      icon: <Users className="h-4 w-4" />,
    },
    {
      href: `${base}/subscriptions`,
      label: "Subscriptions",
      icon: <Receipt className="h-4 w-4" />,
    },
    {
      href: `${base}/invoices`,
      label: "Invoices",
      icon: <FileText className="h-4 w-4" />,
    },
    {
      href: `${base}/payments`,
      label: "Payments",
      icon: <CreditCard className="h-4 w-4" />,
    },
    {
      href: `${base}/billing-activity`,
      label: "Billing Activity",
      icon: <Activity className="h-4 w-4" />,
    },
    {
      href: `${base}/webhooks`,
      label: "Webhooks",
      icon: <Webhook className="h-4 w-4" />,
    },
    {
      href: `${base}/api-keys`,
      label: "API Keys",
      icon: <KeyRound className="h-4 w-4" />,
    },
  ];

  return (
    <div className="min-h-screen bg-[#f7f8fc] text-gray-900">
      <div className="flex min-h-screen">
        <aside className="hidden w-60 shrink-0 flex-col border-r border-gray-200/80 bg-white shadow-sm md:flex">
          <div className="flex h-14 items-center border-b border-gray-100 px-4">
            <AppLogo />
          </div>

          <div className="border-b border-gray-100 px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              Workspace
            </p>
            <p className="mt-1 truncate text-sm font-medium text-gray-800">
              Business Admin
            </p>
          </div>

          <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
            {navItems.map((item) => (
              <SidebarNavItem
                key={item.href}
                {...item}
                isActive={
                  pathname === item.href ||
                  pathname.startsWith(`${item.href}/`)
                }
              />
            ))}
          </nav>

          <div className="space-y-1 border-t border-gray-100 p-3">
            <Link
              to={`/customer/${businessId}/dashboard`}
              className="block rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50 hover:text-gray-900"
            >
              Customer view
            </Link>

            <Link
              to="/workspace"
              className="block rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50 hover:text-gray-900"
            >
              Switch business
            </Link>

            <LogoutButton />
          </div>
        </aside>

        <main className="min-w-0 flex-1 overflow-y-auto p-5 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}