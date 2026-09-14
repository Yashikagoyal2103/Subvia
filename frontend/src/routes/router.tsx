import { createBrowserRouter } from "react-router-dom";

import App from "../App";
import { AdminLayout } from "../layouts/AdminLayout";
import { CustomerLayout } from "../layouts/CustomerLayout";

import { LoginPage } from "../pages/auth/LoginPage";
import { RegisterPage } from "../pages/auth/RegisterPage";
import { AdminDashboardPage } from "../pages/admin/DashboardPage";
import { CustomerDashboardPage } from "../pages/customer/DashboardPage";

import { ProtectedRoute } from "./ProtectedRoute";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        path: "login",
        element: <LoginPage />,
      },
      {
        path: "register",
        element: <RegisterPage />,
      },

      {
        element: <ProtectedRoute />,
        children: [
          {
            path: "customer",
            element: <CustomerLayout />,
            children: [
              {
                path: "dashboard",
                element: <CustomerDashboardPage />,
              },
            ],
          },

          {
            path: "admin",
            element: <AdminLayout />,
            children: [
              {
                path: "dashboard",
                element: <AdminDashboardPage />,
              },
            ],
          },
        ],
      },
    ],
  },
]);