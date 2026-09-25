import { Outlet } from "react-router-dom";
import { CustomerTopNav } from "@/components/customer-top-nav";

export function CustomerLayout() {
  return (
    <div className="customer-canvas min-h-screen">
      <CustomerTopNav />
      <main className="mx-auto max-w-7xl px-4 pb-20 pt-10 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
}