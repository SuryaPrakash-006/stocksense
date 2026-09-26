import React from "react";
import { Link } from "react-router-dom";
import { StockAlertItem } from "@/types/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowDownToLine,
  SlidersHorizontal,
  MapPin,
  Building2,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface StockAlertTableProps {
  items: StockAlertItem[];
  total: number;
  page: number;
  pageSize: number;
  pages: number;
  isLoading: boolean;
  sortBy: string;
  sortOrder: "asc" | "desc";
  onSort: (field: string) => void;
  onPageChange: (newPage: number) => void;
  emptyTitle?: string;
  emptyDescription?: string;
}

export const StockAlertTable: React.FC<StockAlertTableProps> = ({
  items,
  total,
  page,
  pageSize,
  pages,
  isLoading,
  sortBy,
  sortOrder,
  onSort,
  onPageChange,
  emptyTitle = "No inventory alerts",
  emptyDescription = "All monitored items currently satisfy their required reorder thresholds.",
}) => {
  const renderStatusBadge = (status: string, severity: string) => {
    switch (status) {
      case "OUT_OF_STOCK":
        return (
          <Badge
            variant="destructive"
            className="flex items-center gap-1 font-semibold text-[11px] w-fit shadow-2xs"
          >
            <AlertOctagon className="h-3 w-3 animate-pulse" />
            <span>Out of Stock</span>
          </Badge>
        );
      case "LOW_STOCK":
        return (
          <Badge className="bg-amber-500 hover:bg-amber-600 text-white flex items-center gap-1 font-semibold text-[11px] w-fit shadow-2xs">
            <AlertTriangle className="h-3 w-3" />
            <span>Low Stock</span>
          </Badge>
        );
      case "IN_STOCK":
        return (
          <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1 font-semibold text-[11px] w-fit shadow-2xs">
            <CheckCircle2 className="h-3 w-3" />
            <span>In Stock</span>
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const renderSortHeader = (label: string, field: string) => (
    <th
      onClick={() => onSort(field)}
      className="px-4 py-3.5 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider cursor-pointer hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-colors select-none"
    >
      <div className="flex items-center gap-1.5">
        <span>{label}</span>
        <ArrowUpDown
          className={cn(
            "h-3.5 w-3.5 transition-colors",
            sortBy === field ? "text-primary font-bold" : "text-slate-400"
          )}
        />
      </div>
    </th>
  );

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/75 dark:border-slate-800 dark:bg-slate-800/40">
              {renderSortHeader("Product & SKU", "product_name")}
              <th className="px-4 py-3.5 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                Warehouse / Location
              </th>
              {renderSortHeader("Current Stock", "quantity")}
              {renderSortHeader("Reorder Threshold", "reorder_level")}
              {renderSortHeader("Deficit / Shortage", "deficit")}
              <th className="px-4 py-3.5 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                Health Status
              </th>
              <th className="px-4 py-3.5 text-right text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                Quick Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-sm text-slate-500">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                    <p>Evaluating stock balances against reorder thresholds...</p>
                  </div>
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-16 text-center text-slate-500">
                  <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 mb-3">
                      <ShieldCheck className="h-6 w-6" />
                    </div>
                    <p className="font-bold text-slate-800 dark:text-slate-200 text-base">
                      {emptyTitle}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">{emptyDescription}</p>
                  </div>
                </td>
              </tr>
            ) : (
              items.map((item) => {
                const currentQty = Number(item.current_quantity);
                const reorder = Number(item.reorder_level);
                const deficit = Number(item.deficit_quantity);
                const isCritical = item.status === "OUT_OF_STOCK";
                const isWarning = item.status === "LOW_STOCK";

                // Calculate stock health percentage
                const healthPercent =
                  reorder > 0 ? Math.min(100, (currentQty / reorder) * 100) : 100;

                return (
                  <tr
                    key={item.id}
                    className={cn(
                      "hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors",
                      isCritical && "bg-rose-50/20 dark:bg-rose-950/10"
                    )}
                  >
                    {/* Product & SKU */}
                    <td className="px-4 py-3.5">
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-900 dark:text-white text-sm">
                          {item.product_name}
                        </span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="font-mono text-xs text-primary font-medium">
                            {item.product_sku}
                          </span>
                          {item.category_name && (
                            <span className="inline-flex items-center rounded-xs bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                              {item.category_name}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Warehouse & Location */}
                    <td className="px-4 py-3.5 text-xs text-slate-600 dark:text-slate-300">
                      {item.location_name ? (
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-1.5 font-medium text-slate-900 dark:text-slate-200">
                            <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                            <span>{item.location_name}</span>
                            {item.location_code && (
                              <span className="font-mono text-[10px] text-slate-400">
                                ({item.location_code})
                              </span>
                            )}
                          </div>
                          {item.warehouse_name && (
                            <div className="flex items-center gap-1 text-[11px] text-slate-500 pl-5">
                              <Building2 className="h-3 w-3 shrink-0" />
                              <span>{item.warehouse_name}</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Unallocated / Global</span>
                      )}
                    </td>

                    {/* Current Stock */}
                    <td className="px-4 py-3.5">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-baseline gap-1">
                          <span
                            className={cn(
                              "text-sm font-bold",
                              isCritical
                                ? "text-rose-600 dark:text-rose-400"
                                : isWarning
                                ? "text-amber-600 dark:text-amber-400"
                                : "text-emerald-600 dark:text-emerald-400"
                            )}
                          >
                            {currentQty.toLocaleString(undefined, {
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 2,
                            })}
                          </span>
                          <span className="text-xs text-slate-500">
                            {item.unit_of_measure}
                          </span>
                        </div>

                        {/* Progress Bar indicator */}
                        {reorder > 0 && (
                          <div className="w-24 bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={cn(
                                "h-full rounded-full transition-all duration-300",
                                isCritical
                                  ? "bg-rose-500"
                                  : isWarning
                                  ? "bg-amber-500"
                                  : "bg-emerald-500"
                              )}
                              style={{ width: `${Math.max(4, healthPercent)}%` }}
                            />
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Reorder Level */}
                    <td className="px-4 py-3.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                      <span>
                        {reorder.toLocaleString(undefined, {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 2,
                        })}{" "}
                        {item.unit_of_measure}
                      </span>
                    </td>

                    {/* Deficit / Shortage */}
                    <td className="px-4 py-3.5">
                      {deficit > 0 ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-rose-50 px-2 py-0.5 text-xs font-bold text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-900">
                          -{deficit.toLocaleString(undefined, {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 2,
                          })}{" "}
                          {item.unit_of_measure}
                        </span>
                      ) : (
                        <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                          Optimal
                        </span>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td className="px-4 py-3.5">
                      {renderStatusBadge(item.status, item.severity)}
                    </td>

                    {/* Quick Actions */}
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link to="/operations/receipts">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-2 text-xs gap-1 border-primary/20 text-primary hover:bg-primary/5"
                            title="Create Vendor Receipt to replenish"
                          >
                            <ArrowDownToLine className="h-3 w-3" />
                            <span>Restock</span>
                          </Button>
                        </Link>
                        <Link to="/operations/adjustments">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                            title="Reconcile / Adjust Count"
                          >
                            <SlidersHorizontal className="h-3.5 w-3.5" />
                          </Button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900">
        <div className="text-xs text-slate-500">
          Showing{" "}
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            {total === 0 ? 0 : (page - 1) * pageSize + 1}
          </span>{" "}
          to{" "}
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            {Math.min(page * pageSize, total)}
          </span>{" "}
          of{" "}
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            {total}
          </span>{" "}
          items
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1 || isLoading}
            onClick={() => onPageChange(page - 1)}
            className="h-8 w-8 p-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <span className="text-xs font-medium text-slate-600 dark:text-slate-300 px-2">
            Page {page} of {pages}
          </span>

          <Button
            variant="outline"
            size="sm"
            disabled={page >= pages || isLoading}
            onClick={() => onPageChange(page + 1)}
            className="h-8 w-8 p-0"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
