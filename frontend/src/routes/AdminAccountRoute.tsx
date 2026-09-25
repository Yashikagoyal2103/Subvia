import { Navigate, Outlet } from "react-router-dom";

import { useAuthStore } from "../stores/auth.store";

export function AdminAccountRoute() {
  const { isAuthenticated, isInitialized, user } = useAuthStore();

  if (!isInitialized) {
    return null;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (user.accountType !== "ADMIN") {
    return <Navigate to="/customer" replace />;
  }

  return <Outlet />;
}