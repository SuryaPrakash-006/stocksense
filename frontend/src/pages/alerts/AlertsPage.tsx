import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { alertService } from "@/services/alert-service";
import { AlertFilterBar } from "@/features/alerts/AlertFilterBar";
import { StockAlertTable } from "@/features/alerts/StockAlertTable";
import { Button } from "@/components/ui/button";
import {
  ShieldAlert,
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  ArrowDownToLine,
  Boxes,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const AlertsPage: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [selectedWarehouse, setSelectedWarehouse] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [sortBy, setSortBy] = useState("deficit");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const { data: summary } = useQuery({
    queryKey: ["stockAlertsSummary", selectedWarehouse, selectedCategory],
    queryFn: () =>
      alertService.getSummary({
        warehouse_id: selectedWarehouse || undefined,
        category_id: selectedCategory || undefined,
      }),
  });

  const { data, isLoading } = useQuery({
    queryKey: [
      "allStockAlerts",
      statusFilter,
      search,
      selectedWarehouse,
      selectedCategory,
      page,
      pageSize,
      sortBy,
      sortOrder,
    ],
    queryFn: () =>
      alertService.getAlerts({
        status: statusFilter === "ALL" ? undefined : statusFilter,
        search: search || undefined,
        warehouse_id: selectedWarehouse || undefined,
        category_id: selectedCategory || undefined,
        page,
        page_size: pageSize,
        sort_by: sortBy,
        sort_order: sortOrder,
      }),
  });

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  const handleResetFilters = () => {
    setStatusFilter("ALL");
    setSearch("");
    setSelectedWarehouse("");
    setSelectedCategory("");
    setPage(1);
  };

  const items = data?.items || [];
  const total = data?.total || 0;
  const pages = data?.pages || 1;

  const totalAlerts = summary?.total_alerts || 0;
  const criticalCount = summary?.critical_count || 0;
  const warningCount = summary?.warning_count || 0;
  const inStockCount = summary?.in_stock_count || 0;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                Stock Alerts & Inventory Health
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Automated threshold evaluation across all warehouses and storage locations
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/operations/receipts">
            <Button className="gap-2 shadow-xs bg-primary hover:bg-primary/90 text-white text-xs h-9">
              <ArrowDownToLine className="h-4 w-4" />
              <span>Create Restock Receipt</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Active Alerts */}
        <div
          onClick={() => {
            setStatusFilter("ALL");
            setPage(1);
          }}
          className={cn(
            "p-4 rounded-xl border cursor-pointer transition-all shadow-xs",
            statusFilter === "ALL"
              ? "border-primary bg-primary/5 dark:border-primary dark:bg-primary/10"
              : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300"
          )}
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Alerts
            </p>
            <ShieldAlert className="h-4 w-4 text-primary" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {totalAlerts}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Requires inventory attention
          </p>
        </div>

        {/* Critical Out of Stock */}
        <div
          onClick={() => {
            setStatusFilter("OUT_OF_STOCK");
            setPage(1);
          }}
          className={cn(
            "p-4 rounded-xl border cursor-pointer transition-all shadow-xs",
            statusFilter === "OUT_OF_STOCK"
              ? "border-rose-500 bg-rose-50 dark:border-rose-600 dark:bg-rose-950/30"
              : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-rose-200"
          )}
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
              Out of Stock
            </p>
            <AlertOctagon className="h-4 w-4 text-rose-600 dark:text-rose-400" />
          </div>
          <p className="text-2xl font-black text-rose-700 dark:text-rose-300 mt-1">
            {criticalCount}
          </p>
          <p className="text-[11px] text-rose-500 mt-0.5">
            Critical (Quantity &le; 0)
          </p>
        </div>

        {/* Warning Low Stock */}
        <div
          onClick={() => {
            setStatusFilter("LOW_STOCK");
            setPage(1);
          }}
          className={cn(
            "p-4 rounded-xl border cursor-pointer transition-all shadow-xs",
            statusFilter === "LOW_STOCK"
              ? "border-amber-500 bg-amber-50 dark:border-amber-600 dark:bg-amber-950/30"
              : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-amber-200"
          )}
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              Low Stock
            </p>
            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          </div>
          <p className="text-2xl font-black text-amber-700 dark:text-amber-300 mt-1">
            {warningCount}
          </p>
          <p className="text-[11px] text-amber-500 mt-0.5">
            0 &lt; Q &le; Reorder Level
          </p>
        </div>

        {/* Healthy / In Stock */}
        <div
          onClick={() => {
            setStatusFilter("IN_STOCK");
            setPage(1);
          }}
          className={cn(
            "p-4 rounded-xl border cursor-pointer transition-all shadow-xs",
            statusFilter === "IN_STOCK"
              ? "border-emerald-500 bg-emerald-50 dark:border-emerald-600 dark:bg-emerald-950/30"
              : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-emerald-200"
          )}
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              Optimal Stock
            </p>
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-emerald-700 dark:text-emerald-300 mt-1">
            {inStockCount}
          </p>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5">
            Above reorder threshold
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <AlertFilterBar
        search={search}
        onSearchChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
        selectedWarehouse={selectedWarehouse}
        onWarehouseChange={(val) => {
          setSelectedWarehouse(val);
          setPage(1);
        }}
        selectedCategory={selectedCategory}
        onCategoryChange={(val) => {
          setSelectedCategory(val);
          setPage(1);
        }}
        selectedStatus={statusFilter}
        onStatusChange={(val) => {
          setStatusFilter(val);
          setPage(1);
        }}
        showStatusFilter={true}
        onReset={handleResetFilters}
      />

      {/* Table */}
      <StockAlertTable
        items={items}
        total={total}
        page={page}
        pageSize={pageSize}
        pages={pages}
        isLoading={isLoading}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={handleSort}
        onPageChange={setPage}
        emptyTitle={
          statusFilter === "OUT_OF_STOCK"
            ? "No out-of-stock items detected"
            : statusFilter === "LOW_STOCK"
            ? "No low-stock items detected"
            : "No inventory alerts matching the active filters"
        }
        emptyDescription={
          statusFilter === "OUT_OF_STOCK"
            ? "All active products have positive available stock."
            : statusFilter === "LOW_STOCK"
            ? "All monitored stock levels exceed configured reorder thresholds."
            : "Adjust your filter criteria or search query to view items."
        }
      />
    </div>
  );
};
