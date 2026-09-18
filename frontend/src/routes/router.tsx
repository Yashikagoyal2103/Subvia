import { createBrowserRouter } from "react-router-dom";
import App from "../App";

import { AdminLayout } from "../layouts/AdminLayout";
import { CustomerLayout } from "../layouts/CustomerLayout";
import { ProtectedRoute } from "./ProtectedRoute";

import { LoginPage } from "../pages/auth/LoginPage";
import { RegisterPage } from "../pages/auth/RegisterPage";

import { AdminDashboardPage } from "../pages/admin/DashboardPage";
import { CustomerDashboardPage } from "../pages/customer/DashboardPage";
import { CustomerServicesPage } from "../pages/customer/ServicesPage";
import { CustomerPlansPage } from "../pages/customer/PlansPage";
import { CheckoutPage } from "../pages/customer/CheckoutPage";
import { CustomerSubscriptionsPage } from "../pages/customer/SubscriptionsPage";
import { SubscriptionDetailsPage } from "../pages/customer/SubscriptionDetailsPage";
import { CustomerInvoicesPage } from "../pages/customer/InvoicesPage";
import { CustomerInvoiceDetailsPage } from "../pages/customer/InvoiceDetailsPage";
import { CustomerCreditsPage } from "../pages/customer/CreditsPage";
import { CustomerBillingHistoryPage } from "../pages/customer/BillingHistoryPage";

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
            path: "customer/:businessId",
            element: <CustomerLayout />,
            children: [
              {
                path: "dashboard",
                element: <CustomerDashboardPage />,
              },
              {
                path: "services",
                element: <CustomerServicesPage />,
              },
              {
                path: "services/:serviceId/plans",
                element: <CustomerPlansPage />,
              },
              {
                path: "checkout/:serviceId/:planId",
                element: <CheckoutPage />,
              },
              {
                path: "subscriptions",
                element: <CustomerSubscriptionsPage />,
              },
              {
                path: "subscriptions/:subscriptionId",
                element: <SubscriptionDetailsPage />,
              },
              {
                path: "invoices",
                element: <CustomerInvoicesPage />,
              },
              {
                path: "invoices/:invoiceId",
                element: <CustomerInvoiceDetailsPage />,
              },
              {
                path: "credits",
                element: <CustomerCreditsPage />,
              },
              {
                path: "billing",
                element: <CustomerBillingHistoryPage />,
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