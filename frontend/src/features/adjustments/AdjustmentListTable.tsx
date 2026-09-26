import React from "react";
import { AdjustmentStatus, InventoryAdjustment } from "@/types/adjustment";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/button";
import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  SlidersHorizontal,
} from "lucide-react";

interface AdjustmentListTableProps {
  adjustments: InventoryAdjustment[];
  isLoading: boolean;
  total: number;
  page: number;
  pageSize: number;
  pages: number;
  onPageChange: (newPage: number) => void;
  onSelectAdjustment: (adjustment: InventoryAdjustment) => void;
  onSort: (field: string) => void;
  sortBy: string;
  sortOrder: "asc" | "desc";
}

export const AdjustmentListTable: React.FC<AdjustmentListTableProps> = ({
  adjustments,
  isLoading,
  total,
  page,
  pageSize,
  pages,
  onPageChange,
  onSelectAdjustment,
  onSort,
  sortBy,
  sortOrder,
}) => {

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="mt-3 text-sm text-slate-500">Loading adjustments...</p>
      </div>
    );
  }

  if (adjustments.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-12 text-center">
        <SlidersHorizontal className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
        <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
          No Inventory Adjustments
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
          No physical count adjustment records found. Create one to reconcile stock discrepancies.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 font-medium text-xs">
              <th
                className="py-3.5 px-4 cursor-pointer hover:text-slate-900 dark:hover:text-white"
                onClick={() => onSort("adjustment_number")}
              >
                <div className="flex items-center gap-1.5">
                  <span>Adjustment #</span>
                  <ArrowUpDown className="h-3.5 w-3.5 opacity-60" />
                </div>
              </th>
              <th className="py-3.5 px-4">Product / SKU</th>
              <th className="py-3.5 px-4">Location</th>
              <th className="py-3.5 px-4 text-right">System Qty</th>
              <th className="py-3.5 px-4 text-right">Counted Qty</th>
              <th
                className="py-3.5 px-4 text-right cursor-pointer hover:text-slate-900 dark:hover:text-white"
                onClick={() => onSort("difference")}
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>Difference</span>
                  <ArrowUpDown className="h-3.5 w-3.5 opacity-60" />
                </div>
              </th>
              <th className="py-3.5 px-4">Status</th>
              <th
                className="py-3.5 px-4 cursor-pointer hover:text-slate-900 dark:hover:text-white"
                onClick={() => onSort("created_at")}
              >
                <div className="flex items-center gap-1.5">
                  <span>Created</span>
                  <ArrowUpDown className="h-3.5 w-3.5 opacity-60" />
                </div>
              </th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {adjustments.map((adj) => {
              const diff = parseFloat(String(adj.difference));
              const isPositive = diff > 0;
              const isZero = diff === 0;

              return (
                <tr
                  key={adj.id}
                  onClick={() => onSelectAdjustment(adj)}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition-colors"
                >
                  <td className="py-3.5 px-4 font-semibold text-indigo-600 dark:text-indigo-400 text-xs">
                    {adj.adjustment_number}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-medium text-xs text-slate-900 dark:text-slate-100">
                      {adj.product?.name || "Product"}
                    </div>
                    <div className="text-[11px] text-slate-400">SKU: {adj.product?.sku}</div>
                  </td>
                  <td className="py-3.5 px-4 text-xs text-slate-700 dark:text-slate-300">
                    <div className="font-medium">{adj.location?.name || "Location"}</div>
                    <div className="text-[11px] text-slate-400">{adj.location?.code}</div>
                  </td>
                  <td className="py-3.5 px-4 text-right text-xs text-slate-500">
                    {parseFloat(String(adj.previous_quantity)).toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 text-right text-xs font-semibold text-slate-800 dark:text-slate-200">
                    {parseFloat(String(adj.counted_quantity)).toLocaleString()}{" "}
                    <span className="text-[10px] font-normal text-slate-400">
                      {adj.product?.unit_of_measure}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right text-xs font-bold">
                    <span
                      className={
                        isZero
                          ? "text-slate-400"
                          : isPositive
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-rose-600 dark:text-rose-400"
                      }
                    >
                      {isPositive ? `+${diff.toLocaleString()}` : diff.toLocaleString()}
                    </span>
                  </td>
                  <td className="py-3.5 px-4"><StatusBadge status={adj.status === "DONE" ? "APPLIED" : adj.status} /></td>
                  <td className="py-3.5 px-4 text-xs text-slate-500 dark:text-slate-400">
                    <div>{new Date(adj.created_at).toLocaleDateString()}</div>
                    <div className="text-[11px] text-slate-400">by {adj.created_by_name || "User"}</div>
                  </td>
                  <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onSelectAdjustment(adj)}
                      className="h-8 w-8 p-0 text-slate-500 hover:text-indigo-600"
                      title="View Details"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 gap-3">
        <div className="text-xs text-slate-500">
          Showing <span className="font-medium">{adjustments.length}</span> of{" "}
          <span className="font-medium">{total}</span> adjustments
        </div>
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            className="h-8 px-2 text-xs"
          >
            <ChevronLeft className="h-4 w-4 mr-1" /> Previous
          </Button>
          <span className="text-xs px-2 text-slate-600 dark:text-slate-300">
            Page {page} of {pages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= pages}
            onClick={() => onPageChange(page + 1)}
            className="h-8 px-2 text-xs"
          >
            Next <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
};
