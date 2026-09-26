import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/features/auth/AuthContext";
import { UserRole } from "@/types/auth";
import { RefreshCw, ShieldAlert } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
}) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950">
        <RefreshCw className="h-8 w-8 animate-spin text-primary mb-3" />
        <p className="text-sm text-slate-500 font-medium">
          Verifying session credentials...
        </p>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (
    allowedRoles &&
    !allowedRoles.includes(user.role) &&
    user.role !== "ADMIN"
  ) {
    return (
      <div className="p-8 max-w-xl mx-auto">
        <Card className="border-rose-200 dark:border-rose-900 bg-rose-50/50 dark:bg-rose-950/20">
          <CardHeader className="flex flex-row items-center gap-3">
            <ShieldAlert className="h-6 w-6 text-rose-600" />
            <CardTitle className="text-base text-rose-900 dark:text-rose-200">
              Access Restricted
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs text-rose-700 dark:text-rose-300">
            <p>
              Your current account role (<strong>{user.role}</strong>) does not have authorization to view this section.
            </p>
            <p>
              Required roles: <strong>{allowedRoles.join(", ")}</strong>.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
};
