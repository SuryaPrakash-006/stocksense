import { createBrowserRouter, Navigate } from "react-router-dom";
import { RootLayout } from "@/layouts/RootLayout";
import { DashboardPage } from "@/pages/DashboardPage";
import { HealthPage } from "@/pages/HealthPage";
import { LoginPage } from "@/pages/auth/LoginPage";
import { SignupPage } from "@/pages/auth/SignupPage";
import { ForgotPasswordPage } from "@/pages/auth/ForgotPasswordPage";
import { ResetPasswordPage } from "@/pages/auth/ResetPasswordPage";
import { ProductsPage } from "@/pages/products/ProductsPage";
import { ReceiptsPage } from "@/pages/operations/ReceiptsPage";
import { DeliveriesPage } from "@/pages/operations/DeliveriesPage";
import { TransfersPage } from "@/pages/operations/TransfersPage";
import { AdjustmentsPage } from "@/pages/operations/AdjustmentsPage";
import { MoveHistoryPage } from "@/pages/operations/MoveHistoryPage";
import { WarehousesPage } from "@/pages/settings/WarehousesPage";
import { AlertsPage } from "@/pages/alerts/AlertsPage";
import { LowStockPage } from "@/pages/alerts/LowStockPage";
import { OutOfStockPage } from "@/pages/alerts/OutOfStockPage";
import { ProtectedRoute } from "@/routes/ProtectedRoute";

export const router = createBrowserRouter([
  // Public Auth Routes
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/signup",
    element: <SignupPage />,
  },
  {
    path: "/forgot-password",
    element: <ForgotPasswordPage />,
  },
  {
    path: "/reset-password",
    element: <ResetPasswordPage />,
  },

  // Protected Application Routes
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <RootLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <DashboardPage />,
      },
      {
        path: "dashboard",
        element: <DashboardPage />,
      },
      {
        path: "status",
        element: <HealthPage />,
      },
      {
        path: "products",
        element: <ProductsPage />,
      },
      {
        path: "alerts",
        element: <AlertsPage />,
      },
      {
        path: "alerts/low-stock",
        element: <LowStockPage />,
      },
      {
        path: "alerts/out-of-stock",
        element: <OutOfStockPage />,
      },
      {
        path: "operations/receipts",
        element: <ReceiptsPage />,
      },
      {
        path: "operations/deliveries",
        element: <DeliveriesPage />,
      },
      {
        path: "operations/transfers",
        element: <TransfersPage />,
      },
      {
        path: "operations/adjustments",
        element: <AdjustmentsPage />,
      },
      {
        path: "operations/moves",
        element: <MoveHistoryPage />,
      },
      {
        path: "settings/warehouses",
        element: <WarehousesPage />,
      },
      {
        path: "*",
        element: <Navigate to="/dashboard" replace />,
      },
    ],
  },
]);
