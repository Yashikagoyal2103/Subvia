import { Outlet } from "react-router-dom";
import { CustomerTopNav } from "@/components/customer-top-nav";
import { useParams } from "react-router-dom";

export function CustomerLayout() {
  const { businessId = "" } = useParams();
  return (
    <div className="app-canvas min-h-screen">
      <CustomerTopNav businessId={businessId} />
      <main className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
}