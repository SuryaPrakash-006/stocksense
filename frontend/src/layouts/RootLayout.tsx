import React, { useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/features/auth/AuthContext";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { AlertIndicator } from "@/features/alerts/AlertIndicator";
import { ProfileModal } from "@/components/profile/ProfileModal";
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";
import { useToast } from "@/components/ui/ToastContext";
import {
  LayoutDashboard,
  Boxes,
  ArrowDownToLine,
  ArrowUpFromLine,
  Truck,
  SlidersHorizontal,
  History,
  Building2,
  Activity,
  User as UserIcon,
  LogOut,
  ShieldAlert,
  AlertTriangle,
  AlertOctagon,
  Menu,
  X,
  Shield,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigationGroups = [
  {
    title: "Overview",
    items: [
      { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    title: "Master Data",
    items: [{ name: "Products", href: "/products", icon: Boxes }],
  },
  {
    title: "Operations",
    items: [
      { name: "Receipts", href: "/operations/receipts", icon: ArrowDownToLine },
      {
        name: "Delivery Orders",
        href: "/operations/deliveries",
        icon: ArrowUpFromLine,
      },
      {
        name: "Internal Transfers",
        href: "/operations/transfers",
        icon: Truck,
      },
      {
        name: "Inventory Adjustments",
        href: "/operations/adjustments",
        icon: SlidersHorizontal,
      },
      {
        name: "Move History",
        href: "/operations/moves",
        icon: History,
      },
    ],
  },
  {
    title: "Stock Health & Alerts",
    items: [
      { name: "Alerts Center", href: "/alerts", icon: ShieldAlert },
      { name: "Low Stock", href: "/alerts/low-stock", icon: AlertTriangle },
      { name: "Out of Stock", href: "/alerts/out-of-stock", icon: AlertOctagon },
    ],
  },
  {
    title: "Settings",
    items: [{ name: "Warehouse", href: "/settings/warehouses", icon: Building2 }],
  },
];

export const RootLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { toast } = useToast();

  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);

  const handleLogout = async () => {
    setIsLogoutConfirmOpen(false);
    await logout();
    toast.info("You have successfully signed out.", "Session Closed");
    navigate("/login", { replace: true });
  };

  const isManager = user?.role === "INVENTORY_MANAGER" || user?.role === "ADMIN";

  const renderNavLinks = () => (
    <div className="space-y-5 px-3 py-4">
      {navigationGroups.map((group) => (
        <div key={group.title} className="space-y-1">
          <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            {group.title}
          </p>
          <div className="space-y-0.5">
            {group.items.map((item) => {
              const isActive =
                item.href === "/dashboard"
                  ? location.pathname === "/" || location.pathname === "/dashboard"
                  : location.pathname.startsWith(item.href);

              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setIsMobileNavOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-semibold transition-all duration-150",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/70 dark:hover:text-slate-100"
                  )}
                >
                  <item.icon className={cn("h-4 w-4 shrink-0", isActive ? "text-primary-foreground" : "text-slate-400")} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="flex h-screen w-full bg-slate-50 dark:bg-slate-950 overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 flex-col justify-between shrink-0 select-none">
        <div className="flex-1 overflow-y-auto">
          {/* App Header / Logo */}
          <div className="flex h-16 items-center px-6 border-b border-slate-200 dark:border-slate-800">
            <Link to="/dashboard" className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-black text-lg shadow-sm">
                S
              </div>
              <div>
                <h1 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
                  StockSense
                </h1>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  Inventory System
                </p>
              </div>
            </Link>
          </div>

          {/* Navigation Links */}
          {renderNavLinks()}
        </div>

        {/* User Account / Footer */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/60 shadow-2xs">
            <button
              onClick={() => setIsProfileOpen(true)}
              className="flex items-center gap-2.5 overflow-hidden text-left flex-1 min-w-0 hover:opacity-80 transition-opacity"
              title="View Profile Details"
            >
              <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                {user?.name ? user.name.charAt(0).toUpperCase() : <UserIcon className="h-4 w-4" />}
              </div>
              <div className="text-xs min-w-0">
                <p className="font-bold text-slate-900 dark:text-slate-100 truncate leading-tight">
                  {user?.name || "Inventory Staff"}
                </p>
                <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider truncate">
                  {user?.role === "INVENTORY_MANAGER"
                    ? "Manager"
                    : user?.role === "ADMIN"
                    ? "Admin"
                    : "Warehouse Staff"}
                </p>
              </div>
            </button>

            <button
              onClick={() => setIsLogoutConfirmOpen(true)}
              title="Sign Out"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 dark:hover:text-rose-400 transition-colors shrink-0"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile / Tablet Drawer Sidebar */}
      {isMobileNavOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden animate-in fade-in duration-150">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs"
            onClick={() => setIsMobileNavOpen(false)}
          />

          {/* Drawer content */}
          <div className="relative flex w-72 flex-col justify-between bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shadow-2xl animate-in slide-in-from-left duration-200">
            <div className="flex-1 overflow-y-auto">
              <div className="flex h-16 items-center justify-between px-6 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-bold text-base shadow-sm">
                    S
                  </div>
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    StockSense IMS
                  </span>
                </div>
                <button
                  onClick={() => setIsMobileNavOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {renderNavLinks()}
            </div>

            {/* Mobile Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                    {user?.name ? user.name.charAt(0).toUpperCase() : <UserIcon className="h-4 w-4" />}
                  </div>
                  <div className="text-xs">
                    <p className="font-semibold text-slate-900 dark:text-slate-100">{user?.name}</p>
                    <p className="text-[10px] text-slate-400">{user?.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsLogoutConfirmOpen(true)}
                  className="p-2 text-slate-400 hover:text-rose-600 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top App Header */}
        <header className="h-16 border-b border-slate-200 bg-white px-4 sm:px-6 lg:px-8 dark:border-slate-800 dark:bg-slate-900 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            {/* Mobile / Tablet Menu Button */}
            <button
              onClick={() => setIsMobileNavOpen(true)}
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              aria-label="Open Navigation"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Breadcrumbs */}
            <Breadcrumbs />
          </div>

          {/* Header Controls */}
          <div className="flex items-center gap-3">
            {/* Real-time Alert Indicator */}
            <AlertIndicator />

            {/* Database Engine Status */}
            <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              PostgreSQL Connected
            </span>

            {/* User Profile Trigger */}
            <button
              onClick={() => setIsProfileOpen(true)}
              className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
              title="Account & Role Permissions"
            >
              <div className="h-7 w-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                {user?.name ? user.name.charAt(0).toUpperCase() : <UserIcon className="h-3.5 w-3.5" />}
              </div>
            </button>
          </div>
        </header>

        {/* Scrollable Viewport */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-slate-50/75 dark:bg-slate-950">
          <Outlet />
        </main>
      </div>

      {/* Profile Dialog */}
      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />

      {/* Logout Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={isLogoutConfirmOpen}
        onClose={() => setIsLogoutConfirmOpen(false)}
        onConfirm={handleLogout}
        title="Sign Out of StockSense?"
        description="Your current authentication token will be invalidated and you will be redirected to the secure login portal."
        confirmText="Sign Out"
        variant="danger"
      />
    </div>
  );
};
