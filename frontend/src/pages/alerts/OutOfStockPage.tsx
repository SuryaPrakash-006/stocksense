import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { alertService } from "@/services/alert-service";
import { AlertFilterBar } from "@/features/alerts/AlertFilterBar";
import { StockAlertTable } from "@/features/alerts/StockAlertTable";
import { Button } from "@/components/ui/button";
import {
  AlertOctagon,
  ArrowDownToLine,
  Boxes,
  ShieldAlert,
  Warehouse as WarehouseIcon,
} from "lucide-react";

export const OutOfStockPage: React.FC = () => {
  const [search, setSearch] = useState("");
  const [selectedWarehouse, setSelectedWarehouse] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(15);
  const [sortBy, setSortBy] = useState("reorder_level");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const { data, isLoading } = useQuery({
    queryKey: [
      "outOfStockAlerts",
      search,
      selectedWarehouse,
      selectedCategory,
      page,
      pageSize,
      sortBy,
      sortOrder,
    ],
    queryFn: () =>
      alertService.getOutOfStock({
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
              <AlertOctagon className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                Out-of-Stock Alerts
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Critical product/location combinations where recorded quantity is &le; 0
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/operations/receipts">
            <Button className="gap-2 shadow-xs bg-rose-600 hover:bg-rose-700 text-white text-xs h-9">
              <ArrowDownToLine className="h-4 w-4" />
              <span>Create Emergency Restock</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-950/20 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-rose-700 dark:text-rose-400 uppercase tracking-wider">
              Out of Stock SKUs
            </p>
            <p className="text-2xl font-black text-rose-900 dark:text-rose-200 mt-1">
              {summary ? summary.out_of_stock_count : total}
            </p>
            <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-0.5">
              Zero physical units available
            </p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-200/60 dark:bg-rose-900/60 text-rose-800 dark:text-rose-300">
            <ShieldAlert className="h-5 w-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Severity Level
            </p>
            <p className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">
              CRITICAL
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Out-of-stock items block customer shipments
            </p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
            <Boxes className="h-5 w-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Evaluation Basis
            </p>
            <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-1">
              Quantity &le; 0.0000
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Direct PostgreSQL balance checks
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
        emptyTitle="No out-of-stock items detected"
        emptyDescription="All products in the inventory currently have active stock available."
      />
    </div>
  );
};
