import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { alertService } from "@/services/alert-service";
import { AlertFilterBar } from "@/features/alerts/AlertFilterBar";
import { StockAlertTable } from "@/features/alerts/StockAlertTable";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  ArrowDownToLine,
  Boxes,
  TrendingDown,
  Warehouse as WarehouseIcon,
} from "lucide-react";

export const LowStockPage: React.FC = () => {
  const [search, setSearch] = useState("");
  const [selectedWarehouse, setSelectedWarehouse] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(15);
  const [sortBy, setSortBy] = useState("deficit");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const { data, isLoading, refetch } = useQuery({
    queryKey: [
      "lowStockAlerts",
      search,
      selectedWarehouse,
      selectedCategory,
      page,
      pageSize,
      sortBy,
      sortOrder,
    ],
    queryFn: () =>
      alertService.getLowStock({
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
    setSearch("");
    setSelectedWarehouse("");
    setSelectedCategory("");
    setPage(1);
  };

  const items = data?.items || [];
  const total = data?.total || 0;
  const pages = data?.pages || 1;
  const summary = data?.summary;

  // Calculate total deficit units across low stock items on page
  const totalDeficit = items.reduce(
    (acc, curr) => acc + Number(curr.deficit_quantity || 0),
    0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                Low Stock Detection
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Products where current physical quantity is &le; configured reorder threshold
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/operations/receipts">
            <Button className="gap-2 shadow-xs bg-primary hover:bg-primary/90 text-white text-xs h-9">
              <ArrowDownToLine className="h-4 w-4" />
              <span>Create Vendor Restock</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/20 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
              Low Stock Items
            </p>
            <p className="text-2xl font-black text-amber-900 dark:text-amber-200 mt-1">
              {summary ? summary.low_stock_count : total}
            </p>
            <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-0.5">
              Requires procurement review
            </p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-200/60 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300">
            <Boxes className="h-5 w-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Page Deficit Volume
            </p>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {totalDeficit.toLocaleString(undefined, {
                minimumFractionDigits: 0,
                maximumFractionDigits: 2,
              })}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Cumulative units below safety levels
            </p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
            <TrendingDown className="h-5 w-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Evaluation Basis
            </p>
            <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-1">
              0 &lt; Q &le; Reorder Level
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Real-time PostgreSQL balances
            </p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
            <WarehouseIcon className="h-5 w-5" />
          </div>
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
        onReset={handleResetFilters}
      />

      {/* Alert Table */}
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
        emptyTitle="No low-stock items detected"
        emptyDescription="All stocked products currently have inventory levels above their configured reorder thresholds."
      />
    </div>
  );
};
