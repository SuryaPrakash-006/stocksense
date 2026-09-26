import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { dashboardService } from "@/services/dashboard-service";
import { productService } from "@/services/product-service";
import { warehouseService } from "@/services/warehouse-service";
import { useAuth } from "@/features/auth/AuthContext";
import { DashboardFilterParams, LowStockItem } from "@/types/dashboard";
import { ProductCategory } from "@/types/product";
import { Location, Warehouse } from "@/types/warehouse";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertCircle,
  AlertTriangle,
  ArrowDownToLine,
  ArrowRight,
  ArrowUpFromLine,
  ArrowUpRight,
  Boxes,
  Building2,
  CheckCircle2,
  Clock,
  Filter,
  Layers,
  MapPin,
  Package,
  Plus,
  RefreshCw,
  RotateCcw,
  SlidersHorizontal,
  TrendingDown,
  Truck,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

const CHART_COLORS = [
  "#6366f1",
  "#10b981",
  "#3b82f6",
  "#f59e0b",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
];

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();

  // Filters State
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>("");
  const [selectedLocation, setSelectedLocation] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  const filterParams: DashboardFilterParams = {
    warehouse_id: selectedWarehouse || undefined,
    location_id: selectedLocation || undefined,
    category_id: selectedCategory || undefined,
  };

  const hasActiveFilters = Boolean(
    selectedWarehouse || selectedLocation || selectedCategory
  );

  // Queries
  const {
    data: dashboardData,
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ["dashboard-overview", filterParams],
    queryFn: () => dashboardService.getOverview(filterParams),
  });

  const { data: categories = [] } = useQuery<ProductCategory[]>({
    queryKey: ["categories"],
    queryFn: () => productService.getCategories(),
  });

  const { data: warehouses = [] } = useQuery<Warehouse[]>({
    queryKey: ["warehouses"],
    queryFn: () => warehouseService.listWarehouses(),
  });

  const { data: locations = [] } = useQuery<Location[]>({
    queryKey: ["locations"],
    queryFn: () => warehouseService.listLocations(),
  });

  const kpis = dashboardData?.kpis;
  const pendingOps = dashboardData?.pending_operations;
  const lowStockList = dashboardData?.low_stock_list || [];
  const categoryBreakdown = dashboardData?.category_breakdown || [];
  const warehouseBreakdown = dashboardData?.warehouse_breakdown || [];
  const recentActivities = dashboardData?.recent_activity || [];

  const chartData = categoryBreakdown.map((c) => ({
    name: c.category_name,
    stock: parseFloat(String(c.total_stock)),
    count: c.product_count,
  }));

  const handleResetFilters = () => {
    setSelectedWarehouse("");
    setSelectedLocation("");
    setSelectedCategory("");
  };

  const getActivityBadge = (type: string, status: string) => {
    switch (type) {
      case "RECEIPT":
        return (
          <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 text-[10px]">
            Receipt ({status})
          </Badge>
        );
      case "DELIVERY":
        return (
          <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-200 text-[10px]">
            Delivery ({status})
          </Badge>
        );
      case "TRANSFER":
        return (
          <Badge className="bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border-indigo-200 text-[10px]">
            Transfer ({status})
          </Badge>
        );
      case "ADJUSTMENT":
        return (
          <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border-purple-200 text-[10px]">
            Adjustment ({status})
          </Badge>
        );
      default:
        return <Badge variant="outline" className="text-[10px]">{type}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-2xl shadow-sm border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight">
              Welcome back, {user?.name || "Inventory Team"}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              {user?.role === "INVENTORY_MANAGER" ? "Manager Console" : "Operations Staff"}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Live operational dashboard with real-time PostgreSQL inventory balances, vendor receipts, customer deliveries, and scheduled internal transfers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isRefetching}
            className="h-9 px-3 text-xs bg-slate-800/80 hover:bg-slate-800 text-slate-200 border-slate-700"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isRefetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Dynamic Filter Toolbar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-center">
          {/* Warehouse Filter */}
          <div>
            <select
              value={selectedWarehouse}
              onChange={(e) => setSelectedWarehouse(e.target.value)}
              className="w-full h-9 px-3 rounded-md border border-input bg-transparent text-xs text-slate-800 dark:text-slate-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="" className="dark:bg-slate-900">All Warehouses</option>
              {warehouses.map((w: Warehouse) => (
                <option key={w.id} value={w.id} className="dark:bg-slate-900">
                  {w.name} ({w.code})
                </option>
              ))}
            </select>
          </div>

          {/* Location Filter */}
          <div>
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="w-full h-9 px-3 rounded-md border border-input bg-transparent text-xs text-slate-800 dark:text-slate-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="" className="dark:bg-slate-900">All Locations</option>
              {locations.map((l: Location) => (
                <option key={l.id} value={l.id} className="dark:bg-slate-900">
                  {l.name} ({l.code})
                </option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full h-9 px-3 rounded-md border border-input bg-transparent text-xs text-slate-800 dark:text-slate-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="" className="dark:bg-slate-900">All Categories</option>
              {categories.map((c: ProductCategory) => (
                <option key={c.id} value={c.id} className="dark:bg-slate-900">
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Reset Button */}
          <div className="flex justify-end">
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetFilters}
                className="text-xs text-slate-500 hover:text-slate-900 flex items-center gap-1.5 h-9"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Reset Filters</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Primary KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3.5">
        {/* 1. Total Products in Stock */}
        <Link
          to="/products"
          className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-indigo-300 dark:hover:border-indigo-800 transition-all group"
        >
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-medium">Products in Stock</span>
            <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 group-hover:scale-110 transition-transform">
              <Boxes className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {kpis?.total_products_in_stock ?? 0}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {parseFloat(String(kpis?.total_units_in_stock || 0)).toLocaleString()} total units
            </p>
          </div>
        </Link>

        {/* 2. Low Stock Items */}
        <Link
          to="/products"
          className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-amber-300 dark:hover:border-amber-800 transition-all group"
        >
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-medium">Low Stock</span>
            <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950 text-amber-600 group-hover:scale-110 transition-transform">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {kpis?.low_stock_items ?? 0}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              At or below reorder level
            </p>
          </div>
        </Link>

        {/* 3. Out of Stock Items */}
        <Link
          to="/products"
          className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-rose-300 dark:hover:border-rose-800 transition-all group"
        >
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-medium">Out of Stock</span>
            <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950 text-rose-600 group-hover:scale-110 transition-transform">
              <AlertCircle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-2xl font-bold text-rose-600 dark:text-rose-400">
              {kpis?.out_of_stock_items ?? 0}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Zero balance available
            </p>
          </div>
        </Link>

        {/* 4. Pending Receipts */}
        <Link
          to="/operations/receipts"
          className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-emerald-300 dark:hover:border-emerald-800 transition-all group"
        >
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-medium">Pending Receipts</span>
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 group-hover:scale-110 transition-transform">
              <ArrowDownToLine className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {kpis?.pending_receipts ?? 0}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Inbound vendor shipments
            </p>
          </div>
        </Link>

        {/* 5. Pending Deliveries */}
        <Link
          to="/operations/deliveries"
          className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-blue-300 dark:hover:border-blue-800 transition-all group"
        >
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-medium">Pending Deliveries</span>
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 group-hover:scale-110 transition-transform">
              <ArrowUpFromLine className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {kpis?.pending_deliveries ?? 0}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Customer orders in progress
            </p>
          </div>
        </Link>

        {/* 6. Scheduled Transfers */}
        <Link
          to="/operations/transfers"
          className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-purple-300 dark:hover:border-purple-800 transition-all group"
        >
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-medium">Internal Transfers</span>
            <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950 text-purple-600 group-hover:scale-110 transition-transform">
              <Truck className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {kpis?.scheduled_transfers ?? 0}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Scheduled stock relocations
            </p>
          </div>
        </Link>
      </div>

      {/* Pending Operations Pipeline Breakdown */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Clock className="h-4 w-4 text-indigo-600" />
          <span>Pending Operations Pipeline</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Receipts Status */}
          <Link
            to="/operations/receipts"
            className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2 hover:border-emerald-300 transition-colors"
          >
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <ArrowDownToLine className="h-3.5 w-3.5 text-emerald-600" /> Inbound Receipts
              </span>
              <span className="font-bold text-emerald-600">
                {kpis?.pending_receipts ?? 0} total
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px]">
              <span className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                {pendingOps?.receipts_draft ?? 0} Draft
              </span>
              <span className="px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300">
                {pendingOps?.receipts_waiting ?? 0} Waiting
              </span>
              <span className="px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
                {pendingOps?.receipts_ready ?? 0} Ready
              </span>
            </div>
          </Link>

          {/* Deliveries Status */}
          <Link
            to="/operations/deliveries"
            className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2 hover:border-blue-300 transition-colors"
          >
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <ArrowUpFromLine className="h-3.5 w-3.5 text-blue-600" /> Outbound Deliveries
              </span>
              <span className="font-bold text-blue-600">
                {kpis?.pending_deliveries ?? 0} total
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px]">
              <span className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                {pendingOps?.deliveries_draft ?? 0} Draft
              </span>
              <span className="px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300">
                {pendingOps?.deliveries_waiting ?? 0} Picking
              </span>
              <span className="px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
                {pendingOps?.deliveries_ready ?? 0} Packed
              </span>
            </div>
          </Link>

          {/* Transfers Status */}
          <Link
            to="/operations/transfers"
            className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2 hover:border-purple-300 transition-colors"
          >
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Truck className="h-3.5 w-3.5 text-purple-600" /> Internal Transfers
              </span>
              <span className="font-bold text-purple-600">
                {kpis?.scheduled_transfers ?? 0} total
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px]">
              <span className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                {pendingOps?.transfers_draft ?? 0} Draft
              </span>
              <span className="px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
                {pendingOps?.transfers_ready ?? 0} Ready
              </span>
            </div>
          </Link>
        </div>
      </div>

      {/* Main Visuals & Low Stock Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Low Stock Alert Table */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                <span>Low & Out of Stock Inventory</span>
              </h2>
              <p className="text-xs text-slate-400">
                Products requiring immediate purchase orders or inventory replenishment
              </p>
            </div>
            <Link
              to="/products"
              className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
            >
              <span>View All Products</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {lowStockList.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
              <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                No low-stock alerts
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                All inventory levels meet or exceed target reorder levels.
              </p>
            </div>
          ) : (
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-medium">
                    <th className="py-2.5 px-3">Product / SKU</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3 text-right">Current Stock</th>
                    <th className="py-2.5 px-3 text-right">Reorder Level</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {lowStockList.map((item: LowStockItem) => (
                    <tr key={item.product_id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-slate-900 dark:text-slate-100">
                          {item.product_name}
                        </div>
                        <div className="text-[11px] font-mono text-slate-400">SKU: {item.sku}</div>
                      </td>
                      <td className="py-2.5 px-3 text-slate-500">
                        {item.category_name || "Uncategorized"}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-900 dark:text-slate-100">
                        {parseFloat(String(item.current_stock)).toLocaleString()}{" "}
                        <span className="font-normal text-slate-400">{item.unit_of_measure}</span>
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-500">
                        {parseFloat(String(item.reorder_level)).toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {item.status === "OUT_OF_STOCK" ? (
                          <Badge variant="destructive" className="text-[10px] py-0">
                            Out of Stock
                          </Badge>
                        ) : (
                          <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-200 text-[10px] py-0">
                            Low Stock
                          </Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right 1 Col: Quick Actions & Warehouses */}
        <div className="space-y-6">
          {/* Quick Operations Launchpad */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Quick Operations
            </h2>
            <div className="grid grid-cols-2 gap-2">
              <Link to="/operations/receipts">
                <Button variant="outline" className="w-full text-xs justify-start h-10 border-slate-200">
                  <ArrowDownToLine className="h-3.5 w-3.5 mr-2 text-emerald-500" />
                  New Receipt
                </Button>
              </Link>
              <Link to="/operations/deliveries">
                <Button variant="outline" className="w-full text-xs justify-start h-10 border-slate-200">
                  <ArrowUpFromLine className="h-3.5 w-3.5 mr-2 text-blue-500" />
                  New Delivery
                </Button>
              </Link>
              <Link to="/operations/transfers">
                <Button variant="outline" className="w-full text-xs justify-start h-10 border-slate-200">
                  <Truck className="h-3.5 w-3.5 mr-2 text-indigo-500" />
                  New Transfer
                </Button>
              </Link>
              <Link to="/operations/adjustments">
                <Button variant="outline" className="w-full text-xs justify-start h-10 border-slate-200">
                  <SlidersHorizontal className="h-3.5 w-3.5 mr-2 text-purple-500" />
                  Adjustment
                </Button>
              </Link>
            </div>
          </div>

          {/* Warehouses Snapshot */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Warehouses Breakdown
              </h2>
              <Link to="/settings/warehouses" className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">
                Manage
              </Link>
            </div>

            <div className="space-y-2">
              {warehouseBreakdown.length === 0 ? (
                <p className="text-xs text-slate-400 py-3 text-center">No inventory yet.</p>
              ) : (
                warehouseBreakdown.map((w) => (
                  <div
                    key={w.warehouse_id}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 text-xs"
                  >
                    <div>
                      <div className="font-semibold text-slate-800 dark:text-slate-200">
                        {w.warehouse_name} ({w.warehouse_code})
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {w.total_locations} active location{w.total_locations !== 1 ? "s" : ""}
                      </div>
                    </div>
                    <div className="text-right font-bold text-slate-900 dark:text-slate-100">
                      {parseFloat(String(w.total_stock)).toLocaleString()} <span className="text-[10px] font-normal text-slate-400">units</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Category Volume Distribution Chart */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Stock Distribution by Category
            </h2>
            <p className="text-xs text-slate-400">
              Aggregated stock quantities categorized across product families
            </p>
          </div>
        </div>

        {chartData.length === 0 ? (
          <div className="p-10 text-center text-slate-400 text-xs">
            No inventory yet.
          </div>
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  angle={-20}
                  textAnchor="end"
                />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} />
                <Tooltip
                  formatter={(val: number) => [`${val.toLocaleString()} units`, "Stock"]}
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    borderColor: "#334155",
                    borderRadius: "8px",
                    fontSize: "12px",
                    color: "#fff",
                  }}
                />
                <Bar dataKey="stock" radius={[4, 4, 0, 0]}>
                  {chartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Recent Inventory Operations Stream */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Recent Inventory Operations
            </h2>
            <p className="text-xs text-slate-400">
              Chronological log of newly created receipts, deliveries, and transfers
            </p>
          </div>
          <Link
            to="/operations/moves"
            className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
          >
            <span>View Full Move History</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {recentActivities.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            No pending receipts, deliveries, or transfers yet.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {recentActivities.map((act) => (
              <div key={act.id} className="py-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  {getActivityBadge(act.type, act.status)}
                  <div>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {act.document_number}
                    </span>{" "}
                    <span className="text-slate-500">— {act.summary}</span>
                  </div>
                </div>
                <div className="text-slate-400 text-[11px]">
                  {new Date(act.created_at).toLocaleString([], {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
