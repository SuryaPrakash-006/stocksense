import React from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";

interface BreadcrumbRouteMap {
  [path: string]: { section: string; title: string; parentHref?: string };
}

const routeMap: BreadcrumbRouteMap = {
  "/": { section: "Overview", title: "Dashboard" },
  "/dashboard": { section: "Overview", title: "Dashboard" },
  "/status": { section: "Overview", title: "System Status" },
  "/products": { section: "Master Data", title: "Products & Catalog" },
  "/operations/receipts": {
    section: "Operations",
    title: "Vendor Receipts",
  },
  "/operations/deliveries": {
    section: "Operations",
    title: "Delivery Orders",
  },
  "/operations/transfers": {
    section: "Operations",
    title: "Internal Transfers",
  },
  "/operations/adjustments": {
    section: "Operations",
    title: "Stock Adjustments",
  },
  "/operations/moves": {
    section: "Operations",
    title: "Move History & Ledger",
  },
  "/alerts": {
    section: "Stock Health",
    title: "Alerts Center",
  },
  "/alerts/low-stock": {
    section: "Stock Health",
    title: "Low Stock Detection",
    parentHref: "/alerts",
  },
  "/alerts/out-of-stock": {
    section: "Stock Health",
    title: "Out-of-Stock Critical",
    parentHref: "/alerts",
  },
  "/settings/warehouses": {
    section: "Configuration",
    title: "Warehouse & Locations",
  },
};

export const Breadcrumbs: React.FC = () => {
  const location = useLocation();
  const current = routeMap[location.pathname] || {
    section: "StockSense",
    title: location.pathname.replace(/^\//, "").replace(/-/g, " "),
  };

  return (
    <nav className="flex items-center gap-1.5 text-xs text-slate-500 font-medium select-none" aria-label="Breadcrumb">
      <Link
        to="/dashboard"
        className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
      >
        <Home className="h-3.5 w-3.5 text-slate-400" />
      </Link>
      <ChevronRight className="h-3 w-3 text-slate-400" />
      <span className="text-slate-400">{current.section}</span>
      <ChevronRight className="h-3 w-3 text-slate-400" />
      <span className="font-semibold text-slate-800 dark:text-slate-200">
        {current.title}
      </span>
    </nav>
  );
};
