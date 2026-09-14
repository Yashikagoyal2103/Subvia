import { Outlet } from "react-router-dom";
import { LogoutButton } from "../components/auth/LogoutButton";

export function AdminLayout() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b">
        <div className="flex h-16 items-center px-6">
          <div className="font-semibold">SaaS Billing</div>
          <LogoutButton />
        </div>
      </header>

      <div className="flex">
        <aside className="hidden w-64 border-r md:block">
          <nav className="space-y-1 p-4">
            <div className="rounded-md px-3 py-2 text-sm font-medium">
              Dashboard
            </div>

            <div className="rounded-md px-3 py-2 text-sm">
              Services
            </div>

            <div className="rounded-md px-3 py-2 text-sm">
              Plans
            </div>

            <div className="rounded-md px-3 py-2 text-sm">
              Customers
            </div>

            <div className="rounded-md px-3 py-2 text-sm">
              Subscriptions
            </div>

            <div className="rounded-md px-3 py-2 text-sm">
              Invoices
            </div>

            <div className="rounded-md px-3 py-2 text-sm">
              Payments
            </div>

            <div className="rounded-md px-3 py-2 text-sm">
              Billing Activity
            </div>
          </nav>
        </aside>

        <main className="min-w-0 flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}