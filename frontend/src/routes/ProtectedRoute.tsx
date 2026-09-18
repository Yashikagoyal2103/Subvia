// import { Navigate, Outlet } from "react-router-dom";
// import { useAuthStore } from "../stores/auth.store";

// export function ProtectedRoute() {
//   const { userId, isAuthenticated } = useAuthStore();

//   if (!isAuthenticated || !userId) {
//     return <Navigate to="/login" replace />;
//   }

//   return <Outlet />;
// }

import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../stores/auth.store";

export function ProtectedRoute() {
  const { userId, isAuthenticated } = useAuthStore();

  const bypassAuth =
    import.meta.env.DEV &&
    import.meta.env.VITE_BYPASS_AUTH === "true";

  if (
    !bypassAuth &&
    (!isAuthenticated || !userId)
  ) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}