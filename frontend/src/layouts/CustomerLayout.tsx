import { Outlet, useParams } from "react-router-dom";
import { CustomerTopNav } from "../components/customer-top-nav";

export function CustomerLayout() {
  const { businessId } = useParams<{ businessId: string }>();

  if (!businessId) {
    return null;
  }

  return (
    <div className="customer-shell min-h-screen text-slate-950 selection:bg-indigo-100 selection:text-indigo-900">
      <CustomerTopNav businessId={businessId} />

      <main className="mx-auto w-full max-w-[1440px] px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
        <Outlet />
      </main>
    </div>
  );
}