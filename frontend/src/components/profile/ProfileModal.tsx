import React from "react";
import { useAuth } from "@/features/auth/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  User as UserIcon,
  Mail,
  Shield,
  KeyRound,
  CheckCircle2,
  Clock,
  X,
} from "lucide-react";

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { user } = useAuth();

  if (!isOpen) return null;

  const isManager = user?.role === "INVENTORY_MANAGER" || user?.role === "ADMIN";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Profile Header */}
        <div className="flex items-center gap-3.5 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground font-black text-lg shadow-sm">
            {user?.name ? user.name.charAt(0).toUpperCase() : <UserIcon className="h-6 w-6" />}
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
              {user?.name || "StockSense User"}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <Badge
                className={
                  isManager
                    ? "bg-primary text-primary-foreground text-[10px]"
                    : "bg-slate-200 text-slate-800 text-[10px]"
                }
              >
                <Shield className="h-2.5 w-2.5 mr-1" />
                {user?.role === "INVENTORY_MANAGER"
                  ? "Inventory Manager"
                  : user?.role === "ADMIN"
                  ? "System Admin"
                  : "Warehouse Staff"}
              </Badge>
              <span className="flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Active Session
              </span>
            </div>
          </div>
        </div>

        {/* User Details */}
        <div className="py-4 space-y-3.5">
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <Mail className="h-4 w-4 text-slate-400" />
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-semibold">Email Address</p>
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{user?.email}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <KeyRound className="h-4 w-4 text-slate-400" />
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-semibold">Authentication</p>
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  JWT Bearer Token (Argon2 / Bcrypt)
                </p>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-1.5">
            <p className="text-[10px] text-slate-400 uppercase font-semibold">Role Permissions</p>
            <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-1">
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                <span>Receive vendor stock & validate receipts</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                <span>Dispatch & validate delivery orders</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                <span>Execute internal transfers & stock adjustments</span>
              </li>
              {isManager && (
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                  <span>Configure products, categories & warehouses</span>
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
          <Button onClick={onClose} variant="outline" size="sm" className="text-xs h-9 px-4">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};
