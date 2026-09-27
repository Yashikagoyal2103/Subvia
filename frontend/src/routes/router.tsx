import {
  createBrowserRouter,
  Navigate,
} from "react-router-dom";

import App from "../App";
import { AdminLayout } from "../layouts/AdminLayout";
import { CustomerLayout } from "../layouts/CustomerLayout";

import { ProtectedRoute } from "./ProtectedRoute";
import { AdminAccountRoute } from "./AdminAccountRoute";
import { CustomerAccountRoute } from "./CustomerAccountRoute";

import { LandingPage } from "../pages/marketing/LandingPage";
import { LoginPage } from "../pages/auth/LoginPage";
import { RegisterPage } from "../pages/auth/RegisterPage";
import { WorkspacePage } from "../pages/workspace/WorkspacePage";
import { CreateBusinessPage } from "../pages/onboarding/CreateBusinessPage";

import { AdminDashboardPage } from "../pages/admin/DashboardPage";
import { AdminServicesPage } from "../pages/admin/ServicesPage";
import { AdminServiceDetailsPage } from "../pages/admin/ServiceDetailsPage";
import { AdminPlansPage } from "../pages/admin/PlansPage";
import { AdminPlanDetailsPage } from "../pages/admin/PlanDetailsPage";
import { AdminCustomersPage } from "../pages/admin/CustomersPage";
import { AdminCustomerDetailsPage } from "../pages/admin/CustomerDetailsPage";
import { AdminSubscriptionsPage } from "../pages/admin/SubscriptionsPage";
import { AdminSubscriptionDetailsPage } from "../pages/admin/SubscriptionDetailsPage";
import { AdminInvoicesPage } from "../pages/admin/InvoicesPage";
import { AdminInvoiceDetailsPage } from "../pages/admin/InvoiceDetailsPage";
import { AdminPaymentsPage } from "../pages/admin/PaymentsPage";
import { AdminPaymentDetailsPage } from "../pages/admin/PaymentDetailsPage";
import { AdminBillingActivityPage } from "../pages/admin/BillingActivityPage";
import { AdminWebhooksPage } from "../pages/admin/WebhooksPage";
import { AdminApiKeysPage } from "../pages/admin/ApiKeysPage";
import { AdminSettingsPage } from "../pages/admin/SettingsPage";
import { AdminProfilePage } from "../pages/admin/ProfilePage";

import { CustomerDashboardPage } from "../pages/customer/DashboardPage";
import { CustomerServicesPage } from "../pages/customer/ServicesPage";
import { CheckoutPage } from "../pages/customer/CheckoutPage";
import { CustomerSubscriptionsPage } from "../pages/customer/SubscriptionsPage";
import { SubscriptionDetailsPage } from "../pages/customer/SubscriptionDetailsPage";
import { CustomerInvoicesPage } from "../pages/customer/InvoicesPage";
import { CustomerInvoiceDetailsPage } from "../pages/customer/InvoiceDetailsPage";
import { CustomerBillingHistoryPage } from "../pages/customer/BillingHistoryPage";
import { CustomerProfilePage } from "../pages/customer/ProfilePage";
import { ServiceDetailsPage } from "../pages/customer/ServiceDetailsPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        index: true,
        element: <LandingPage />,
      },

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
            element: <AdminAccountRoute />,
            children: [
              {
                path: "workspace",
                element: <WorkspacePage />,
              },
              {
                path: "onboarding/create-business",
                element: <CreateBusinessPage />,
              },
            ],
          },

          {
            element: <CustomerAccountRoute />,
            children: [
              {
                path: "customer",
                element: <CustomerLayout />,
                children: [
                  {
                    index: true,
                    element: <CustomerDashboardPage />,
                  },
                  {
                    path: "dashboard",
                    element: (
                      <Navigate
                        to="/customer"
                        replace
                      />
                    ),
                  },
                  {
                    path: "explore",
                    element: <CustomerServicesPage />,
                  },
                  {
                    path: "services/:serviceId",
                    element: <ServiceDetailsPage />,
                  },
                  {
                    path: "plans",
                    element: <Navigate to="/customer/subscriptions" replace />,
                  },
                  {
                    path: "checkout/:planId",
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
                    element: <Navigate to="/customer" replace />,
                  },
                  {
                    path: "billing",
                    element: <CustomerBillingHistoryPage />,
                  },
                  {
                    path: "profile",
                    element: <CustomerProfilePage />,
                  },
                ],
              },
            ],
          },

          {
            element: <AdminAccountRoute />,
            children: [
              {
                path: "admin/:businessId",
                element: <AdminLayout />,
                children: [
                  {
                    path: "dashboard",
                    element: <AdminDashboardPage />,
                  },
                  {
                    path: "services",
                    element: <AdminServicesPage />,
                  },
                  {
                    path: "services/:serviceId",
                    element: <AdminServiceDetailsPage />,
                  },
                  {
                    path: "plans",
                    element: <AdminPlansPage />,
                  },
                  {
                    path: "services/:serviceId/plans/:planId",
                    element: <AdminPlanDetailsPage />,
                  },
                  {
                    path: "customers",
                    element: <AdminCustomersPage />,
                  },
                  {
                    path: "customers/:customerId",
                    element: <AdminCustomerDetailsPage />,
                  },
                  {
                    path: "subscriptions",
                    element: <AdminSubscriptionsPage />,
                  },
                  {
                    path: "subscriptions/:subscriptionId",
                    element: <AdminSubscriptionDetailsPage />,
                  },
                  {
                    path: "invoices",
                    element: <AdminInvoicesPage />,
                  },
                  {
                    path: "invoices/:invoiceId",
                    element: <AdminInvoiceDetailsPage />,
                  },
                  {
                    path: "payments",
                    element: <AdminPaymentsPage />,
                  },
                  {
                    path: "payments/:paymentId",
                    element: <AdminPaymentDetailsPage />,
                  },
                  {
                    path: "billing-activity",
                    element: <AdminBillingActivityPage />,
                  },
                  {
                    path: "webhooks",
                    element: <AdminWebhooksPage />,
                  },
                  {
                    path: "api-keys",
                    element: <AdminApiKeysPage />,
                  },
                  {
                    path: "settings",
                    element: <AdminSettingsPage />,
                  },
                  {
                    path: "profile",
                    element: <AdminProfilePage />,
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
]);
